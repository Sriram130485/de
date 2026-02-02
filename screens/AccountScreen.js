import React, { useContext, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, ActivityIndicator, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SIZES } from '../constants/theme';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';

export default function AccountScreen({ navigation }) {
    const { user, logout, loading, loadUser, deleteAccount } = useContext(AuthContext);
    const { theme, toggleTheme, themeName } = useTheme();
    const [showPreview, setShowPreview] = React.useState(false);

    // Reload user data whenever screen comes into focus
    useFocusEffect(
        useCallback(() => {
            loadUser();
        }, [])
    );

    if (loading && !user) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </SafeAreaView>
        );
    }

    const menuItems = [
        { icon: 'account-edit', label: 'Edit Profile', action: () => navigation.navigate('EditProfile') },
        { icon: 'cog', label: 'Settings', action: () => navigation.navigate('Settings') },
        { icon: 'bell-outline', label: 'Notifications', action: () => navigation.navigate('TripRequests') },
        { type: 'divider' },
        { icon: 'shield-check', label: 'Privacy Policy', action: () => navigation.navigate('PrivacyPolicy') },
        { icon: 'help-circle', label: 'Help & Support', action: () => navigation.navigate('HelpSupport') },
    ];

    // Cache Busting: Add timestamp to image URL
    const profileImageUri = useMemo(() => {
        if (!user?.profileImage && !user?.profilePicture) {
            return 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_user_personalization&w=740&q=80';
        }
        return `${user.profileImage || user.profilePicture}?t=${Date.now()}`;
    }, [user?.profileImage, user?.profilePicture]);


    return (

        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {showPreview && (
                <View style={styles.previewOverlay}>
                    <TouchableOpacity
                        style={styles.previewClose}
                        onPress={() => setShowPreview(false)}
                    >
                        <Ionicons name="close" size={30} color="#fff" />
                    </TouchableOpacity>

                    <Image
                        source={{
                            uri: user?.profileImage
                                ? user.profileImage
                                : 'https://randomuser.me/api/portraits/men/32.jpg',
                        }}
                        style={styles.previewImage}
                        resizeMode="contain"
                    />
                </View>
            )}

            <View style={[styles.header, { backgroundColor: theme.secondary }]}>
                <TouchableOpacity onPress={() => setShowPreview(true)} style={styles.avatarContainer}>
                    <Image
                        key={profileImageUri}
                        source={{ uri: profileImageUri }}
                        style={[styles.avatar, { borderColor: theme.primary }]}
                    />
                    {user?.isApproved && (
                        <View style={[styles.verifiedBadge, { backgroundColor: theme.card }]}>
                            <MaterialCommunityIcons name="shield-check" size={26} color="#4CAF50" />
                        </View>
                    )}
                </TouchableOpacity>
                <Text style={[styles.name, { color: themeName === 'dark' ? '#FFF' : theme.textPrimary }]}>{user?.name || 'Guest'}</Text>
                <Text style={[styles.email, { color: theme.textSecondary }]}>{user?.email || 'No email provided'}</Text>
                <View style={[styles.roleBadge, { borderColor: theme.primary, backgroundColor: 'rgba(59, 130, 246, 0.2)' }]}>
                    <Text style={[styles.roleText, { color: theme.primary }]}>{user?.role || 'Member'}</Text>
                </View>
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.menuList}>

                    {/* Documents */}
                    <TouchableOpacity
                        style={[styles.menuItem, { backgroundColor: theme.secondary }]}
                        onPress={() => navigation.navigate('UserDocuments')}
                    >
                        <MaterialCommunityIcons name="file-document-outline" size={24} color={theme.textPrimary} style={styles.menuIcon} />
                        <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>My Documents</Text>
                        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
                    </TouchableOpacity>

                    {/* Dark Mode Toggle */}
                    <View style={[styles.menuItem, { backgroundColor: theme.secondary }]}>
                        <MaterialCommunityIcons name="theme-light-dark" size={24} color={theme.textPrimary} style={styles.menuIcon} />
                        <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>Dark Mode</Text>
                        <Switch
                            value={themeName === 'dark'}
                            onValueChange={toggleTheme}
                            trackColor={{ false: '#767577', true: theme.primary }}
                            thumbColor={themeName === 'dark' ? '#f4f3f4' : '#f4f3f4'}
                        />
                    </View>

                    {menuItems.map((item, index) => {
                        if (item.type === 'divider') {
                            return <View key={`divider-${index}`} style={[styles.divider, { backgroundColor: theme.border }]} />;
                        }
                        return (
                            <TouchableOpacity
                                key={index}
                                style={[styles.menuItem, { backgroundColor: theme.secondary }]}
                                onPress={item.action}
                            >
                                <MaterialCommunityIcons name={item.icon} size={24} color={theme.textPrimary} style={styles.menuIcon} />
                                <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                                <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        );
                    })}

                    <TouchableOpacity
                        style={[styles.menuItem, { marginTop: 20, backgroundColor: theme.secondary }]}
                        onPress={() => {
                            logout();
                        }}
                    >
                        <MaterialCommunityIcons name="logout" size={24} color={theme.danger} style={styles.menuIcon} />
                        <Text style={[styles.menuLabel, { color: theme.danger }]}>Logout</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuItem, { marginTop: 10, backgroundColor: theme.secondary, borderWidth: 1, borderColor: theme.danger }]}
                        onPress={() => {
                            Alert.alert(
                                "Delete Account",
                                "Are you sure you want to delete your account? This action cannot be undone.",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    {
                                        text: "Delete",
                                        style: "destructive",
                                        onPress: async () => {
                                            const result = await deleteAccount();
                                            if (!result.success) {
                                                Alert.alert("Error", result.error?.message || "Failed to delete account");
                                            }
                                        }
                                    }
                                ]
                            );
                        }}
                    >
                        <MaterialCommunityIcons name="delete-forever" size={24} color={theme.danger} style={styles.menuIcon} />
                        <Text style={[styles.menuLabel, { color: theme.danger }]}>Delete Account</Text>
                    </TouchableOpacity>
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
        alignItems: 'center',
        paddingVertical: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        marginBottom: 20,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
    },
    verifiedBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 15,
        padding: 2,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 1,
    },
    name: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        marginBottom: 12,
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 20,
        borderWidth: 1,
    },
    roleText: {
        fontSize: 12,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        paddingHorizontal: SIZES.padding,
    },
    menuList: {
        paddingBottom: 40,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 12,
        marginBottom: 10,
    },
    menuIcon: {
        marginRight: 15,
    },
    menuLabel: {
        fontSize: 16,
        flex: 1,
    },
    divider: {
        height: 1,
        marginVertical: 10,
    },
    previewOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 999,
    },

    previewImage: {
        width: '90%',
        height: '70%',
    },

    previewClose: {
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 10,
    },

});
