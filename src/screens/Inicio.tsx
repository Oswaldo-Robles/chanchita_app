import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { totalGastos } from '../domain/gastos';
import { formatearMonto } from '../domain/montos';
import { ordenarSalidas } from '../domain/salidas';
import type { Salida } from '../domain/types';
import { Avatar } from './ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Inicio'>;

const NUMEROS = { fontVariant: ['tabular-nums' as const] };
const AVATARES_VISIBLES = 4;

export default function Inicio({ navigation }: Props) {
  const { perfil, salidas } = useApp();
  const [lista, setLista] = useState<Salida[] | null>(null);

  // Recarga cada vez que se vuelve a esta pantalla (tras crear o eliminar una salida).
  useFocusEffect(
    useCallback(() => {
      salidas.listar().then((todas) => setLista(ordenarSalidas(todas)));
    }, [salidas]),
  );

  const encabezado = (
    <View className="mb-4">
      <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50">
        Hola, {perfil?.nombre} 👋
      </Text>

      <Pressable
        className="mt-4 flex-row items-center gap-3 rounded-2xl bg-primary-600 p-4 active:bg-primary-700"
        onPress={() => navigation.navigate('NuevaSalida')}
      >
        <Text className="text-4xl">🐷</Text>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">Nueva salida</Text>
          <Text className="text-white">Registra los gastos y cobra por WhatsApp</Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
          <Text className="text-2xl font-bold leading-7 text-primary-700">+</Text>
        </View>
      </Pressable>

      {lista !== null && lista.length > 0 && (
        <Text className="mt-6 text-lg font-semibold text-slate-900 dark:text-slate-50">
          Tus salidas
        </Text>
      )}
    </View>
  );

  return (
    <FlatList
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      data={lista ?? []}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={encabezado}
      ListEmptyComponent={
        lista === null ? null : (
          <View className="items-center gap-1.5 px-6 pt-10">
            <Text className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Aún no tienes salidas
            </Text>
            <Text className="text-center text-slate-600 dark:text-slate-400">
              Crea una y cuadra las cuentas con tus amigos.
            </Text>
          </View>
        )
      }
      renderItem={({ item }) => {
        const total = totalGastos(item.gastos);
        const resto = item.participantes.length - AVATARES_VISIBLES;
        return (
          <Pressable
            className="mb-2.5 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:active:bg-slate-700"
            onPress={() => navigation.navigate('DetalleSalida', { salidaId: item.id })}
          >
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                  {item.nombre}
                </Text>
                <Text className="mt-0.5 text-slate-600 dark:text-slate-400">{item.fecha}</Text>
              </View>
              <View className="items-end">
                <Text className="text-lg font-bold text-slate-900 dark:text-slate-50" style={NUMEROS}>
                  {formatearMonto(total)}
                </Text>
                <Text className="text-sm text-slate-600 dark:text-slate-400">
                  {item.gastos.length === 1 ? '1 gasto' : `${item.gastos.length} gastos`}
                </Text>
              </View>
            </View>

            <View className="mt-3 flex-row items-center">
              {item.participantes.slice(0, AVATARES_VISIBLES).map((p, i) => (
                <Avatar
                  key={p.id}
                  nombre={p.nombre}
                  indice={i}
                  className="-mr-2 border-2 border-white dark:border-slate-800"
                />
              ))}
              {resto > 0 && (
                <Text className="ml-4 text-sm font-medium text-slate-600 dark:text-slate-400">
                  +{resto}
                </Text>
              )}
            </View>
          </Pressable>
        );
      }}
    />
  );
}
