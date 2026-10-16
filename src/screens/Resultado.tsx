import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { armarFilasResultado } from '../domain/resultado';
import type { EstadoBalance } from '../domain/resultado';
import type { Salida } from '../domain/types';
import { cobrarTransferencia, compartirResumen } from '../services/cobros';
import type { ResultadoEnvio } from '../services/Mensajero';
import { colores } from './tema';

type Props = NativeStackScreenProps<RootStackParamList, 'Resultado'>;

const COLOR_BALANCE: Record<EstadoBalance, string> = {
  recibe: colores.exito,
  debe: colores.error,
  neutro: colores.textoSuave,
};

const ETIQUETA_BALANCE: Record<EstadoBalance, string> = {
  recibe: 'le deben',
  debe: 'debe',
  neutro: 'al día',
};

export default function Resultado({ route }: Props) {
  const { salidaId } = route.params;
  const { salidas, mensajero } = useApp();
  const [salida, setSalida] = useState<Salida | null | undefined>(undefined);

  // Siempre se calcula desde los gastos guardados: nunca queda desactualizado.
  useEffect(() => {
    salidas.obtener(salidaId).then(setSalida);
  }, [salidas, salidaId]);

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

  const { filas, transferencias, todoCuadrado } = armarFilasResultado(salida);

  function avisarSiFallo(r: ResultadoEnvio) {
    if (!r.ok) Alert.alert('No se pudo abrir WhatsApp', r.motivo);
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.seccion}>Balance de cada uno</Text>
      {filas.map((f) => (
        <View key={f.id} style={styles.fila}>
          <Text style={styles.filaNombre}>{f.nombre}</Text>
          <Text style={[styles.balance, { color: COLOR_BALANCE[f.estado] }]}>
            {f.estado === 'neutro' ? ETIQUETA_BALANCE.neutro : `${ETIQUETA_BALANCE[f.estado]} ${f.montoTexto}`}
          </Text>
        </View>
      ))}

      <Text style={styles.seccion}>Pagos para cuadrar</Text>
      {todoCuadrado ? (
        <Text style={styles.cuadrado}>Todo cuadrado 🎉</Text>
      ) : (
        transferencias.map((t) => (
          <View key={`${t.deId}-${t.aId}`} style={styles.fila}>
            <Text style={styles.filaNombre}>
              {t.deNombre} → {t.aNombre}
            </Text>
            <Text style={styles.monto}>{t.montoTexto}</Text>
            <Pressable
              style={styles.cobrar}
              onPress={() => cobrarTransferencia(mensajero, salida, t).then(avisarSiFallo)}
            >
              <Text style={styles.cobrarTexto}>Cobrar</Text>
            </Pressable>
          </View>
        ))
      )}

      {!todoCuadrado && (
        <Pressable
          style={styles.compartir}
          onPress={() => compartirResumen(mensajero, salida).then(avisarSiFallo)}
        >
          <Text style={styles.compartirTexto}>Compartir resumen</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: 16, backgroundColor: colores.fondo, flexGrow: 1 },
  seccion: { fontWeight: '700', fontSize: 16, marginTop: 8, marginBottom: 8 },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colores.borde,
  },
  filaNombre: { flex: 1, fontSize: 16 },
  balance: { fontWeight: '600', fontSize: 16 },
  monto: { fontWeight: '700', fontSize: 16 },
  cobrar: {
    backgroundColor: colores.primario,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginLeft: 12,
  },
  cobrarTexto: { color: '#fff', fontWeight: '600' },
  compartir: {
    borderWidth: 1,
    borderColor: colores.primario,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  compartirTexto: { color: colores.primario, fontWeight: '600' },
  cuadrado: { fontSize: 20, textAlign: 'center', marginTop: 24 },
});
