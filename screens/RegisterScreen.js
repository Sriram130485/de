import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
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

export default function RegisterScreen({ navigation }) {
    const { showToast } = useToast();
    const { theme, themeName } = useTheme();
    const [mobile, setMobile] = useState('');
    const [isSending, setIsSending] = useState(false);

    const validateMobile = (phone) => /^[6-9]\d{9}$/.test(phone);

    const sendOtp = async () => {
        if (!validateMobile(mobile)) {
            return showToast('Please enter a valid 10-digit mobile number.', 'warning');
        }

        setIsSending(true);
        try {
            await api.post('/auth/register-init', { mobile });
            showToast(`OTP sent to ${mobile}`, 'success');
            navigation.navigate('OTP', { mobile, type: 'register' });
        } catch (error) {
            setIsSending(false);
            if (error.response) {
                showToast(error.response.data?.message || 'Failed to send OTP.', 'error');
            } else {
                showToast(error.message, 'error');
            }
        }
    };

    const renderHeader = (title, subtitle) => (
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={themeName === 'dark' ? '#FFF' : theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: themeName === 'dark' ? '#FFF' : theme.textPrimary }]}>{title}</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>
        </View>
    );

    return (
        <LinearGradient
            colors={theme.gradient}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.content}
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
                        {renderHeader("Create Account", "Enter your mobile number to get started")}

                        <BlurView intensity={themeName === 'dark' ? 20 : 50} tint={themeName === 'dark' ? 'light' : 'default'} style={[styles.glassCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.cardContent}>
                                <Text style={[styles.label, { color: themeName === 'dark' ? '#E2E8F0' : theme.textPrimary }]}>Mobile Number</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: themeName === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)', borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="phone-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.textPrimary }]}
                                        placeholder="1234567890"
                                        placeholderTextColor={theme.textSecondary}
                                        keyboardType="phone-pad"
                                        maxLength={10}
                                        value={mobile}
                                        onChangeText={setMobile}
                                        editable={!isSending}
                                    />
                                </View>

                                <TouchableOpacity onPress={sendOtp} activeOpacity={0.8} style={{ marginTop: 20 }} disabled={isSending}>
                                    <LinearGradient
                                        colors={theme.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.button}
                                    >
                                        <Text style={styles.buttonText}>{isSending ? 'Sending...' : 'Send Code'}</Text>
                                        {!isSending && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
                                    </LinearGradient>
                                </TouchableOpacity>

                                <View style={styles.footer}>
                                    <Text style={[styles.footerText, { color: theme.textSecondary }]}>Already have an account? </Text>
                                    <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                        <Text style={styles.linkText}>Log in</Text>
                                    </TouchableOpacity>
                                </View>
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
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 10,
    },
    inputWrapper: {
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
        marginTop: 20,
    },
    footerText: {
        fontSize: 14,
    },
    linkText: {
        color: '#4299E1',
        fontSize: 14,
        fontWeight: '600',
    },
});
