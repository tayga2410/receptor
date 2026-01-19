import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';
import { COLORS } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import RecipesScreen from '../screens/RecipesScreen';
import IngredientsScreen from '../screens/IngredientsScreen';
import CalculatorScreen from '../screens/CalculatorScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ icon, label, focused }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 24 }}>{icon}</Text>
    <Text
      style={{
        fontSize: 12,
        color: focused ? COLORS.accent : COLORS.textLight,
        marginTop: 4,
        fontWeight: focused ? '600' : '400',
      }}
    >
      {label}
    </Text>
  </View>
);

const MainTabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let icon;
          let label;

          if (route.name === 'Recipes') {
            icon = '📝';
            label = t('recipes');
          } else if (route.name === 'Ingredients') {
            icon = '🥕';
            label = t('ingredients');
          } else if (route.name === 'Calculator') {
            icon = '🧮';
            label = t('calculator');
          } else if (route.name === 'Profile') {
            icon = '👤';
            label = t('profile');
          }

          return <TabIcon icon={icon} label={label} focused={focused} />;
        },
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
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

export default MainTabs;
