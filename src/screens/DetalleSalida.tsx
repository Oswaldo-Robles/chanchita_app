import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { generarId } from '../domain/id';
import { totalGastos } from '../domain/gastos';
import { formatearMonto } from '../domain/montos';
import { puedeQuitarParticipante, yaEstaAgregado } from '../domain/salidas';
import type { Salida } from '../domain/types';
import AgregarParticipante from './AgregarParticipante';
import { useTema } from './tema';
import { Avatar, Boton } from './ui';

type Props = NativeStackScreenProps<RootStackParamList, 'DetalleSalida'>;

const NUMEROS = { fontVariant: ['tabular-nums' as const] };

export default function DetalleSalida({ route, navigation }: Props) {
  const { salidaId } = route.params;
  const { salidas } = useApp();
  const { spinner } = useTema();
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
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900">
        <ActivityIndicator size="large" color={spinner} />
      </View>
    );
  }
  if (salida === null) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900">
        <Text className="text-slate-900 dark:text-slate-50">Esta salida ya no existe.</Text>
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

  const nombreDe = (id: string) => salida.participantes.find((p) => p.id === id)?.nombre ?? '?';
  const total = totalGastos(salida.gastos);

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <View className="rounded-2xl bg-primary-600 p-5">
        <Text className="text-white">{salida.fecha}</Text>
        <Text className="mt-1 text-4xl font-bold text-white" style={NUMEROS}>
          {formatearMonto(total)}
        </Text>
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row">
            {salida.participantes.map((p, i) => (
              <Avatar key={p.id} nombre={p.nombre} indice={i} className="-mr-2 border-2 border-primary-600" />
            ))}
          </View>
          <Text className="font-semibold text-white">
            {salida.gastos.length === 1 ? '1 gasto' : `${salida.gastos.length} gastos`}
          </Text>
        </View>
      </View>

      <Text className="mt-6 text-xl font-bold text-slate-900 dark:text-slate-50">Gastos</Text>

      {salida.gastos.length === 0 && (
        <Text className="mt-2 text-slate-600 dark:text-slate-400">
          Aún no hay gastos. Agrega el primero para empezar a cuadrar.
        </Text>
      )}
      {salida.gastos.map((g) => {
        const entre =
          g.divididoEntre.length === salida.participantes.length
            ? 'todos'
            : g.divididoEntre.map(nombreDe).join(', ');
        return (
          <Pressable
            key={g.id}
            className="flex-row items-center gap-3 border-b border-slate-200 py-3 active:bg-slate-100 dark:border-slate-700 dark:active:bg-slate-800"
            onPress={() => navigation.navigate('FormGasto', { salidaId: salida.id, gastoId: g.id })}
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
              <Text className="text-lg">🧾</Text>
            </View>
            <View className="flex-1">
              <Text className="text-base font-semibold text-slate-900 dark:text-slate-50">
                {g.descripcion}
              </Text>
              <Text className="mt-0.5 text-slate-600 dark:text-slate-400">
                Pagó {nombreDe(g.pagadoPor)} · entre {entre}
              </Text>
            </View>
            <Text className="text-base font-bold text-slate-900 dark:text-slate-50" style={NUMEROS}>
              {formatearMonto(g.montoCentimos)}
            </Text>
          </Pressable>
        );
      })}

      <Boton
        texto="+ Agregar gasto"
        variante="secundario"
        className="mt-4"
        onPress={() => navigation.navigate('FormGasto', { salidaId: salida.id })}
      />
      <Boton
        texto="Cuadrar cuentas"
        className="mt-3"
        onPress={() => navigation.navigate('Resultado', { salidaId: salida.id })}
      />

      <Text className="mt-8 text-xl font-bold text-slate-900 dark:text-slate-50">
        Participantes ({salida.participantes.length})
      </Text>
      {salida.participantes.map((p) => (
        <View
          key={p.id}
          className="flex-row items-center border-b border-slate-200 py-3 dark:border-slate-700"
        >
          <View className="flex-1">
            <Text className="text-base font-medium text-slate-900 dark:text-slate-50">
              {p.nombre}
              {p.esOrganizador ? ' (tú)' : ''}
            </Text>
            <Text className="mt-0.5 text-slate-600 dark:text-slate-400">
              {p.telefono ?? 'sin celular'}
            </Text>
          </View>
          {!p.esOrganizador && (
            <Pressable onPress={() => quitar(p.id)} hitSlop={10}>
              <Text className="font-semibold text-danger-700 dark:text-danger-500">Quitar</Text>
            </Pressable>
          )}
        </View>
      ))}

      <Boton
        texto="+ Agregar participante"
        variante="secundario"
        className="mt-4"
        onPress={() => setAgregando(true)}
      />

      <Pressable className="mt-10 items-center p-3" onPress={confirmarEliminar}>
        <Text className="font-semibold text-danger-700 dark:text-danger-500">Eliminar salida</Text>
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
