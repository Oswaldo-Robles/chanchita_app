import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import Inicio from '../screens/Inicio';

export type RootStackParamList = {
  Inicio: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Navegacion() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Inicio" component={Inicio} options={{ title: 'Chanchita' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
