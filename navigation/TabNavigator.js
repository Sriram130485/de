import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

import HomeScreen from '../screens/HomeScreen';
// import PassengerHomeScreen from '../screens/PassengerHomeScreen';
import OwnerScreen from '../screens/OwnerScreen';
import DriverScreen from '../screens/DriverScreen';
import CoDriverScreen from '../screens/CoDriverScreen';
import MyTripsScreen from '../screens/MyTripsScreen';
import AccountScreen from '../screens/AccountScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
    const { theme, themeName } = useTheme();

    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: theme.secondary,
                    borderTopColor: theme.border,
                    paddingBottom: 5,
                    height: 60,
                },
                tabBarActiveTintColor: theme.accent,
                tabBarInactiveTintColor: theme.textSecondary,
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    marginBottom: 5,
                }
            }}
        >
            {/* <Tab.Screen
                name="Passenger"
                component={PassengerHomeScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <FontAwesome5 name="walking" size={20} color={color} />
                    ),
                }}
            /> */}
            <Tab.Screen
                name="Owner"
                component={OwnerScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="car-connected" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Driver"
                component={DriverScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="car-sport-outline" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Co-Driver"
                component={CoDriverScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="car-sport-outline" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="My Trips"
                component={MyTripsScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <MaterialCommunityIcons name="history" size={24} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="Account"
                component={AccountScreen}
                options={{
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-outline" size={24} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}
