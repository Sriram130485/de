import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';

export default function SettingsScreen({ navigation }) {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);

    // Preferences States
    const [preferences, setPreferences] = useState({
        promoEmails: true,
        invoiceEmails: true,
        invoiceSMS: true,
        promoSMS: true,
        whatsappUpdates: false,
        pushNotifications: true,
        pipAccess: true,
    });

    const togglePreference = (key) => {
        setPreferences(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => console.log("Account deletion requested")
                }
            ]
        );
    };

    const SettingItem = ({ icon, label, onPress, color, desc, materialIcon, badge, isLast }) => (
        <TouchableOpacity
            style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <View style={styles.iconContainer}>
                {materialIcon ? (
                    <MaterialCommunityIcons name={materialIcon} size={22} color={color || theme.textSecondary} />
                ) : (
                    <Ionicons name={icon} size={22} color={color || theme.textSecondary} />
                )}
            </View>

            <View style={styles.textContainer}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{label}</Text>
                {desc && <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>{desc}</Text>}
            </View>

            <View style={styles.rightContainer}>
                {badge && <Text style={[styles.badgeText, { color: theme.textSecondary }]}>{badge}</Text>}
                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} />
            </View>
        </TouchableOpacity>
    );

    const ToggleItem = ({ label, value, onValueChange, isLast }) => (
        <View style={[styles.settingItem, !isLast && { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
            <View style={styles.textContainer}>
                <Text style={[styles.settingLabel, { color: theme.textPrimary }]}>{label}</Text>
            </View>
            <Switch
                value={value}
                onValueChange={onValueChange}
                trackColor={{ false: '#767577', true: theme.primary }}
                thumbColor={Platform.OS === 'ios' ? undefined : (value ? '#fff' : '#f4f3f4')}
            />
        </View>
    );

    const SectionHeader = ({ title }) => (
        <Text style={[styles.sectionHeader, { color: theme.primary }]}>{title.toUpperCase()}</Text>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={[styles.header, { backgroundColor: theme.secondary }]}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Settings</Text>
                </View>

                <TouchableOpacity
                    style={[styles.helpButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                    onPress={() => navigation.navigate('HelpSupport')}
                >
                    <Ionicons name="help-circle-outline" size={20} color={theme.textSecondary} />
                    <Text style={[styles.helpText, { color: theme.textSecondary }]}>Help</Text>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ACCOUNT Section */}
                <SectionHeader title="Account" />
                <View style={[styles.card, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                    <SettingItem
                        icon="person-outline"
                        label="Profile"
                        desc={user?.phone || user?.email}
                        onPress={() => navigation.navigate('EditProfile')}
                        isLast={true}
                    />
                </View>

                {/* EMAIL PREFERENCES */}
                <SectionHeader title="Email Preferences" />
                <View style={[styles.card, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                    <ToggleItem
                        label="Promotions and offers"
                        value={preferences.promoEmails}
                        onValueChange={() => togglePreference('promoEmails')}
                    />
                    <ToggleItem
                        label="Invoice emails"
                        value={preferences.invoiceEmails}
                        onValueChange={() => togglePreference('invoiceEmails')}
                        isLast={true}
                    />
                </View>

                {/* SMS & WHATSAPP */}
                <SectionHeader title="SMS & Whatsapp" />
                <View style={[styles.card, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                    <ToggleItem
                        label="Invoice SMS"
                        value={preferences.invoiceSMS}
                        onValueChange={() => togglePreference('invoiceSMS')}
                    />
                    <ToggleItem
                        label="Promotional SMS"
                        value={preferences.promoSMS}
                        onValueChange={() => togglePreference('promoSMS')}
                    />
                    <ToggleItem
                        label="WhatsApp updates"
                        value={preferences.whatsappUpdates}
                        onValueChange={() => togglePreference('whatsappUpdates')}
                        isLast={true}
                    />
                </View>

                {/* PUSH NOTIFICATIONS */}
                <SectionHeader title="Notifications" />
                <View style={[styles.card, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                    <ToggleItem
                        label="Mobile push notifications"
                        value={preferences.pushNotifications}
                        onValueChange={() => togglePreference('pushNotifications')}
                        isLast={true}
                    />
                </View>

                {/* OTHER */}
                <SectionHeader title="Other" />
                <View style={[styles.card, { backgroundColor: theme.secondary, borderColor: theme.border }]}>
                    <ToggleItem
                        label="Picture in Picture (PIP)"
                        value={preferences.pipAccess}
                        onValueChange={() => togglePreference('pipAccess')}
                    />
                    <SettingItem
                        materialIcon="trash-can-outline"
                        label="Delete Account"
                        color={theme.danger}
                        onPress={handleDeleteAccount}
                        isLast={true}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    backButton: {
        marginRight: 10,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    helpButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1,
    },
    helpText: {
        marginLeft: 5,
        fontSize: 14,
        fontWeight: '600',
    },
    scrollContent: {
        paddingHorizontal: 15,
        paddingBottom: 40,
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        marginTop: 25,
        marginBottom: 10,
        paddingLeft: 5,
        letterSpacing: 0.5,
    },
    card: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    iconContainer: {
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    settingLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    settingDesc: {
        fontSize: 12,
        marginTop: 2,
    },
    rightContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    badgeText: {
        fontSize: 12,
        marginRight: 5,
    },
});
