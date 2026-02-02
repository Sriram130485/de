import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
    Dimensions
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
    const [mobile, setMobile] = useState('');
    const { showToast } = useToast();
    const { theme, themeName } = useTheme();

    const sendOTP = async () => {
        if (!mobile) return showToast('Enter your mobile number', 'warning');

        try {
            await api.post('/auth/send-otp', { mobile });
            showToast(`OTP sent to ${mobile}`, 'success');
            navigation.navigate('OTP', { mobile, type: 'login' });
        } catch (error) {
            if (error.response && error.response.status === 404) {
                showToast("Account not found. Please register first.", 'error');
                setTimeout(() => navigation.navigate('Register'), 1500);
            } else {
                showToast("Failed to send OTP. Please try again.", 'error');
            }
        }
    };

    return (
        <LinearGradient
            colors={theme.gradient} // Dynamic gradient
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <View style={styles.header}>
                        <View style={[styles.logoPlaceholder, { backgroundColor: themeName === 'dark' ? '#1A1A1A' : '#FFFFFF', borderColor: theme.border }]}>
                            <Text style={styles.logoText}>D</Text>
                        </View>
                        <Text style={[styles.title, { color: themeName === 'dark' ? '#FFF' : theme.textPrimary }]}>Welcome to Driveera</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Let's get moving. Log in to access your rides and deliveries.</Text>
                    </View>

                    <BlurView intensity={themeName === 'dark' ? 20 : 50} tint={themeName === 'dark' ? 'light' : 'default'} style={[styles.glassCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <View style={styles.cardContent}>
                            <Text style={[styles.label, { color: themeName === 'dark' ? '#E2E8F0' : theme.textPrimary }]}>Phone Number</Text>
                            <View style={styles.inputRow}>
                                {/* Country Code Placeholder */}
                                <View style={[styles.countryCodeContainer, { backgroundColor: themeName === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', borderColor: theme.border }]}>
                                    <Text style={styles.flag}>🇮🇳</Text>
                                    <Text style={[styles.countryCode, { color: theme.textPrimary }]}>+91</Text>
                                    <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                                </View>

                                {/* Mobile Input */}
                                <View style={[styles.inputWrapper, { backgroundColor: themeName === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="phone-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        placeholder="Mobile Number"
                                        placeholderTextColor={theme.textSecondary}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        style={[styles.input, { color: theme.textPrimary }]}
                                        value={mobile}
                                        onChangeText={setMobile}
                                    />
                                </View>
                            </View>

                            <TouchableOpacity onPress={sendOTP} activeOpacity={0.8}>
                                <LinearGradient
                                    colors={theme.buttonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                    style={styles.button}
                                >
                                    <Text style={styles.buttonText}>Login</Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                </LinearGradient>
                            </TouchableOpacity>

                            <View style={styles.footer}>
                                <Text style={[styles.footerText, { color: theme.textSecondary }]}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                                    <Text style={styles.linkText}>Sign up</Text>
                                </TouchableOpacity>
                            </View>

                            <TouchableOpacity style={styles.helpLink}>
                                <Text style={[styles.helpText, { color: theme.textSecondary }]}>Need help?</Text>
                            </TouchableOpacity>
                        </View>
                    </BlurView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoPlaceholder: {
        width: 80,
        height: 80,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    logoText: {
        color: '#D4AF37', // Gold-ish color for D letter
        fontSize: 36,
        fontWeight: '300',
        fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
        paddingHorizontal: 20,
    },
    glassCard: {
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
    },
    cardContent: {
        padding: 25,
        backgroundColor: 'transparent',
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    inputRow: {
        flexDirection: 'row',
        marginBottom: 25,
        gap: 12,
    },
    countryCodeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 55,
        width: 100,
        justifyContent: 'space-between',
    },
    flag: {
        fontSize: 18,
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '500',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        height: 55,
    },
    inputIcon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        height: '100%',
    },
    button: {
        borderRadius: 27.5,
        height: 55,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        shadowColor: '#FF7E5F',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
        gap: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 15,
    },
    footerText: {
        fontSize: 14,
    },
    linkText: {
        color: '#4299E1',
        fontSize: 14,
        fontWeight: '600',
    },
    helpLink: {
        alignItems: 'center',
    },
    helpText: {
        fontSize: 14,
    }
});
