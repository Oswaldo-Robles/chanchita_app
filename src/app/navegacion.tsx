import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View } from 'react-native';

import Inicio from '../screens/Inicio';
import Onboarding from '../screens/Onboarding';
import { useApp } from './AppProvider';

export type RootStackParamList = {
  Onboarding: undefined;
  Inicio: undefined;
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
          <Stack.Screen name="Inicio" component={Inicio} options={{ title: 'Chanchita' }} />
        ) : (
          <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
