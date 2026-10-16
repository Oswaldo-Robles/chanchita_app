import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { armarFilasResultado } from '../domain/resultado';
import type { EstadoBalance } from '../domain/resultado';
import type { Salida } from '../domain/types';
import { cobrarTransferencia, compartirResumen } from '../services/cobros';
import type { ResultadoEnvio } from '../services/Mensajero';
import { useTema } from './tema';
import { Avatar, Boton } from './ui';

type Props = NativeStackScreenProps<RootStackParamList, 'Resultado'>;

// El color nunca va solo: cada estado también lleva su texto ("le deben", "debe", "al día").
const PUNTO: Record<EstadoBalance, string> = {
  recibe: 'bg-success-600 dark:bg-success-500',
  debe: 'bg-danger-600 dark:bg-danger-500',
  neutro: 'bg-slate-400 dark:bg-slate-500',
};

const MONTO: Record<EstadoBalance, string> = {
  recibe: 'text-success-700 dark:text-success-500',
  debe: 'text-danger-700 dark:text-danger-500',
  neutro: 'text-slate-600 dark:text-slate-400',
};

const ETIQUETA: Record<EstadoBalance, string> = {
  recibe: 'le deben',
  debe: 'debe',
  neutro: 'al día',
};

const NUMEROS = { fontVariant: ['tabular-nums' as const] };

export default function Resultado({ route }: Props) {
  const { salidaId } = route.params;
  const { salidas, mensajero } = useApp();
  const { spinner } = useTema();
  const [salida, setSalida] = useState<Salida | null | undefined>(undefined);

  // Siempre se calcula desde los gastos guardados: nunca queda desactualizado.
  useEffect(() => {
    salidas.obtener(salidaId).then(setSalida);
  }, [salidas, salidaId]);

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

  const { filas, transferencias, todoCuadrado, totalTexto } = armarFilasResultado(salida);
  const indiceDe = (id: string) => Math.max(0, filas.findIndex((f) => f.id === id));

  function avisarSiFallo(r: ResultadoEnvio) {
    if (!r.ok) Alert.alert('No se pudo abrir WhatsApp', r.motivo);
  }

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
    >
      <View className="rounded-2xl bg-primary-600 p-5">
        <Text className="text-white">Total gastado</Text>
        <Text className="mt-1 text-4xl font-bold text-white" style={NUMEROS}>
          {totalTexto}
        </Text>
        <View className="mt-3 flex-row items-center justify-between">
          <View className="flex-row">
            {filas.map((f, i) => (
              <Avatar key={f.id} nombre={f.nombre} indice={i} className="-mr-2 border-2 border-primary-600" />
            ))}
          </View>
          <Text className="font-semibold text-white">
            {todoCuadrado
              ? 'Sin pagos pendientes'
              : transferencias.length === 1
                ? '1 pago para cuadrar'
                : `${transferencias.length} pagos para cuadrar`}
          </Text>
        </View>
      </View>

      <Text className="mb-1 mt-6 text-xl font-bold text-slate-900 dark:text-slate-50">
        Pagos para cuadrar
      </Text>

      {todoCuadrado ? (
        <View className="items-center py-10">
          <Text className="text-6xl">🐷</Text>
          <Text className="mt-3 text-2xl font-bold text-slate-900 dark:text-slate-50">
            Todo cuadrado 🎉
          </Text>
          <Text className="mt-1 text-center text-slate-600 dark:text-slate-400">
            Nadie le debe nada a nadie.
          </Text>
        </View>
      ) : (
        <>
          {transferencias.map((t) => (
            <View
              key={`${t.deId}-${t.aId}`}
              className="mt-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
            >
              <View className="flex-row items-center justify-between gap-3">
                <Avatar nombre={t.deNombre} indice={indiceDe(t.deId)} />
                <Text className="flex-1 text-base font-semibold text-slate-900 dark:text-slate-50">
                  {t.deNombre} → {t.aNombre}
                </Text>
                <Text className="text-2xl font-bold text-slate-900 dark:text-slate-50" style={NUMEROS}>
                  {t.montoTexto}
                </Text>
              </View>
              <Boton
                texto="Cobrar"
                className="mt-3"
                onPress={() => cobrarTransferencia(mensajero, salida, t).then(avisarSiFallo)}
              />
            </View>
          ))}

          <Boton
            texto="Compartir resumen"
            variante="secundario"
            className="mt-4"
            onPress={() => compartirResumen(mensajero, salida).then(avisarSiFallo)}
          />
        </>
      )}

      <Text className="mb-1 mt-8 text-xl font-bold text-slate-900 dark:text-slate-50">
        Balance de cada uno
      </Text>
      {filas.map((f) => (
        <View
          key={f.id}
          className="flex-row items-center border-b border-slate-200 py-3 dark:border-slate-700"
        >
          <Avatar nombre={f.nombre} indice={filas.indexOf(f)} className="mr-3" />
          <Text className="flex-1 text-base text-slate-900 dark:text-slate-50">{f.nombre}</Text>
          <View className={`mr-3 h-3 w-3 rounded-full ${PUNTO[f.estado]}`} />
          <View className="items-end">
            {f.estado !== 'neutro' && (
              <Text className={`text-base font-bold ${MONTO[f.estado]}`} style={NUMEROS}>
                {f.montoTexto}
              </Text>
            )}
            <Text className={`text-sm ${MONTO[f.estado]}`}>{ETIQUETA[f.estado]}</Text>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
