import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { generarId } from '../domain/id';
import {
  asegurarOrganizador,
  crearOrganizador,
  esBorradorVacio,
  fechaHoyISO,
  validarSalida,
  yaEstaAgregado,
} from '../domain/salidas';
import type { Participante } from '../domain/types';
import AgregarParticipante from './AgregarParticipante';
import { colores } from './tema';

type Props = NativeStackScreenProps<RootStackParamList, 'NuevaSalida'>;

export default function NuevaSalida({ navigation }: Props) {
  const { perfil, salidas, borrador } = useApp();
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(fechaHoyISO());
  const [participantes, setParticipantes] = useState<Participante[]>(() =>
    perfil ? [crearOrganizador(perfil)] : [],
  );
  const [errores, setErrores] = useState<{ nombre?: string; fecha?: string; participantes?: string }>(
    {},
  );
  const [agregando, setAgregando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  // El borrador se guarda solo cuando ya terminó de cargar el anterior (si no, lo pisaríamos vacío).
  const borradorCargado = useRef(false);

  useEffect(() => {
    borrador.leer().then((guardado) => {
      if (guardado && perfil) {
        setNombre(guardado.nombre);
        setFecha(guardado.fecha);
        setParticipantes(asegurarOrganizador(guardado.participantes, perfil));
      }
      borradorCargado.current = true;
    });
  }, [borrador, perfil]);

  // Cada cambio se guarda: así no se pierde al retroceder ni al cerrar la app.
  useEffect(() => {
    if (!borradorCargado.current) return;
    if (esBorradorVacio(nombre, participantes)) void borrador.borrar();
    else void borrador.guardar({ nombre, fecha, participantes });
  }, [nombre, fecha, participantes, borrador]);

  function empezarDeNuevo() {
    setNombre('');
    setFecha(fechaHoyISO());
    setErrores({});
    if (perfil) setParticipantes([crearOrganizador(perfil)]);
  }

  function agregar(nombreNuevo: string, telefono?: string): string | null {
    if (yaEstaAgregado(participantes, nombreNuevo, telefono)) {
      return `${nombreNuevo} ya está en la salida`;
    }
    setParticipantes((prev) => [...prev, { id: generarId(), nombre: nombreNuevo, telefono }]);
    return null;
  }

  function quitar(id: string) {
    setParticipantes((prev) => prev.filter((p) => p.id !== id));
  }

  async function crear() {
    const r = validarSalida(nombre, fecha, participantes);
    if (!r.ok) {
      setErrores(r.errores);
      return;
    }
    setErrores({});
    setGuardando(true);
    try {
      const salida = {
        id: generarId(),
        nombre: nombre.trim(),
        fecha,
        participantes,
        gastos: [],
      };
      await salidas.guardar(salida);
      borradorCargado.current = false; // evita que el efecto vuelva a guardar el borrador
      await borrador.borrar();
      navigation.replace('DetalleSalida', { salidaId: salida.id });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      {!esBorradorVacio(nombre, participantes) && (
        <View style={styles.avisoBorrador}>
          <Text style={styles.avisoTexto}>Borrador guardado automáticamente</Text>
          <Pressable onPress={empezarDeNuevo} hitSlop={10}>
            <Text style={styles.avisoAccion}>Empezar de nuevo</Text>
          </Pressable>
        </View>
      )}
      <Text style={styles.etiqueta}>Nombre de la salida</Text>
      <TextInput
        style={[styles.input, errores.nombre && styles.inputError]}
        value={nombre}
        onChangeText={setNombre}
        placeholder="Ej. Pizza del viernes"
      />
      {errores.nombre && <Text style={styles.error}>{errores.nombre}</Text>}

      <Text style={styles.etiqueta}>Fecha</Text>
      <TextInput
        style={[styles.input, errores.fecha && styles.inputError]}
        value={fecha}
        onChangeText={setFecha}
        placeholder="AAAA-MM-DD"
        keyboardType="numbers-and-punctuation"
        maxLength={10}
      />
      {errores.fecha && <Text style={styles.error}>{errores.fecha}</Text>}

      <Text style={styles.etiqueta}>Participantes ({participantes.length})</Text>
      {participantes.map((p) => (
        <View key={p.id} style={styles.fila}>
          <View style={{ flex: 1 }}>
            <Text style={styles.filaNombre}>
              {p.nombre}
              {p.esOrganizador ? ' (tú)' : ''}
            </Text>
            <Text style={styles.filaDetalle}>{p.telefono ?? 'sin celular'}</Text>
          </View>
          {!p.esOrganizador && (
            <Pressable onPress={() => quitar(p.id)} hitSlop={10}>
              <Text style={styles.quitar}>Quitar</Text>
            </Pressable>
          )}
        </View>
      ))}
      {errores.participantes && <Text style={styles.error}>{errores.participantes}</Text>}

      <Pressable style={styles.botonSecundario} onPress={() => setAgregando(true)}>
        <Text style={styles.botonSecundarioTexto}>+ Agregar participante</Text>
      </Pressable>

      <Pressable
        style={[styles.boton, guardando && { opacity: 0.6 }]}
        onPress={crear}
        disabled={guardando}
      >
        <Text style={styles.botonTexto}>Crear salida</Text>
      </Pressable>

      <AgregarParticipante
        visible={agregando}
        participantes={participantes}
        onCerrar={() => setAgregando(false)}
        onAgregar={agregar}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  avisoBorrador: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colores.fondoSuave,
    borderRadius: 8,
    padding: 10,
    marginBottom: 4,
  },
  avisoTexto: { color: colores.textoSuave, fontSize: 13 },
  avisoAccion: { color: colores.primario, fontWeight: '600', fontSize: 13 },
  container: { padding: 16, backgroundColor: colores.fondo, flexGrow: 1 },
  etiqueta: { fontWeight: '600', marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  inputError: { borderColor: colores.error },
  error: { color: colores.error, marginTop: 4 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  filaNombre: { fontSize: 16, fontWeight: '500' },
  filaDetalle: { color: colores.textoSuave, marginTop: 2 },
  quitar: { color: colores.error, fontWeight: '600' },
  botonSecundario: {
    borderWidth: 1,
    borderColor: colores.primario,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  botonSecundarioTexto: { color: colores.primario, fontWeight: '600' },
  boton: {
    backgroundColor: colores.primario,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
