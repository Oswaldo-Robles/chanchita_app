import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { validarGasto } from '../domain/gastos';
import { generarId } from '../domain/id';
import { formatearMonto, parsearMonto } from '../domain/montos';
import type { Salida } from '../domain/types';
import { colores } from './tema';

type Props = NativeStackScreenProps<RootStackParamList, 'FormGasto'>;

type Errores = { descripcion?: string; monto?: string; divididoEntre?: string };

export default function FormGasto({ route, navigation }: Props) {
  const { salidaId, gastoId } = route.params;
  const { salidas } = useApp();
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
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Descripción</Text>
      <TextInput
        style={styles.input}
        value={descripcion}
        onChangeText={(t) => {
          setDescripcion(t);
          setErrores((e) => ({ ...e, descripcion: undefined }));
        }}
        placeholder="Ej. Pizza"
      />
      {errores.descripcion && <Text style={styles.error}>{errores.descripcion}</Text>}

      <Text style={styles.label}>Monto (S/)</Text>
      <TextInput
        style={styles.input}
        value={monto}
        onChangeText={(t) => {
          setMonto(t);
          setErrores((e) => ({ ...e, monto: undefined }));
        }}
        placeholder="0.00"
        keyboardType="decimal-pad"
      />
      {errores.monto && <Text style={styles.error}>{errores.monto}</Text>}

      <Text style={styles.label}>Pagó</Text>
      <View style={styles.chips}>
        {salida.participantes.map((p) => (
          <Pressable
            key={p.id}
            style={[styles.chip, pagadoPor === p.id && styles.chipActivo]}
            onPress={() => setPagadoPor(p.id)}
          >
            <Text style={pagadoPor === p.id ? styles.chipTextoActivo : styles.chipTexto}>
              {p.nombre}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Se divide entre ({divididoEntre.length})</Text>
      {salida.participantes.map((p) => {
        const marcado = divididoEntre.includes(p.id);
        return (
          <Pressable
            key={p.id}
            style={styles.fila}
            onPress={() => {
              alternar(p.id);
              setErrores((e) => ({ ...e, divididoEntre: undefined }));
            }}
          >
            <Text style={styles.casilla}>{marcado ? '☑' : '☐'}</Text>
            <Text style={styles.filaNombre}>{p.nombre}</Text>
          </Pressable>
        );
      })}
      {errores.divididoEntre && <Text style={styles.error}>{errores.divididoEntre}</Text>}
      {porPersona && <Text style={styles.suave}>≈ {porPersona} por persona</Text>}

      <Pressable style={styles.boton} onPress={guardar}>
        <Text style={styles.botonTexto}>Guardar gasto</Text>
      </Pressable>

      {gastoId && (
        <Pressable style={styles.eliminar} onPress={confirmarEliminar}>
          <Text style={styles.eliminarTexto}>Eliminar gasto</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, backgroundColor: colores.fondo, flexGrow: 1 },
  label: { fontWeight: '700', marginTop: 16, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  error: { color: colores.error, marginTop: 4 },
  suave: { color: colores.textoSuave, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colores.borde,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipActivo: { backgroundColor: colores.primario, borderColor: colores.primario },
  chipTexto: { color: colores.texto },
  chipTextoActivo: { color: '#fff', fontWeight: '600' },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  casilla: { fontSize: 22, marginRight: 12, color: colores.primario },
  filaNombre: { fontSize: 16 },
  boton: {
    backgroundColor: colores.primario,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 24,
  },
  botonTexto: { color: '#fff', fontWeight: '700', fontSize: 16 },
  eliminar: { marginTop: 20, padding: 12, alignItems: 'center' },
  eliminarTexto: { color: colores.error, fontWeight: '600' },
});
