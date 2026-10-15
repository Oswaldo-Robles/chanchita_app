import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useApp } from '../app/AppProvider';
import { validarPerfil } from '../domain/perfil';

export default function Onboarding() {
  const { guardarPerfil } = useApp();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [errores, setErrores] = useState<{ nombre?: string; telefono?: string }>({});
  const [guardando, setGuardando] = useState(false);

  async function continuar() {
    const resultado = validarPerfil(nombre, telefono);
    if (!resultado.ok) {
      setErrores(resultado.errores);
      return;
    }
    setErrores({});
    setGuardando(true);
    try {
      await guardarPerfil(resultado.perfil); // al guardar, la navegación pasa sola a Inicio
    } finally {
      setGuardando(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text style={styles.emoji}>🐷</Text>
      <Text style={styles.titulo}>Bienvenido a Chanchita</Text>
      <Text style={styles.subtitulo}>
        Dos datos y listo. Tu número de Yape aparecerá en los mensajes de cobro.
      </Text>

      <View style={styles.campo}>
        <Text style={styles.etiqueta}>Tu nombre</Text>
        <TextInput
          style={[styles.input, errores.nombre && styles.inputError]}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Jesús"
          autoCapitalize="words"
          returnKeyType="next"
        />
        {errores.nombre && <Text style={styles.error}>{errores.nombre}</Text>}
      </View>

      <View style={styles.campo}>
        <Text style={styles.etiqueta}>Tu número de Yape</Text>
        <TextInput
          style={[styles.input, errores.telefono && styles.inputError]}
          value={telefono}
          onChangeText={setTelefono}
          placeholder="987654321"
          keyboardType="number-pad"
          maxLength={11}
        />
        {errores.telefono && <Text style={styles.error}>{errores.telefono}</Text>}
      </View>

      <Pressable
        style={[styles.boton, guardando && styles.botonDeshabilitado]}
        onPress={continuar}
        disabled={guardando}
      >
        <Text style={styles.botonTexto}>Continuar</Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, justifyContent: 'center', backgroundColor: '#fff' },
  emoji: { fontSize: 56, textAlign: 'center' },
  titulo: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginTop: 8 },
  subtitulo: { textAlign: 'center', color: '#555', marginTop: 8, marginBottom: 28 },
  campo: { marginBottom: 16 },
  etiqueta: { fontWeight: '600', marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  inputError: { borderColor: '#d32f2f' },
  error: { color: '#d32f2f', marginTop: 4 },
  boton: {
    backgroundColor: '#e91e63',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  botonDeshabilitado: { opacity: 0.6 },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
