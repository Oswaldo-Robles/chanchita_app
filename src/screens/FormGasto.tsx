import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { validarGasto } from '../domain/gastos';
import { generarId } from '../domain/id';
import { formatearMonto, parsearMonto } from '../domain/montos';
import type { Salida } from '../domain/types';
import { useTema } from './tema';
import { Boton, Entrada, Etiqueta, TextoError } from './ui';

type Props = NativeStackScreenProps<RootStackParamList, 'FormGasto'>;

type Errores = { descripcion?: string; monto?: string; divididoEntre?: string };

export default function FormGasto({ route, navigation }: Props) {
  const { salidaId, gastoId } = route.params;
  const { salidas } = useApp();
  const { spinner } = useTema();
  const [salida, setSalida] = useState<Salida | null | undefined>(undefined);
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [pagadoPor, setPagadoPor] = useState('');
  const [divididoEntre, setDivididoEntre] = useState<string[]>([]);
  const [errores, setErrores] = useState<Errores>({});

  useEffect(() => {
    navigation.setOptions({ title: gastoId ? 'Editar gasto' : 'Nuevo gasto' });
  }, [gastoId, navigation]);

  useEffect(() => {
    salidas.obtener(salidaId).then((s) => {
      setSalida(s);
      if (!s) return;
      const gasto = gastoId ? s.gastos.find((g) => g.id === gastoId) : undefined;
      if (gasto) {
        setDescripcion(gasto.descripcion);
        setMonto((gasto.montoCentimos / 100).toFixed(2));
        setPagadoPor(gasto.pagadoPor);
        setDivididoEntre(gasto.divididoEntre);
      } else {
        // Gasto nuevo: paga el organizador y todos vienen seleccionados.
        const organizador = s.participantes.find((p) => p.esOrganizador) ?? s.participantes[0];
        setPagadoPor(organizador?.id ?? '');
        setDivididoEntre(s.participantes.map((p) => p.id));
      }
    });
  }, [salidas, salidaId, gastoId]);

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

  function alternar(id: string) {
    setDivididoEntre((actual) =>
      actual.includes(id) ? actual.filter((x) => x !== id) : [...actual, id],
    );
  }

  async function guardar() {
    if (!salida) return;
    const montoCentimos = parsearMonto(monto);
    const r = validarGasto({ descripcion, montoCentimos, divididoEntre });
    if (!r.ok) {
      setErrores(r.errores);
      return;
    }
    // El orden de divididoEntre sigue el de los participantes (define quién recibe el céntimo sobrante).
    const gasto = {
      id: gastoId ?? generarId(),
      descripcion: descripcion.trim(),
      montoCentimos: montoCentimos as number,
      pagadoPor,
      divididoEntre: salida.participantes.map((p) => p.id).filter((id) => divididoEntre.includes(id)),
    };
    const gastos = gastoId
      ? salida.gastos.map((g) => (g.id === gastoId ? gasto : g))
      : [...salida.gastos, gasto];
    await salidas.guardar({ ...salida, gastos });
    navigation.goBack();
  }

  function confirmarEliminar() {
    if (!salida || !gastoId) return;
    Alert.alert('Eliminar gasto', `¿Eliminar "${descripcion}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await salidas.guardar({ ...salida, gastos: salida.gastos.filter((g) => g.id !== gastoId) });
          navigation.goBack();
        },
      },
    ]);
  }

  const montoCentimos = parsearMonto(monto);
  const porPersona =
    montoCentimos && divididoEntre.length > 0
      ? formatearMonto(Math.floor(montoCentimos / divididoEntre.length))
      : null;

  return (
    <ScrollView
      className="flex-1 bg-slate-50 dark:bg-slate-900"
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      keyboardShouldPersistTaps="handled"
    >
      <Etiqueta>Descripción</Etiqueta>
      <Entrada
        conError={!!errores.descripcion}
        value={descripcion}
        onChangeText={(t) => {
          setDescripcion(t);
          setErrores((e) => ({ ...e, descripcion: undefined }));
        }}
        placeholder="Ej. Pizza"
      />
      {errores.descripcion && <TextoError>{errores.descripcion}</TextoError>}

      <Etiqueta>Monto (S/)</Etiqueta>
      <Entrada
        conError={!!errores.monto}
        value={monto}
        onChangeText={(t) => {
          setMonto(t);
          setErrores((e) => ({ ...e, monto: undefined }));
        }}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      {errores.monto && <TextoError>{errores.monto}</TextoError>}

      <Etiqueta>Pagó</Etiqueta>
      <View className="flex-row flex-wrap gap-2">
        {salida.participantes.map((p) => {
          const activo = pagadoPor === p.id;
          return (
            <Pressable
              key={p.id}
              onPress={() => setPagadoPor(p.id)}
              className={
                activo
                  ? 'rounded-full border border-primary-300 bg-primary-50 px-4 py-2 dark:border-primary-400 dark:bg-primary-900'
                  : 'rounded-full border border-transparent bg-slate-100 px-4 py-2 dark:bg-slate-800'
              }
            >
              <Text
                className={
                  activo
                    ? 'font-bold text-primary-700 dark:text-primary-100'
                    : 'text-slate-700 dark:text-slate-200'
                }
              >
                {p.nombre}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Etiqueta>{`Se divide entre (${divididoEntre.length})`}</Etiqueta>
      {salida.participantes.map((p) => {
        const marcado = divididoEntre.includes(p.id);
        return (
          <Pressable
            key={p.id}
            className="flex-row items-center border-b border-slate-200 py-3 dark:border-slate-700"
            onPress={() => {
              alternar(p.id);
              setErrores((e) => ({ ...e, divididoEntre: undefined }));
            }}
          >
            <View
              className={
                marcado
                  ? 'mr-3 h-6 w-6 items-center justify-center rounded-md border-2 border-primary-600 bg-primary-600'
                  : 'mr-3 h-6 w-6 items-center justify-center rounded-md border-2 border-slate-400 dark:border-slate-500'
              }
            >
              {marcado && <Text className="text-sm font-bold text-white">✓</Text>}
            </View>
            <Text className="text-base text-slate-900 dark:text-slate-50">{p.nombre}</Text>
          </Pressable>
        );
      })}
      {errores.divididoEntre && <TextoError>{errores.divididoEntre}</TextoError>}
      {porPersona && (
        <Text className="mt-3 text-slate-600 dark:text-slate-400">≈ {porPersona} por persona</Text>
      )}

      <Boton texto="Guardar gasto" className="mt-6" onPress={guardar} />

      {gastoId && (
        <Pressable className="mt-4 items-center p-3" onPress={confirmarEliminar}>
          <Text className="font-semibold text-danger-700 dark:text-danger-500">Eliminar gasto</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}
