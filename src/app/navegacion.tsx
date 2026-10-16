import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, useColorScheme } from 'react-native';

import DetalleSalida from '../screens/DetalleSalida';
import FormGasto from '../screens/FormGasto';
import Inicio from '../screens/Inicio';
import NuevaSalida from '../screens/NuevaSalida';
import Onboarding from '../screens/Onboarding';
import Resultado from '../screens/Resultado';
import { temaNavegacion } from '../screens/tema';
import { useApp } from './AppProvider';

export type RootStackParamList = {
  Onboarding: undefined;
  Inicio: undefined;
  NuevaSalida: undefined;
  DetalleSalida: { salidaId: string };
  FormGasto: { salidaId: string; gastoId?: string };
  Resultado: { salidaId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navegacion() {
  const { cargando, perfil } = useApp();
  const oscuro = useColorScheme() === 'dark';
  const colores = oscuro ? temaNavegacion.oscuro : temaNavegacion.claro;
  const tema = { ...(oscuro ? DarkTheme : DefaultTheme), colors: colores };

  if (cargando) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colores.background,
        }}
      >
        <ActivityIndicator size="large" color={colores.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={tema}>
      <Stack.Navigator>
        {perfil ? (
          <>
            <Stack.Screen name="Inicio" component={Inicio} options={{ title: 'Chanchita' }} />
            <Stack.Screen
              name="NuevaSalida"
              component={NuevaSalida}
              options={{ title: 'Nueva salida' }}
            />
            <Stack.Screen name="DetalleSalida" component={DetalleSalida} options={{ title: '' }} />
            <Stack.Screen name="FormGasto" component={FormGasto} />
            <Stack.Screen
              name="Resultado"
              component={Resultado}
              options={{ title: 'Cuadrar cuentas' }}
            />
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
