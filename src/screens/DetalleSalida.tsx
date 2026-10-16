import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { generarId } from '../domain/id';
import { formatearMonto } from '../domain/montos';
import { puedeQuitarParticipante, yaEstaAgregado } from '../domain/salidas';
import type { Salida } from '../domain/types';
import AgregarParticipante from './AgregarParticipante';
import { colores } from './tema';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleSalida'>;

export default function DetalleSalida({ route, navigation }: Props) {
  const { salidaId } = route.params;
  const { salidas } = useApp();
  const [salida, setSalida] = useState<Salida | null | undefined>(undefined); // undefined = cargando
  const [agregando, setAgregando] = useState(false);

  // Recarga al volver del formulario de gasto.
  useFocusEffect(
    useCallback(() => {
      salidas.obtener(salidaId).then(setSalida);
    }, [salidas, salidaId]),
  );

  useEffect(() => {
    if (salida) navigation.setOptions({ title: salida.nombre });
  }, [salida, navigation]);

  const guardar = useCallback(
    async (nueva: Salida) => {
      await salidas.guardar(nueva);
      setSalida(nueva);
    },
    [salidas],
  );

  if (salida === undefined) {
    return (
      <View style={styles.centro}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (salida === null) {
    return (
      <View style={styles.centro}>
        <Text>Esta salida ya no existe.</Text>
      </View>
    );
  }

  function agregar(nombre: string, telefono?: string): string | null {
    if (!salida) return null;
    if (yaEstaAgregado(salida.participantes, nombre, telefono)) {
      return `${nombre} ya está en la salida`;
    }
    void guardar({
      ...salida,
      participantes: [...salida.participantes, { id: generarId(), nombre, telefono }],
    });
    return null;
  }

  function quitar(id: string) {
    if (!salida) return;
    const r = puedeQuitarParticipante(salida, id);
    if (!r.ok) {
      Alert.alert('No se puede quitar', r.motivo);
      return;
    }
    void guardar({ ...salida, participantes: salida.participantes.filter((p) => p.id !== id) });
  }

  function confirmarEliminar() {
    if (!salida) return;
    Alert.alert('Eliminar salida', `¿Eliminar "${salida.nombre}" con todos sus gastos?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await salidas.eliminar(salida.id);
          navigation.goBack();
        },
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.titulo}>{salida.nombre}</Text>
      <Text style={styles.fecha}>{salida.fecha}</Text>

      <Text style={styles.seccion}>Participantes ({salida.participantes.length})</Text>
      {salida.participantes.map((p) => (
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

      <Pressable style={styles.botonSecundario} onPress={() => setAgregando(true)}>
        <Text style={styles.botonSecundarioTexto}>+ Agregar participante</Text>
      </Pressable>

      <Text style={styles.seccion}>Gastos</Text>
      {salida.gastos.length === 0 && <Text style={styles.suave}>Aún no hay gastos.</Text>}
      {salida.gastos.map((g) => {
        const nombre = (id: string) => salida.participantes.find((p) => p.id === id)?.nombre ?? '?';
        const entre =
          g.divididoEntre.length === salida.participantes.length
            ? 'todos'
            : g.divididoEntre.map(nombre).join(', ');
        return (
          <Pressable
            key={g.id}
            style={styles.fila}
            onPress={() => navigation.navigate('FormGasto', { salidaId: salida.id, gastoId: g.id })}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.filaNombre}>{g.descripcion}</Text>
              <Text style={styles.filaDetalle}>
                Pagó {nombre(g.pagadoPor)} · entre {entre}
              </Text>
            </View>
            <Text style={styles.filaNombre}>{formatearMonto(g.montoCentimos)}</Text>
          </Pressable>
        );
      })}
      {salida.gastos.length > 0 && (
        <Text style={styles.total}>
          Total: {formatearMonto(salida.gastos.reduce((suma, g) => suma + g.montoCentimos, 0))}
        </Text>
      )}
      <Pressable
        style={styles.botonSecundario}
        onPress={() => navigation.navigate('FormGasto', { salidaId: salida.id })}
      >
        <Text style={styles.botonSecundarioTexto}>+ Agregar gasto</Text>
      </Pressable>

      <Pressable style={styles.eliminar} onPress={confirmarEliminar}>
        <Text style={styles.eliminarTexto}>Eliminar salida</Text>
      </Pressable>

      <AgregarParticipante
        visible={agregando}
        participantes={salida.participantes}
        onCerrar={() => setAgregando(false)}
        onAgregar={agregar}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, backgroundColor: colores.fondo, flexGrow: 1 },
  titulo: { fontSize: 24, fontWeight: 'bold' },
  fecha: { color: colores.textoSuave, marginTop: 2 },
  seccion: { fontWeight: '700', fontSize: 16, marginTop: 24, marginBottom: 8 },
  suave: { color: colores.textoSuave },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  filaNombre: { fontSize: 16, fontWeight: '500' },
  filaDetalle: { color: colores.textoSuave, marginTop: 2 },
  total: { fontWeight: '700', fontSize: 16, textAlign: 'right', marginTop: 10 },
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
  eliminar: { marginTop: 40, padding: 12, alignItems: 'center' },
  eliminarTexto: { color: colores.error, fontWeight: '600' },
});
