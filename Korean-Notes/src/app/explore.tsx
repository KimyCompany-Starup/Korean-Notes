import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Modal, LayoutAnimation, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

interface NotaCoreano {
  tema: string;
  emoji?: string;
  palabraCoreana: string;
  significado: string;
  fraseEjemplo: string;
  significadoFrase: string;
  pronunciacion?: string;
}

export default function ExploreScreen() {
  const [temasMap, setTemasMap] = useState<{ [key: string]: NotaCoreano[] }>({});
  const [refreshing, setRefreshing] = useState(false);
  
  // Estado para controlar cuáles temas están abiertos
  const [expandedThemes, setExpandedThemes] = useState<{ [key: string]: boolean }>({});

  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedPronunciation, setSelectedPronunciation] = useState('');

  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [noteToDeleteIndex, setNoteToDeleteIndex] = useState<number | null>(null);
  const [themeToDelete, setThemeToDelete] = useState<string | null>(null);

  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [alertTitle, setAlertTitle] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState<'success' | 'error'>('success');

  const showAlert = (title: string, message: string, type: 'success' | 'error') => {
    setAlertTitle(title);
    setAlertMessage(message);
    setAlertType(type);
    setAlertModalVisible(true);
  };

  const loadNotes = async () => {
    try {
      const dataJSON = await AsyncStorage.getItem('@korean_notes_data');
      if (dataJSON) {
        const notas: NotaCoreano[] = JSON.parse(dataJSON);
        
        const agrupados = notas.reduce((acc: { [key: string]: NotaCoreano[] }, nota) => {
          const tema = nota.tema || 'General';
          if (!acc[tema]) acc[tema] = [];
          acc[tema].push(nota);
          return acc;
        }, {});

        setTemasMap(agrupados);
      } else {
        setTemasMap({});
      }
    } catch (error) {
      console.error("Error al cargar notas:", error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadNotes();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadNotes();
    setRefreshing(false);
  };

  const toggleTheme = (tema: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedThemes(prev => ({ ...prev, [tema]: !prev[tema] }));
  };

  const confirmDelete = (tema: string, indexInTheme: number) => {
    setThemeToDelete(tema);
    setNoteToDeleteIndex(indexInTheme);
    setDeleteModalVisible(true);
  };

  const executeDelete = async () => {
    if (themeToDelete === null || noteToDeleteIndex === null) return;

    try {
      const dataJSON = await AsyncStorage.getItem('@korean_notes_data');
      if (!dataJSON) return;

      const notas: NotaCoreano[] = JSON.parse(dataJSON);
      const notaABorrar = temasMap[themeToDelete][noteToDeleteIndex];
      const realIndex = notas.findIndex(
        n => n.palabraCoreana === notaABorrar.palabraCoreana && n.tema === notaABorrar.tema
      );

      if (realIndex > -1) {
        notas.splice(realIndex, 1);
        await AsyncStorage.setItem('@korean_notes_data', JSON.stringify(notas));
        await loadNotes();
        setDeleteModalVisible(false);
        showAlert("¡Éxito!", "La nota ha sido eliminada correctamente.", "success");
      }
    } catch (error) {
      console.error("Error al borrar nota:", error);
      setDeleteModalVisible(false);
      showAlert("¡Error!", "No se pudo eliminar la nota.", "error");
    }
  };

  const temasKeys = Object.keys(temasMap);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Temas de Estudio</Text>
        <Text style={styles.subtitle}>Vocabulario organizado automáticamente por la IA</Text>
      </View>

      {temasKeys.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Aún no tienes notas guardadas.</Text>
          <Text style={styles.emptySubtext}>Agrega palabras en la pestaña Home para empezar.</Text>
        </View>
      ) : (
        <View style={styles.sectionsWrapper}>
          {temasKeys.map((tema) => {
            const notasTema = temasMap[tema];
            const emojiTema = notasTema[0]?.emoji || '📁';
            const isOpen = !!expandedThemes[tema];

            return (
              <View key={tema} style={styles.folderCard}>
                <TouchableOpacity 
                  style={styles.folderHeader} 
                  activeOpacity={0.8}
                  onPress={() => toggleTheme(tema)}
                >
                  <View style={styles.folderTitleRow}>
                    <Text style={styles.folderEmoji}>{emojiTema}</Text>
                    <Text style={styles.folderTitleText}>{tema} ({notasTema.length})</Text>
                  </View>
                  <Ionicons 
                    name={isOpen ? "chevron-up" : "chevron-down"} 
                    size={22} 
                    color="#aaa" 
                  />
                </TouchableOpacity>

                {isOpen && (
                  <View style={styles.cardsList}>
                    {notasTema.map((item, index) => (
                      <View key={index} style={styles.card}>
                        <View style={styles.cardActions}>
                          <TouchableOpacity 
                            onPress={() => {
                              setSelectedPronunciation(item.pronunciacion || `Pronunciación sugerida para: ${item.palabraCoreana}`);
                              setInfoModalVisible(true);
                            }} 
                            style={styles.actionIcon}
                          >
                            <Ionicons name="information-circle-outline" size={20} color="#208AEF" />
                          </TouchableOpacity>

                          <TouchableOpacity 
                            onPress={() => confirmDelete(tema, index)} 
                            style={styles.actionIcon}
                          >
                            <Ionicons name="trash-outline" size={19} color="#e74c3c" />
                          </TouchableOpacity>
                        </View>

                        <View style={styles.wordHeader}>
                          <Text style={styles.koreanWord}>{item.palabraCoreana}</Text>
                          <Text style={styles.spanishMeaning}>{item.significado}</Text>
                        </View>

                        <View style={styles.exampleContainer}>
                          <Text style={styles.exampleKorean}>🇰🇷 {item.fraseEjemplo}</Text>
                          <Text style={styles.exampleSpanish}>🇪🇸 {item.significadoFrase}</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Modales */}
      <Modal transparent={true} visible={infoModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitleInfo}>🗣️ Guía de Pronunciación</Text>
            <Text style={styles.modalMessage}>{selectedPronunciation}</Text>
            <TouchableOpacity style={styles.modalButtonPrimary} onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.modalButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal transparent={true} visible={deleteModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitleError}>⚠️ Confirmar Eliminación</Text>
            <Text style={styles.modalMessage}>¿Estás seguro de que deseas borrar esta palabra de tus notas?</Text>
            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonDelete} onPress={executeDelete}>
                <Text style={styles.modalButtonText}>Borrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent={true} visible={alertModalVisible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={[styles.modalTitle, { color: alertType === 'success' ? '#2ecc71' : '#e74c3c' }]}>
              {alertTitle}
            </Text>
            <Text style={styles.modalMessage}>{alertMessage}</Text>
            <TouchableOpacity 
              style={[styles.modalButtonPrimary, { backgroundColor: alertType === 'success' ? '#2ecc71' : '#e74c3c' }]} 
              onPress={() => setAlertModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: 
  { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  contentContainer: 
  { 
    padding: 20, 
    paddingBottom: 60 
  },
  header: 
  { 
    marginTop: 40, 
    marginBottom: 20, 
    paddingHorizontal: 4 
  },
  title: 
  { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 6 
  },
  subtitle: 
  { 
    fontSize: 14, 
    color: '#888' 
  },
  sectionsWrapper: 
  { 
    gap: 14 
  },
  folderCard: 
  {
    backgroundColor: '#121212',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#262626',
    overflow: 'hidden',
  },
  folderHeader: 
  {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  folderTitleRow: 
  {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  folderEmoji: 
  {
    fontSize: 20,
  },
  folderTitleText: 
  {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptyContainer: 
  { 
    marginTop: 100, 
    alignItems: 'center', 
    paddingHorizontal: 20 
  },
  emptyText: 
  { 
    color: '#fff', 
    fontSize: 18, 
    fontWeight: '600', 
    marginBottom: 8, 
    textAlign: 'center' 
  },
  emptySubtext: 
  { 
    color: '#666', 
    fontSize: 14, 
    textAlign: 'center' 
  },
  cardsList: 
  { 
    gap: 12, 
    padding: 14, 
    borderTopWidth: 1, 
    borderTopColor: '#222', 
    backgroundColor: '#0a0a0a',
    width: '100%' 
  },
  card: 
  { 
    backgroundColor: '#161616', 
    borderRadius: 12, 
    padding: 16, 
    borderWidth: 1, 
    borderColor: '#262626',
    width: '100%',
    overflow: 'hidden',
    position: 'relative'
  },
  cardActions: 
  {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
    zIndex: 10
  },
  actionIcon: 
  {
    padding: 4,
    backgroundColor: '#202020',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#333'
  },
  wordHeader: 
  { 
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 12,
    paddingRight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    paddingBottom: 10
  },
  koreanWord: 
  { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#208AEF' 
  },
  spanishMeaning: 
  { 
    fontSize: 15, 
    fontWeight: '500', 
    color: '#fff', 
    flexWrap: 'wrap' 
  },
  exampleContainer: 
  { 
    gap: 6, 
    backgroundColor: '#111', 
    padding: 10, 
    borderRadius: 8 
  },
  exampleKorean: 
  { 
    fontSize: 14, 
    color: '#eee', 
    flexWrap: 'wrap' 
  },
  exampleSpanish: 
  { 
    fontSize: 13, 
    color: '#aaa', 
    flexWrap: 'wrap' 
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
  modalTitleInfo: 
  { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#208AEF', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  modalTitleError: 
  { 
    fontSize: 20, 
    fontWeight: 'bold', 
    color: '#e74c3c', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  modalMessage: 
  { 
    color: '#ddd', 
    fontSize: 15, 
    textAlign: 'center', 
    marginBottom: 20, 
    lineHeight: 22 
  },
  modalButtonsRow: 
  { 
    flexDirection: 'row', 
    gap: 12, 
    width: '100%' 
  },
  modalButtonPrimary: 
  { 
    backgroundColor: '#208AEF', 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 10, 
    width: '100%', 
    alignItems: 'center' 
  },
  modalButtonCancel: 
  { 
    flex: 1, 
    backgroundColor: '#333', 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  modalButtonDelete: 
  { 
    flex: 1, 
    backgroundColor: '#e74c3c', 
    paddingVertical: 12, 
    borderRadius: 10, 
    alignItems: 'center' 
  },
  modalButtonText: 
  { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 15 
  }
});