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

const Tab = createBottomTabNavigator();

const TabIcon = ({ iconName, label, focused }) => (
  <View style={styles.tabIconContainer}>
    <MaterialCommunityIcons
      name={iconName}
      size={24}
      color={focused ? COLORS.accent : COLORS.textLight}
    />
    <Text
      style={[
        styles.tabLabel,
        focused ? styles.tabLabelFocused : styles.tabLabelUnfocused,
      ]}
      numberOfLines={2}
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
          if (route.name === 'Recipes') {
            return <TabIcon iconName="book-open-variant" label={t('recipes')} focused={focused} />;
          } else if (route.name === 'Ingredients') {
            return <TabIcon iconName="food-variant" label={t('ingredients')} focused={focused} />;
          } else if (route.name === 'Calculator') {
            return <TabIcon iconName="calculator-variant" label={t('calculator')} focused={focused} />;
          } else if (route.name === 'Profile') {
            return <TabIcon iconName="account" label={t('profile')} focused={focused} />;
          }
        },
        tabBarLabel: () => null,
        tabBarActiveTintColor: COLORS.accent,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          height: 70,
          paddingBottom: 8,
          paddingTop: 8,
          paddingHorizontal: 4,
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

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    gap: 4,
  },
  tabLabel: {
    fontSize: 8,
    marginTop: 0,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 10,
  },
  tabLabelFocused: {
    color: COLORS.accent,
    fontWeight: '600',
  },
  tabLabelUnfocused: {
    color: COLORS.textLight,
  },
});

export default MainTabs;
