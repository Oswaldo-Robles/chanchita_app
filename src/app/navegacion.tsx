import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import DetalleSalida from '../screens/DetalleSalida';
import Inicio from '../screens/Inicio';
import NuevaSalida from '../screens/NuevaSalida';
import Onboarding from '../screens/Onboarding';
import { useApp } from './AppProvider';

export type RootStackParamList = {
  Onboarding: undefined;
  Inicio: undefined;
  NuevaSalida: undefined;
  DetalleSalida: { salidaId: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navegacion() {
  const { cargando, perfil } = useApp();

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
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
          </>
        ) : (
          <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
