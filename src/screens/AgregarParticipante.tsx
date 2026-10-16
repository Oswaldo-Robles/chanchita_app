import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';

import { validarParticipante, yaEstaAgregado } from '../domain/salidas';
import type { Participante } from '../domain/types';
import { leerContactos } from '../services/contactos';
import type { ContactoTelefono } from '../services/contactos';
import { useTema } from './tema';
import { Boton, Entrada, Etiqueta, TextoError } from './ui';

type Props = {
  visible: boolean;
  /** Quienes ya están en la salida (para marcarlos en la lista de contactos). */
  participantes: Participante[];
  onCerrar: () => void;
  /** Devuelve un mensaje de error si no se pudo agregar (p. ej. duplicado). */
  onAgregar: (nombre: string, telefono?: string) => string | null;
};

type Pestana = 'contactos' | 'manual';

export default function AgregarParticipante({ visible, participantes, onCerrar, onAgregar }: Props) {
  const { toastFondo, toastTexto } = useTema();
  const [pestana, setPestana] = useState<Pestana>('contactos');
  const [toast, setToast] = useState<string | null>(null);
  const opacidad = useRef(new Animated.Value(0)).current;

  function mostrarToast(texto: string) {
    setToast(texto);
    opacidad.setValue(0);
    Animated.sequence([
      Animated.timing(opacidad, { toValue: 1, duration: 150, useNativeDriver: true }),
      Animated.delay(1100),
      Animated.timing(opacidad, { toValue: 0, duration: 250, useNativeDriver: true }),
    ]).start();
  }

  // Envuelve onAgregar: si se agregó bien, avisa con el toast.
  const agregarConAviso: Props['onAgregar'] = (nombre, telefono) => {
    const problema = onAgregar(nombre, telefono);
    if (!problema) mostrarToast(`✓ ${nombre} agregado`);
    return problema;
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onCerrar}>
      <View className="flex-1 bg-slate-50 p-4 pt-12 dark:bg-slate-900">
        <View className="flex-row items-center justify-between">
          <Text className="text-xl font-bold text-slate-900 dark:text-slate-50">
            Agregar participante
          </Text>
          <Pressable onPress={onCerrar} hitSlop={12}>
            <Text className="text-base font-semibold text-primary-700 dark:text-primary-400">
              Listo
            </Text>
          </Pressable>
        </View>

        <View className="my-4 flex-row gap-2">
          {(['contactos', 'manual'] as const).map((p) => (
            <Pressable
              key={p}
              className={
                pestana === p
                  ? 'flex-1 items-center rounded-lg bg-primary-600 p-2.5'
                  : 'flex-1 items-center rounded-lg bg-slate-100 p-2.5 dark:bg-slate-800'
              }
              onPress={() => setPestana(p)}
            >
              <Text
                className={
                  pestana === p
                    ? 'font-semibold text-white'
                    : 'font-semibold text-slate-700 dark:text-slate-200'
                }
              >
                {p === 'contactos' ? 'Mis contactos' : 'A mano'}
              </Text>
            </Pressable>
          ))}
        </View>

        {pestana === 'contactos' ? (
          <ListaContactos
            participantes={participantes}
            onAgregar={agregarConAviso}
            irAManual={() => setPestana('manual')}
          />
        ) : (
          <FormularioManual onAgregar={agregarConAviso} />
        )}

        {toast && (
          <Animated.View
            pointerEvents="none"
            style={{
              opacity: opacidad,
              position: 'absolute',
              bottom: 40,
              alignSelf: 'center',
              backgroundColor: toastFondo,
              paddingVertical: 10,
              paddingHorizontal: 18,
              borderRadius: 24,
            }}
          >
            <Text style={{ color: toastTexto, fontWeight: '600' }}>{toast}</Text>
          </Animated.View>
        )}
      </View>
    </Modal>
  );
}

