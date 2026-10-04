import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  inner: { 
    flex: 1, 
    padding: 24, 
    justifyContent: 'center', 
    maxWidth: 500, 
    width: '100%', 
    alignSelf: 'center' 
  },
  title: { 
    fontSize: 32, 
    fontWeight: 'bold', 
    color: '#fff', 
    marginBottom: 12, 
    textAlign: 'center' 
  },
  subtitle: { 
    fontSize: 15, 
    color: '#aaa', 
    marginBottom: 28, 
    textAlign: 'center', 
    lineHeight: 22 
  },
  input: { 
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
  button: { 
    backgroundColor: '#208AEF', 
    padding: 16, 
    borderRadius: 12, 
    alignItems: 'center' 
  },
  buttonDisabled: { 
    opacity: 0.6 
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  modalContainer: { 
    backgroundColor: '#181818', 
    borderRadius: 16, 
    padding: 24, 
    width: '100%', 
    maxWidth: 340, 
    borderWidth: 1, 
    borderColor: '#333', 
    alignItems: 'center' 
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 12 
  },
  modalMessage: { 
    color: '#ddd', 
    fontSize: 15, 
    textAlign: 'center', 
    marginBottom: 20, 
    lineHeight: 22 
  },
  modalButton: { 
    paddingVertical: 12, 
    paddingHorizontal: 30, 
    borderRadius: 10, 
    width: '100%', 
    alignItems: 'center' 
  },
  modalButtonText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 16 
  }
});