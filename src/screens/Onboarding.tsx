import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import { validarPerfil } from '../domain/perfil';
import { Boton, Entrada, Etiqueta, TextoError } from './ui';

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
      className="flex-1 justify-center bg-slate-50 p-6 dark:bg-slate-900"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Text className="text-center text-6xl">🐷</Text>
      <Text className="mt-2 text-center text-3xl font-bold text-slate-900 dark:text-slate-50">
        Bienvenido a Chanchita
      </Text>
      <Text className="mb-6 mt-2 text-center text-slate-600 dark:text-slate-400">
        Dos datos y listo. Tu número de Yape aparecerá en los mensajes de cobro.
      </Text>

      <View>
        <Etiqueta>Tu nombre</Etiqueta>
        <Entrada
          conError={!!errores.nombre}
          value={nombre}
          onChangeText={setNombre}
          placeholder="Ej. Jesús"
          autoCapitalize="words"
          returnKeyType="next"
        />
        {errores.nombre && <TextoError>{errores.nombre}</TextoError>}
      </View>

      <View>
        <Etiqueta>Tu número de Yape</Etiqueta>
        <Entrada
          conError={!!errores.telefono}
          value={telefono}
          onChangeText={setTelefono}
          placeholder="987654321"
          keyboardType="number-pad"
          maxLength={11}
        />
        {errores.telefono && <TextoError>{errores.telefono}</TextoError>}
      </View>

      <Boton texto="Continuar" className="mt-6" onPress={continuar} deshabilitado={guardando} />
    </KeyboardAvoidingView>
  );
}
