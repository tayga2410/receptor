import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, THEME } from '../theme/colors';
import { useTranslation } from '../contexts/TranslationContext';
import RecipesScreen from '../screens/RecipesScreen';
import RecipeFormScreen from '../screens/RecipeFormScreen';
import IngredientsScreen from '../screens/IngredientsScreen';
import SalesCalendarScreen from '../screens/SalesCalendarScreen';
import SalesDayScreen from '../screens/SalesDayScreen';
import AddSalesScreen from '../screens/AddSalesScreen';
import SalesAnalyticsScreen from '../screens/SalesAnalyticsScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import IngredientFormScreen from '../screens/IngredientFormScreen';
import LanguageSelector from '../components/LanguageSelector';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ iconName, focused }) => (
  <MaterialCommunityIcons
    name={iconName}
    size={28}
    color={focused ? COLORS.accent : COLORS.textLight}
  />
);

const RecipesStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
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
      }}
    >
      <Stack.Screen
        name="RecipesList"
        component={RecipesScreen}
        options={{ title: t('recipes') }}
      />
      <Stack.Screen
        name="RecipeForm"
        component={RecipeFormScreen}
        options={({ route, navigation }) => ({
          title: route.params?.recipe ? t('edit') : t('recipes'),
          headerRight: () =>
            route.params?.recipe ? (
              <TouchableOpacity
                onPress={() => navigation.setParams({ showDeleteDialog: true })}
                style={{ marginRight: 15 }}
              >
                <MaterialCommunityIcons name="delete" size={24} color={COLORS.error} />
              </TouchableOpacity>
            ) : null,
        })}
      />
    </Stack.Navigator>
  );
};

const IngredientsStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
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
      }}
    >
      <Stack.Screen
        name="IngredientsList"
        component={IngredientsScreen}
        options={{ title: t('ingredients') }}
      />
      <Stack.Screen
        name="IngredientForm"
        component={IngredientFormScreen}
        options={({ route, navigation }) => ({
          title: route.params?.ingredient ? t('edit') : t('add_ingredient'),
          headerRight: () =>
            route.params?.ingredient ? (
              <TouchableOpacity
                onPress={() => navigation.setParams({ showDeleteDialog: true })}
                style={{ marginRight: 15 }}
              >
                <MaterialCommunityIcons name="delete" size={24} color={COLORS.error} />
              </TouchableOpacity>
            ) : null,
        })}
      />
    </Stack.Navigator>
  );
};

const SalesStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
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
      }}
    >
      <Stack.Screen
        name="SalesCalendar"
        component={SalesCalendarScreen}
        options={{ title: t('sales_calendar') }}
      />
      <Stack.Screen
        name="SalesDay"
        component={SalesDayScreen}
        options={{ title: t('daily_sales') }}
      />
      <Stack.Screen
        name="AddSales"
        component={AddSalesScreen}
        options={{ title: t('add_sale') }}
      />
      <Stack.Screen
        name="SalesAnalytics"
        component={SalesAnalyticsScreen}
        options={{ title: t('analytics') }}
      />
    </Stack.Navigator>
  );
};

const ExpensesStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
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
      }}
    >
      <Stack.Screen
        name="ExpensesScreen"
        component={ExpensesScreen}
        options={{ title: t('expenses') }}
      />
    </Stack.Navigator>
  );
};

const ProfileStack = () => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
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
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{ title: t('profile') }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: t('edit_profile_title') }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ title: t('change_password_title') }}
      />
    </Stack.Navigator>
  );
};

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
          } else if (route.name === 'Sales') {
            return <TabIcon iconName="chart-bar" focused={focused} />;
          } else if (route.name === 'Expenses') {
            return <TabIcon iconName="cash-minus" focused={focused} />;
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
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Ingredients"
        component={IngredientsStack}
        options={{ title: t('ingredients') }}
      />
      <Tab.Screen
        name="Recipes"
        component={RecipesStack}
        options={{ title: t('recipes') }}
      />
      <Tab.Screen
        name="Expenses"
        component={ExpensesStack}
        options={{ title: t('expenses') }}
      />
      <Tab.Screen
        name="Sales"
        component={SalesStack}
        options={{ title: t('sales') }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: t('profile') }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({});

export default MainTabs;
