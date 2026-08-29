import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { GoogleGenAI } from '@google/genai';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ai = new GoogleGenAI({ apiKey: process.env.EXPO_PUBLIC_GEMINI_API_KEY });
const STORAGE_KEY = '@korean_notes_data';

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
    setLoading(true);

    try {
      const prompt = `
        Analiza la siguiente palabra o nota de coreano: "${inputWord}".
        Clasifícala en una categoría temática adecuada en Español (por ejemplo: Comida, Verbos, Saludos, Viajes, etc.).
        Asigna también un único emoji representativo para ese tema (por ejemplo 👋 para Saludos, 🍔 para Comida). Si no hay un emoji claro, déjalo en blanco.
        Para la "pronunciacion", redacta una guía completa, ordenada y estructurada que incluya obligatoriamente:
        1. La pronunciación de la palabra principal de forma fluida y continua entre paréntesis (sin guiones por sílabas).
        2. La pronunciación de la oración o frase de ejemplo completa de forma fluida y continua entre paréntesis.
        3. Breves tips de fonética o aclaraciones útiles.
        Escríbelo de forma muy clara indicando a qué corresponde cada una (por ejemplo: "Para la palabra principal..." y "Para la frase de ejemplo...").

        Devuelve la respuesta estrictamente en formato JSON plano con las siguientes llaves exactas:
        {
          "tema": "Nombre del tema",
          "emoji": "Emoji representativo o vacío",
          "palabraCoreana": "La palabra o frase en coreano",
          "significado": "Significado en español",
          "fraseEjemplo": "Oración corta de ejemplo en coreano usando la palabra",
          "significadoFrase": "Traducción de la frase al español",
          "pronunciacion": "Guía detallada explicando la pronunciación tanto de la palabra como de la frase de ejemplo"
        }
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
      });

      const textResponse = response.text;
      if (!textResponse) throw new Error("No se obtuvo respuesta de la IA");

      const cleanedJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedData = JSON.parse(cleanedJson);

      const existingDataJSON = await AsyncStorage.getItem(STORAGE_KEY);
      const existingData = existingDataJSON ? JSON.parse(existingDataJSON) : [];
      
      // --- VALIDACIÓN DE DUPLICADOS ---
      const palabraNueva = parsedData.palabraCoreana.trim().toLowerCase();
      const yaExiste = existingData.some(
        (nota: any) => nota.palabraCoreana.trim().toLowerCase() === palabraNueva
      );

      if (yaExiste) {
        setLoading(false);
        showAlert("Palabra duplicada", "Esa palabra ya está guardada en tus notas.", "error");
        return;
      }
      // --------------------------------

      const newData = [parsedData, ...existingData];
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newData));

      setInputWord('');
      showAlert("¡Éxito!", "¡Palabra guardada y organizada por la IA con éxito!", "success");
    } catch (error) {
      console.error("Error al procesar con Gemini:", error);
      showAlert("¡Error!", "Hubo un error al clasificar la palabra con la IA.", "error");
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
          Escribe una palabra, verbo o frase. La IA la clasificará automáticamente en tu libreta.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Ej: Annyeonghaseyo o Comprar boletos"
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

const styles = StyleSheet.create({
  container: 
  { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  inner: 
  { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center', 
    maxWidth: 500, 
    width: '100%', 
    alignSelf: 'center' 
  },
  title: 
  { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  subtitle: 
  { 
    fontSize: 15, 
    color: '#aaa', 
    marginBottom: 28, 
    textAlign: 'center', 
    lineHeight: 22 
  },
  input: 
  { 
    backgroundColor: '#121212', 
    color: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 20, 
    borderWidth: 1, 
    borderColor: '#262626',
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top'
  },
  button: 
  { 
    backgroundColor: '#208AEF', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  buttonDisabled: 
  { 
    opacity: 0.6 
  },
  buttonText: 
  { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  modalOverlay: 
  { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalContainer: 
  { 
    backgroundColor: '#181818', 
    borderRadius: 16, 
    padding: 24, 
    width: '100%', 
    maxWidth: 340, 
    borderWidth: 1, 
    borderColor: '#333', 
    alignItems: 'center' 
  },
  modalTitle: 
  { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  modalMessage: 
  { 
    color: '#ddd', 
    fontSize: 15, 
    textAlign: 'center', 
    marginBottom: 20, 
    lineHeight: 22 
  },
  modalButton: 
  { 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 10, 
    width: '100%', 
    alignItems: 'center' 
  },
  modalButtonText: 
  { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});