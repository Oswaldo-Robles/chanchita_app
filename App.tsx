import { StatusBar } from 'expo-status-bar';

import { AppProvider } from './src/app/AppProvider';
import Navegacion from './src/app/navegacion';

export default function App() {
  return (
    <AppProvider>
      <Navegacion />
      <StatusBar style="auto" />
    </AppProvider>
  );
}
