import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const PlaceholderScreen = ({ navigation, title, icon }) => {
    const { theme, themeName } = useTheme();

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backButton, { backgroundColor: themeName === 'dark' ? theme.secondary : '#FFF', shadowColor: themeName === 'dark' ? "#000" : "#888" }]}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>{title}</Text>
                <View style={{ width: 40 }} />
            </View>
            <View style={styles.content}>
                <Ionicons name={icon} size={80} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                <Text style={[styles.message, { color: theme.textSecondary }]}>This is the {title} page.</Text>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20, // SIZES.padding typically 16 or 20
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        elevation: 2,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    message: {
        marginTop: 20,
        fontSize: 16,
    }
});

export default PlaceholderScreen;