function ListaContactos({
  participantes,
  onAgregar,
  irAManual,
}: {
  participantes: Participante[];
  onAgregar: Props['onAgregar'];
  irAManual: () => void;
}) {
  const { spinner } = useTema();
  const [estado, setEstado] = useState<
    | { tipo: 'inicial' }
    | { tipo: 'cargando' }
    | { tipo: 'listo'; contactos: ContactoTelefono[] }
    | { tipo: 'fallo'; motivo: 'denegado' | 'error' }
  >({ tipo: 'inicial' });
  const [busqueda, setBusqueda] = useState('');
  const [aviso, setAviso] = useState<string | null>(null);

  async function cargar() {
    setEstado({ tipo: 'cargando' });
    const r = await leerContactos();
    setEstado(r.ok ? { tipo: 'listo', contactos: r.contactos } : { tipo: 'fallo', motivo: r.motivo });
  }

  if (estado.tipo === 'inicial') {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-2">
        <Text className="text-center text-slate-600 dark:text-slate-400">
          Elige a tus amigos de tu agenda. Solo leemos nombre y número, y no salen del teléfono.
        </Text>
        <Boton texto="Leer mis contactos" className="self-stretch" onPress={cargar} />
      </View>
    );
  }

  if (estado.tipo === 'cargando') {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={spinner} />
      </View>
    );
  }

  if (estado.tipo === 'fallo') {
    return (
      <View className="flex-1 items-center justify-center gap-4 p-2">
        <Text className="text-center text-slate-600 dark:text-slate-400">
          {estado.motivo === 'denegado'
            ? 'Sin permiso de contactos no podemos mostrar tu agenda. No pasa nada: puedes agregar a tus amigos a mano.'
            : 'No pudimos leer tus contactos. Puedes agregar a tus amigos a mano.'}
        </Text>
        <Boton texto="Agregar a mano" className="self-stretch" onPress={irAManual} />
      </View>
    );
  }

  const filtro = busqueda.trim().toLowerCase();
  const visibles = estado.contactos.filter((c) => c.nombre.toLowerCase().includes(filtro));

  return (
    <View className="flex-1">
      <Entrada value={busqueda} onChangeText={setBusqueda} placeholder="Buscar contacto" />
      {aviso && <TextoError>{aviso}</TextoError>}
      <FlatList
        data={visibles}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text className="mt-6 text-center text-slate-600 dark:text-slate-400">Sin resultados</Text>
        }
        extraData={participantes}
        renderItem={({ item }) => (
          <FilaContacto
            contacto={item}
            agregado={yaEstaAgregado(participantes, item.nombre, item.telefono)}
            onPress={() => setAviso(onAgregar(item.nombre, item.telefono))}
          />
        )}
      />
    </View>
  );
}

function FilaContacto({
  contacto,
  agregado,
  onPress,
}: {
  contacto: ContactoTelefono;
  agregado: boolean;
  onPress: () => void;
}) {
  const escala = useRef(new Animated.Value(agregado ? 1 : 0)).current;
  const eraAgregado = useRef(agregado);

  // Al pasar de no agregado a agregado, el check "salta" con un resorte.
  useEffect(() => {
    if (agregado && !eraAgregado.current) {
      escala.setValue(0);
      Animated.spring(escala, { toValue: 1, friction: 4, tension: 160, useNativeDriver: true }).start();
    }
    eraAgregado.current = agregado;
  }, [agregado, escala]);

  return (
    <Pressable
      className={`flex-row items-center border-b border-slate-200 py-3 dark:border-slate-700 ${
        agregado ? 'opacity-60' : ''
      }`}
      onPress={onPress}
      disabled={agregado}
    >
      <View className="flex-1">
        <Text className="text-base font-medium text-slate-900 dark:text-slate-50">
          {contacto.nombre}
        </Text>
        <Text className="mt-0.5 text-slate-600 dark:text-slate-400">
          {contacto.telefono ?? 'sin celular válido'}
        </Text>
      </View>
      {agregado && (
        <Animated.View
          style={{
            transform: [{ scale: escala }],
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#e11d48',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>
        </Animated.View>
      )}
    </Pressable>
  );
}

function FormularioManual({ onAgregar }: { onAgregar: Props['onAgregar'] }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [errores, setErrores] = useState<{ nombre?: string; telefono?: string; general?: string }>(
    {},
  );

  function agregar() {
    const r = validarParticipante(nombre, telefono);
    if (!r.ok) {
      setErrores(r.errores);
      return;
    }
    const problema = onAgregar(r.nombre, r.telefono);
    if (problema) {
      setErrores({ general: problema });
      return;
    }
    setNombre('');
    setTelefono('');
    setErrores({});
  }

  return (
    <View className="flex-1">
      <Etiqueta>Nombre</Etiqueta>
      <Entrada
        conError={!!errores.nombre}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Beto"
        autoCapitalize="words"
      />
      {errores.nombre && <TextoError>{errores.nombre}</TextoError>}

      <Etiqueta>Celular (opcional)</Etiqueta>
      <Entrada
        conError={!!errores.telefono}
        value={telefono}
        onChangeText={setTelefono}
        placeholder="987654321"
        keyboardType="number-pad"
        maxLength={12}
      />
      {errores.telefono && <TextoError>{errores.telefono}</TextoError>}
      <Text className="mt-1.5 text-slate-600 dark:text-slate-400">
        Con el celular podrás cobrarle por WhatsApp.
      </Text>

      {errores.general && <TextoError>{errores.general}</TextoError>}

      <Boton texto="Agregar" className="mt-5" onPress={agregar} />
    </View>
  );
}
