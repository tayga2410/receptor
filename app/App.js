import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { TranslationProvider } from './src/contexts/TranslationContext';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <TranslationProvider>
        <AppNavigator />
        <StatusBar style="auto" />
      </TranslationProvider>
    </SafeAreaProvider>
  );
}
