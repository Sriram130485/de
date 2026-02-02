import React from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import RoleCard from '../components/RoleCard';
import { SIZES } from '../constants/theme';

const RoleSelectionScreen = ({ navigation }) => {
    const { theme, themeName } = useTheme();

    const handleRoleSelect = (role, tabName) => {
        // Navigate to MainTabs and switch to the specific tab
        navigation.navigate('MainTabs', { screen: tabName });
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />

            <ScrollView contentContainerStyle={styles.contentContainer}>
                {/* Header */}
                <View style={styles.header}>
                    <Ionicons name="leaf" size={32} color={theme.primary} />
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Driivera</Text>
                </View>

                {/* Hero Section */}
                <View style={styles.heroSection}>
                    <Text style={[styles.heroTitle, { color: theme.textPrimary }]}>
                        How will you use Driivera today?
                    </Text>
                    <Text style={[styles.heroSubtitle, { color: theme.textSecondary }]}>
                        Choose your journey to get started.
                    </Text>
                </View>

                {/* Role Cards */}
                <View style={styles.cardsContainer}>
                    {/* <RoleCard
                        title="Passenger"
                        description="Book a ride and travel safely to your destination."
                        iconName="person"
                        onPress={() => handleRoleSelect('Passenger', 'Passenger')}
                    /> */}
                    <RoleCard
                        title="Driver"
                        description="Drive someone's car and earn money on your schedule."
                        iconName="car-sport"
                        onPress={() => handleRoleSelect('Driver', 'Driver')}
                    />
                    <RoleCard
                        title="Co-Driver"
                        description="Same route? Drive the car and reach your destination for free."
                        iconName="car-sport"
                        onPress={() => handleRoleSelect('Co-Driver', 'Co-Driver')}
                    />
                    <RoleCard
                        title="Owner"
                        description="Manage your vehicles and drivers efficiently."
                        iconName="business"
                        onPress={() => handleRoleSelect('Owner', 'Owner')}
                    />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: SIZES.padding,
        flexGrow: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Platform.OS === 'android' ? 40 : 10,
        marginBottom: 40,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 10,
        letterSpacing: 1,
        textAlign: 'center'
    },
    heroSection: {
        marginBottom: 40,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        lineHeight: 40,
        textAlign: 'center'
    },
    heroSubtitle: {
        fontSize: 16,
        textAlign: 'center'
    },
    cardsContainer: {
        flex: 1,
    },
});

export default RoleSelectionScreen;
