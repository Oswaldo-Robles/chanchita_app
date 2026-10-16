import { useFocusEffect } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';
import type { RootStackParamList } from '../app/navegacion';
import { ordenarSalidas } from '../domain/salidas';
import type { Salida } from '../domain/types';
import { colores } from './tema';

type Props = NativeStackScreenProps<RootStackParamList, 'Inicio'>;

export default function Inicio({ navigation }: Props) {
  const { perfil, salidas } = useApp();
  const [lista, setLista] = useState<Salida[] | null>(null);

  // Recarga cada vez que se vuelve a esta pantalla (tras crear o eliminar una salida).
  useFocusEffect(
    useCallback(() => {
      salidas.listar().then((todas) => setLista(ordenarSalidas(todas)));
    }, [salidas]),
  );

  return (
    <View style={styles.container}>
      <Text className="mb-3 text-2xl font-bold text-pink-600">Hola, {perfil?.nombre} 👋</Text>

      <FlatList
        data={lista ?? []}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ flexGrow: 1 }}
        ListEmptyComponent={
          lista === null ? null : (
            <View style={styles.vacio}>
              <Text style={styles.vacioEmoji}>🐷</Text>
              <Text style={styles.vacioTitulo}>Aún no tienes salidas</Text>
              <Text style={styles.vacioTexto}>Crea una y cuadra las cuentas con tus amigos.</Text>
            </View>
          )
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.tarjeta}
            onPress={() => navigation.navigate('DetalleSalida', { salidaId: item.id })}
          >
            <Text style={styles.tarjetaTitulo}>{item.nombre}</Text>
            <Text style={styles.tarjetaDetalle}>
              {item.fecha} · {item.participantes.length} personas · {item.gastos.length} gastos
            </Text>
          </Pressable>
        )}
      />

      <Pressable
        className="items-center rounded-xl bg-pink-600 p-4 active:bg-pink-700"
        onPress={() => navigation.navigate('NuevaSalida')}
      >
        <Text className="text-base font-bold text-white">+ Nueva salida</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: colores.fondo },
  saludo: { fontSize: 20, fontWeight: '600', marginBottom: 12 },
  tarjeta: {
    backgroundColor: colores.fondoSuave,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  tarjetaTitulo: { fontSize: 17, fontWeight: '600' },
  tarjetaDetalle: { color: colores.textoSuave, marginTop: 4 },
  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 6 },
  vacioEmoji: { fontSize: 56 },
  vacioTitulo: { fontSize: 18, fontWeight: '600' },
  vacioTexto: { color: colores.textoSuave, textAlign: 'center' },
  boton: {
    backgroundColor: colores.primario,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  botonTexto: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
