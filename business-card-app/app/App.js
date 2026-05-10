import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

import CardsListScreen from './src/screens/CardsListScreen';
import CardDetailScreen from './src/screens/CardDetailScreen';
import AddCardScreen from './src/screens/AddCardScreen';
import ExportScreen from './src/screens/ExportScreen';

const ACCENT = '#4F46E5';

const Tab = createBottomTabNavigator();
const CardsStack = createNativeStackNavigator();

const stackScreenOptions = {
  headerStyle: {
    backgroundColor: '#fff',
  },
  headerTintColor: ACCENT,
  headerTitleStyle: {
    fontWeight: '700',
    color: '#111827',
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: '#F9FAFB',
  },
};

function CardsStackNavigator() {
  return (
    <CardsStack.Navigator screenOptions={stackScreenOptions}>
      <CardsStack.Screen
        name="CardsList"
        component={CardsListScreen}
        options={{ title: 'Business Cards' }}
      />
      <CardsStack.Screen
        name="CardDetail"
        component={CardDetailScreen}
        options={{ title: 'Card Details' }}
      />
      <CardsStack.Screen
        name="AddCard"
        component={AddCardScreen}
        options={({ route }) => ({
          title: route.params?.card ? 'Edit Card' : 'Add Card',
        })}
      />
    </CardsStack.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Cards') {
              iconName = focused ? 'card' : 'card-outline';
            } else if (route.name === 'Export') {
              iconName = focused ? 'download' : 'download-outline';
            }
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: ACCENT,
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#fff',
            borderTopColor: '#F3F4F6',
            borderTopWidth: 1,
            paddingBottom: 4,
            height: 60,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '600',
          },
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Cards"
          component={CardsStackNavigator}
          options={{ title: 'Cards' }}
        />
        <Tab.Screen
          name="Export"
          component={ExportScreen}
          options={{
            title: 'Export',
            headerShown: true,
            headerTitle: 'Export',
            headerStyle: { backgroundColor: '#fff' },
            headerTitleStyle: { fontWeight: '700', color: '#111827' },
            headerShadowVisible: false,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
