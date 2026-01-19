import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import RecipesScreen from '../screens/RecipesScreen';
import IngredientsScreen from '../screens/IngredientsScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LanguageSelector from '../components/LanguageSelector';

const Tab = createBottomTabNavigator();

const TabIcon = ({ iconName, focused }) => (
  <MaterialCommunityIcons
    name={iconName}
    size={28}
    color={focused ? COLORS.accent : COLORS.textLight}
  />
);

const MainTabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          if (route.name === 'Recipes') {
            return <TabIcon iconName="book-open-variant" focused={focused} />;
          } else if (route.name === 'Ingredients') {
            return <TabIcon iconName="food-variant" focused={focused} />;
          } else if (route.name === 'Calculator') {
            return <TabIcon iconName="calculator-variant" focused={focused} />;
          } else if (route.name === 'Profile') {
            return <TabIcon iconName="account" focused={focused} />;
          }
        },
        tabBarLabel: () => null,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 56,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerStyle: {
          backgroundColor: COLORS.surface,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: COLORS.border,
        },
        headerTitleStyle: {
          color: COLORS.text,
          fontWeight: 'bold',
          fontSize: 20,
        },
        headerRight: () => <LanguageSelector />,
      })}
    >
      <Tab.Screen
        name="Recipes"
        component={RecipesScreen}
        options={() => ({ title: t('recipes') })}
      />
      <Tab.Screen
        name="Ingredients"
        component={IngredientsScreen}
        options={() => ({ title: t('ingredients') })}
      />
      <Tab.Screen
        name="Calculator"
        component={CalculatorScreen}
        options={() => ({ title: t('calculator') })}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={() => ({ title: t('profile') })}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({});

export default MainTabs;
