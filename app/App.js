import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TranslationProvider } from './src/contexts/TranslationContext';
import { DialogProvider } from './src/contexts/DialogContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <TranslationProvider>
        <DialogProvider>
          <AppNavigator />
          <StatusBar style="auto" />
        </DialogProvider>
      </TranslationProvider>
    </SafeAreaProvider>
  );
}
