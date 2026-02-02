import React, { useState, useEffect, useRef, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function OTPScreen({ navigation, route }) {
    const { mobile, type } = route.params; // type: 'login' | 'register'
    const { showToast } = useToast();
    const { loadUser } = useContext(AuthContext);
    const { theme, themeName } = useTheme();

    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [timer, setTimer] = useState(30);
    const [isVerifying, setIsVerifying] = useState(false);

    const otpRefs = useRef([]);

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => setTimer((prev) => prev - 1), 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleOtpChange = (text, index) => {
        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 5) {
            otpRefs.current[index + 1].focus();
        }
    };

    const handleOtpBackspace = (key, index) => {
        if (key === 'Backspace' && !otp[index] && index > 0) {
            otpRefs.current[index - 1].focus();
        }
    };

    const resendOtp = async () => {
        try {
            if (type === 'register') {
                await api.post('/auth/register-init', { mobile });
            } else {
                await api.post('/auth/send-otp', { mobile });
            }
            setTimer(30);
            showToast(`OTP sent to ${mobile}`, 'success');
        } catch (error) {
            const msg = error.response?.data?.message || 'Failed to send OTP.';
            showToast(msg, 'error');
        }
    };

    const verifyOtp = async () => {
        const otpValue = otp.join('');
        if (otpValue.length < 6) return showToast('Please enter the complete 6-digit OTP.', 'warning');

        setIsVerifying(true);
        try {
            const response = await api.post('/auth/verify-otp', { mobile, otp: otpValue });
            await AsyncStorage.setItem('token', response.data.token);

            showToast('OTP Verified!', 'success');

            if (type === 'register') {
                navigation.replace('ProfileSetup');
            } else {
                // Login flow: load user and let root navigator switch stacks
                await loadUser();
            }
        } catch (error) {
            showToast(error.response?.data?.message || 'Invalid OTP.', 'error');
        } finally {
            setIsVerifying(false);
        }
    };

    const headerTitle = type === 'register' ? "Verify Account" : "Verify Login";
    const headerSubtitle = `We have sent the code to +1 ${mobile}`;

    return (
        <LinearGradient
            colors={theme.gradient} // Dynamic
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>

                        <View style={styles.header}>
                            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                                <Ionicons name="arrow-back" size={24} color={themeName === 'dark' ? '#FFF' : theme.textPrimary} />
                            </TouchableOpacity>
                            <Text style={[styles.title, { color: themeName === 'dark' ? '#FFF' : theme.textPrimary }]}>{headerTitle}</Text>
                            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{headerSubtitle}</Text>
                        </View>

                        <BlurView intensity={themeName === 'dark' ? 20 : 50} tint={themeName === 'dark' ? 'light' : 'default'} style={[styles.glassCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.cardContent}>
                                <View style={styles.otpContainer}>
                                    {otp.map((digit, index) => (
                                        <TextInput
                                            key={index}
                                            ref={(ref) => otpRefs.current[index] = ref}
                                            style={[
                                                styles.otpBox,
                                                {
                                                    backgroundColor: themeName === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                                                    borderColor: theme.border,
                                                    color: theme.textPrimary
                                                },
                                                digit && styles.otpBoxFilled // keep highlight logic
                                            ]}
                                            keyboardType="number-pad"
                                            maxLength={1}
                                            value={digit}
                                            onChangeText={(text) => handleOtpChange(text, index)}
                                            onKeyPress={({ nativeEvent }) => handleOtpBackspace(nativeEvent.key, index)}
                                            placeholderTextColor={theme.textSecondary}
                                            editable={!isVerifying}
                                        />
                                    ))}
                                </View>

                                <TouchableOpacity onPress={verifyOtp} activeOpacity={0.8} style={{ marginTop: 30 }} disabled={isVerifying}>
                                    <LinearGradient
                                        colors={theme.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.button}
                                    >
                                        <Text style={styles.buttonText}>{isVerifying ? 'Verifying...' : 'Verify'}</Text>
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.resendContainer}>
                                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>Resend code in </Text>
                                    <Text style={[styles.linkText, { color: timer > 0 ? theme.textSecondary : theme.accent }]}>
                                        00:{timer < 10 ? `0${timer}` : timer}
                                    </Text>
                                </View>
                                {timer === 0 && (
                                    <TouchableOpacity onPress={resendOtp} style={{ alignItems: 'center', marginTop: 10 }}>
                                        <Text style={[styles.linkText, { color: theme.accent }]}>Resend Now</Text>
                                    </TouchableOpacity>
                                )}
                            </View>
                        </BlurView>

                    </ScrollView>
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
        paddingHorizontal: 20,
    },
    header: {
        marginBottom: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 16,
        lineHeight: 24,
    },
    glassCard: {
        borderRadius: 30,
        overflow: 'hidden',
        borderWidth: 1,
    },
    cardContent: {
        padding: 25,
    },
    button: {
        borderRadius: 27.5,
        height: 55,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
    footerText: {
        fontSize: 14,
    },
    linkText: {
        fontSize: 14,
        fontWeight: '600',
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    otpBox: {
        width: 45,
        height: 55,
        borderWidth: 1,
        borderRadius: 12,
        fontSize: 24,
        textAlign: 'center',
        fontWeight: 'bold',
    },
    otpBoxFilled: {
        borderColor: '#4299E1',
        backgroundColor: 'rgba(66, 153, 225, 0.1)',
    },
    resendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 30,
    },
});
