import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { validarParticipante, yaEstaAgregado } from '../domain/salidas';
import type { Participante } from '../domain/types';
import { leerContactos } from '../services/contactos';
import type { ContactoTelefono } from '../services/contactos';
import { colores } from './tema';

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
      <View style={styles.container}>
        <View style={styles.cabecera}>
          <Text style={styles.titulo}>Agregar participante</Text>
          <Pressable onPress={onCerrar} hitSlop={12}>
            <Text style={styles.cerrar}>Listo</Text>
          </Pressable>
        </View>

        <View style={styles.pestanas}>
          {(['contactos', 'manual'] as const).map((p) => (
            <Pressable
              key={p}
              style={[styles.pestana, pestana === p && styles.pestanaActiva]}
              onPress={() => setPestana(p)}
            >
              <Text style={[styles.pestanaTexto, pestana === p && styles.pestanaTextoActivo]}>
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
          <Animated.View pointerEvents="none" style={[styles.toast, { opacity: opacidad }]}>
            <Text style={styles.toastTexto}>{toast}</Text>
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
      <View style={styles.centro}>
        <Text style={styles.texto}>
          Elige a tus amigos de tu agenda. Solo leemos nombre y número, y no salen del teléfono.
        </Text>
        <Pressable style={styles.boton} onPress={cargar}>
          <Text style={styles.botonTexto}>Leer mis contactos</Text>
        </Pressable>
      </View>
    );
  }

  if (estado.tipo === 'cargando') {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (estado.tipo === 'fallo') {
    return (
      <View style={styles.centro}>
        <Text style={styles.texto}>
          {estado.motivo === 'denegado'
            ? 'Sin permiso de contactos no podemos mostrar tu agenda. No pasa nada: puedes agregar a tus amigos a mano.'
            : 'No pudimos leer tus contactos. Puedes agregar a tus amigos a mano.'}
        </Text>
        <Pressable style={styles.boton} onPress={irAManual}>
          <Text style={styles.botonTexto}>Agregar a mano</Text>
        </Pressable>
      </View>
    );
  }

  const filtro = busqueda.trim().toLowerCase();
  const visibles = estado.contactos.filter((c) => c.nombre.toLowerCase().includes(filtro));

  return (
    <View style={{ flex: 1 }}>
      <TextInput
        style={styles.input}
        value={busqueda}
        onChangeText={setBusqueda}
        placeholder="Buscar contacto"
      />
      {aviso && <Text style={styles.error}>{aviso}</Text>}
      <FlatList
        data={visibles}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={<Text style={styles.vacio}>Sin resultados</Text>}
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
      style={[styles.fila, agregado && styles.filaAgregada]}
      onPress={onPress}
      disabled={agregado}
    >
      <View style={{ flex: 1 }}>
        <Text style={styles.filaNombre}>{contacto.nombre}</Text>
        <Text style={styles.filaDetalle}>{contacto.telefono ?? 'sin celular válido'}</Text>
      </View>
      {agregado && (
        <Animated.View style={[styles.check, { transform: [{ scale: escala }] }]}>
          <Text style={styles.checkTexto}>✓</Text>
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
    <View style={styles.formulario}>
      <Text style={styles.etiqueta}>Nombre</Text>
      <TextInput
        style={[styles.input, errores.nombre && styles.inputError]}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Beto"
        autoCapitalize="words"
      />
      {errores.nombre && <Text style={styles.error}>{errores.nombre}</Text>}

      <Text style={styles.etiqueta}>Celular (opcional)</Text>
      <TextInput
        style={[styles.input, errores.telefono && styles.inputError]}
        value={telefono}
        onChangeText={setTelefono}
        placeholder="987654321"
        keyboardType="number-pad"
        maxLength={12}
      />
      {errores.telefono && <Text style={styles.error}>{errores.telefono}</Text>}
      <Text style={styles.ayuda}>Con el celular podrás cobrarle por WhatsApp.</Text>

      {errores.general && <Text style={styles.error}>{errores.general}</Text>}

      <Pressable style={styles.boton} onPress={agregar}>
        <Text style={styles.botonTexto}>Agregar</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colores.fondo, padding: 16, paddingTop: 48 },
  cabecera: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: 'bold' },
  cerrar: { color: colores.primario, fontWeight: '600', fontSize: 16 },
  pestanas: { flexDirection: 'row', marginVertical: 16, gap: 8 },
  pestana: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: colores.fondoSuave,
  },
  pestanaActiva: { backgroundColor: colores.primario },
  pestanaTexto: { fontWeight: '600', color: colores.texto },
  pestanaTextoActivo: { color: '#fff' },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 16, padding: 8 },
  texto: { textAlign: 'center', color: colores.textoSuave },
  boton: {
    backgroundColor: colores.primario,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    alignSelf: 'stretch',
    marginTop: 8,
  },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  input: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    marginBottom: 6,
  },
  inputError: { borderColor: colores.error },
  error: { color: colores.error, marginBottom: 6 },
  ayuda: { color: colores.textoSuave, marginBottom: 8 },
  etiqueta: { fontWeight: '600', marginBottom: 6, marginTop: 8 },
  formulario: { flex: 1 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  filaAgregada: { opacity: 0.55 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colores.primario,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTexto: { color: '#fff', fontWeight: 'bold' },
  toast: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: colores.texto,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 24,
  },
  toastTexto: { color: '#fff', fontWeight: '600' },
  filaNombre: { fontSize: 16, fontWeight: '500' },
  filaDetalle: { color: colores.textoSuave, marginTop: 2 },
  vacio: { textAlign: 'center', color: colores.textoSuave, marginTop: 24 },
});
