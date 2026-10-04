import React, { useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { styles } from '../styles';

const STORAGE_KEY = '@korean_notes_data';

// --- Configuración Dinámica y Robusta para Groq ---
const getGroqConfig = () => {
  const extra = Constants.expoConfig?.extra || {};
  const apiKey = (extra.EXPO_PUBLIC_GROQ_API_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY || "").trim();
  const model = (extra.EXPO_PUBLIC_GROQ_MODEL || process.env.EXPO_PUBLIC_GROQ_MODEL || "qwen/qwen3.8-27b").trim();

  return { apiKey, model };
};

export default function HomeScreen() {
  const [inputWord, setInputWord] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados para el Modal de Alerta Personalizada
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState<'success' | 'error'>('success');

  const showAlert = (title: string, message: string, type: 'success' | 'error') => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  const handleSaveWord = async () => {
    if (!inputWord.trim()) return;

    const { apiKey, model } = getGroqConfig();
    if (!apiKey) {
      showAlert("Falta Configuración", "Por favor configura tu API Key de Groq en el app.json.", "error");
      return;
    }

    setLoading(true);

    try {
      const prompt = `
        Analiza la siguiente palabra, frase o nota de coreano: "${inputWord}".
        Clasifícala en una categoría temática adecuada en Español (por ejemplo: Comida, Verbos, Saludos, Viajes, Gramática, etc.).
        Asigna también un único emoji representativo para ese tema (por ejemplo 👋 para Saludos, 🍔 para Comida). Si no hay un emoji claro, déjalo en blanco.
        Para la "pronunciacion", redacta una guía completa, ordenada y estructurada que incluya obligatoriamente:
        1. La romanización y pronunciación de la palabra principal de forma fluida y continua entre paréntesis.
        2. La romanización y pronunciación de la oración o frase de ejemplo completa de forma fluida y continua entre paréntesis.
        3. Breves tips de fonética, reglas de 받침 (batchim) o aclaraciones útiles si aplican.
        Escríbelo de forma muy clara indicando a qué corresponde cada una.

        Devuelve la respuesta estrictamente en formato JSON plano con las siguientes llaves exactas y sin texto adicional ni bloques de código markdown:
        {
          "tema": "Nombre del tema",
          "emoji": "Emoji representativo o vacío",
          "palabraCoreana": "La palabra o frase en hangul (coreano)",
          "significado": "Significado en español",
          "fraseEjemplo": "Oración corta de ejemplo en coreano usando la palabra",
          "significadoFrase": "Traducción de la frase al español",
          "pronunciacion": "Guía detallada explicando la romanización y pronunciación tanto de la palabra como de la frase de ejemplo"
        }
      `;

      let response = await fetch(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [
              { role: "system", content: "Eres un asistente experto en coreano que responde únicamente en formato JSON plano sin bloques de código adicionales." },
              { role: "user", content: prompt }
            ],
            response_format: { type: "json_object" },
            temperature: 0.3
          }),
        }
      );

      let data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Error al comunicarse con la API de Groq");
      }

      const textResponse = data.choices?.[0]?.message?.content;
      if (!textResponse) throw new Error("No se obtuvo respuesta de la IA");

      const parsedData = JSON.parse(textResponse);

      const existingDataJSON = await AsyncStorage.getItem(STORAGE_KEY);
      const existingData = existingDataJSON ? JSON.parse(existingDataJSON) : [];
      
      // --- VALIDACIÓN DE DUPLICADOS ---
      const palabraNueva = parsedData.palabraCoreana.trim().toLowerCase();
      const yaExiste = existingData.some(
        (nota: any) => nota.palabraCoreana.trim().toLowerCase() === palabraNueva
      );

      if (yaExiste) {
        setLoading(false);
        showAlert("Palabra duplicada", "Esa palabra ya está guardada en tus notas de coreano.", "error");
        return;
      }
      // --------------------------------

      const newData = [parsedData, ...existingData];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

      setInputWord('');
      showAlert("¡Éxito!", "¡Palabra guardada y organizada por la IA con éxito!", "success");
    } catch (error: any) {
      console.error("Error al procesar con Groq:", error);
      showAlert("¡Error!", error.message || "Hubo un error al clasificar la palabra con la IA.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <View style={styles.inner}>
        <Text style={styles.title}>Korean Notes 🇰🇷</Text>
        <Text style={styles.subtitle}>
          Escribe una palabra, verbo o frase en coreano. La IA la clasificará automáticamente en tu libreta.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ejemplo: '안녕하세요' o '저는 학생이에요'"
          placeholderTextColor="#666"
          value={inputWord}
          onChangeText={setInputWord}
          multiline
        />

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSaveWord} 
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Organizar con IA</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Modal de Alerta Personalizada (Modo Oscuro) */}
      <Modal transparent={true} visible={modalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: modalType === 'success' ? '#2ecc71' : '#e74c3c' }]}>
              {modalTitle}
            </Text>
            <Text style={styles.modalMessage}>{modalMessage}</Text>
            <TouchableOpacity 
              style={[styles.modalButton, { backgroundColor: modalType === 'success' ? '#2ecc71' : '#e74c3c' }]} 
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}