import React, { useEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Animated,
    Dimensions,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');
const SIDEBAR_WIDTH = width * 0.75;

const RightSidebar = ({ visible, onClose, navigation }) => {
    const slideAnim = useRef(new Animated.Value(width)).current;
    const { logout } = useContext(AuthContext);
    const { theme, themeName } = useTheme();

    useEffect(() => {
        if (visible) {
            Animated.timing(slideAnim, {
                toValue: width - SIDEBAR_WIDTH,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            slideAnim.setValue(width);
        }
    }, [visible]);

    const handleClose = () => {
        Animated.timing(slideAnim, {
            toValue: width,
            duration: 250,
            useNativeDriver: true,
        }).start(() => {
            onClose();
        });
    };

    const menuItems = [
        { icon: 'person-outline', label: 'Edit Profile', action: () => { handleClose(); navigation.navigate('EditProfile'); } },
        { icon: 'settings-outline', label: 'Settings', action: () => { handleClose(); navigation.navigate('Settings'); } },
        { icon: 'notifications-outline', label: 'Notifications', action: () => { handleClose(); navigation.navigate('Notifications'); } },
        { type: 'divider' },
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', action: () => { handleClose(); navigation.navigate('PrivacyPolicy'); } },
        { icon: 'help-circle-outline', label: 'Help & Support', action: () => { handleClose(); navigation.navigate('HelpSupport'); } },
    ];

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity
                    style={styles.backdrop}
                    activeOpacity={1}
                    onPress={handleClose}
                />

                <Animated.View
                    style={[
                        styles.sidebar,
                        {
                            transform: [{ translateX: slideAnim }],
                            backgroundColor: theme.secondary,
                            shadowColor: themeName === 'dark' ? "#000" : "#888"
                        }
                    ]}
                >
                    <SafeAreaView style={styles.contentContainer} edges={['top', 'bottom']}>

                        {/* Header */}
                        <View style={[styles.header, { borderBottomColor: theme.border }]}>
                            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Menu</Text>
                            <TouchableOpacity onPress={handleClose} style={[styles.closeButton, { backgroundColor: themeName === 'dark' ? '#333D55' : theme.border }]}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Menu Items */}
                        <View style={styles.menuList}>
                            {menuItems.map((item, index) => {
                                if (item.type === 'divider') {
                                    return <View key={`divider-${index}`} style={[styles.divider, { backgroundColor: theme.border }]} />;
                                }
                                return (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.menuItem}
                                        onPress={item.action}
                                    >
                                        <Ionicons name={item.icon} size={22} color={theme.textPrimary} style={styles.menuIcon} />
                                        <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>{item.label}</Text>
                                        <Ionicons name="chevron-forward" size={16} color={theme.textSecondary} style={{ marginLeft: 'auto' }} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Footer / Logout */}
                        <View style={[styles.footer, { borderTopColor: theme.border }]}>
                            <TouchableOpacity
                                style={styles.logoutButton}
                                onPress={() => Alert.alert('Logout', 'Are you sure?', [
                                    { text: 'Cancel', style: 'cancel' },
                                    { text: 'Logout', onPress: () => { handleClose(); logout(); }, style: 'destructive' }
                                ])}
                            >
                                <MaterialIcons name="logout" size={22} color={theme.danger} style={styles.menuIcon} />
                                <Text style={[styles.menuLabel, { color: theme.danger, fontWeight: '600' }]}>Logout</Text>
                            </TouchableOpacity>
                        </View>

                    </SafeAreaView>
                </Animated.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
    },
    backdrop: {
        flex: 1,
    },
    sidebar: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        shadowOffset: { width: -2, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    contentContainer: {
        flex: 1,
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 5,
        borderRadius: 20,
    },
    menuList: {
        flex: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
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
    footer: {
        paddingTop: 20,
        borderTopWidth: 1,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
    }
});

export default RightSidebar;
