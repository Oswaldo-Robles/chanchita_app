import { StyleSheet, Text, View } from 'react-native';

import { useApp } from '../app/AppProvider';

export default function Inicio() {
  const { perfil } = useApp();

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Chanchita 🐷</Text>
      <Text>Hola, {perfil?.nombre}. Cuadra las cuentas de tus salidas.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
});
