import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthNavigator from './AuthNavigator';
import MainTabs from './MainTabs';
import useStore from '../store/useStore';

const NAVIGATION_STATE_KEY = 'NAVIGATION_STATE';

const Stack = createStackNavigator();

const AppNavigator = () => {
  const isAuthenticated = useStore((state) => state.isAuthenticated);
  const [isReady, setIsReady] = React.useState(false);
  const [initialState, setInitialState] = React.useState(null);

  // Загружаем сохраненное состояние навигации
  React.useEffect(() => {
    const restoreState = async () => {
      try {
        const savedState = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
        if (savedState) {
          setInitialState(JSON.parse(savedState));
        }
      } catch (error) {
        console.error('Failed to restore navigation state:', error);
      } finally {
        setIsReady(true);
      }
    };

    restoreState();
  }, []);

  if (!isReady) {
    return null; // Или можно показать загрузочный экран
  }

  return (
    <NavigationContainer
      initialState={initialState}
      onStateChange={(state) => {
        // Сохраняем состояние навигации
        AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state)).catch((error) => {
          console.error('Failed to save navigation state:', error);
        });
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
      >
        {isAuthenticated ? (
          <Stack.Screen name="MainTabs" component={MainTabs} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
