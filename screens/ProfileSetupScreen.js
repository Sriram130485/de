import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { useToast } from '../context/ToastContext';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export default function ProfileSetupScreen({ navigation }) {
    const { showToast } = useToast();
    const { updateUserProfile, loadUser } = useContext(AuthContext);
    const { theme, themeName } = useTheme();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [profileImage, setProfileImage] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const CLOUD_NAME = "dhkqyogas";
    const UPLOAD_PRESET = "omniebee";

    const validateEmail = (mail) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);

    const handleImageSelection = () => {
        Alert.alert(
            "Select Profile Photo",
            "Choose an option",
            [
                {
                    text: "Take Photo",
                    onPress: takePhoto
                },
                {
                    text: "Choose from Gallery",
                    onPress: pickImage
                },
                {
                    text: "Cancel",
                    style: "cancel"
                }
            ]
        );
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                "Permission Denied",
                "Sorry, we need camera permissions to make this work!"
            );
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert(
                "Permission Denied",
                "Sorry, we need camera roll permissions to make this work!"
            );
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
        }
    };

    const uploadToCloudinary = async (uri) => {
        if (!uri) return null;
        if (CLOUD_NAME === "your_cloud_name" || UPLOAD_PRESET === "your_unsigned_upload_preset") {
            showToast("Please configure Cloudinary credentials in ProfileSetupScreen.js", "error");
            return null;
        }

        setIsUploading(true);
        try {
            const data = new FormData();
            data.append('file', {
                uri: uri,
                type: 'image/jpeg',
                name: 'upload.jpg',
            });
            data.append('upload_preset', UPLOAD_PRESET);
            data.append('cloud_name', CLOUD_NAME);

            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'post',
                body: data
            });

            const result = await res.json();
            if (result.secure_url) {
                return result.secure_url;
            } else {
                showToast("Failed to upload image to cloud.", "error");
                console.error("Cloudinary Error:", result);
                return null;
            }
        } catch (error) {
            console.error("Upload Logic Error:", error);
            showToast("An error occurred during image upload.", "error");
            return null;
        } finally {
            setIsUploading(false);
        }
    };

    const handleCompleteProfile = async () => {
        if (!name.trim()) return showToast('Name is required.', 'warning');
        if (!validateEmail(email)) return showToast('Invalid email address.', 'warning');

        setIsSubmitting(true);

        let imageUrl = profileImage;
        if (profileImage && !profileImage.startsWith('http')) {
            const uploadedUrl = await uploadToCloudinary(profileImage);
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            } else {
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const profileData = { name, email, profileImage: imageUrl };

            const result = await updateUserProfile(profileData);
            if (result.success) {
                showToast('Registration Complete!', 'success');
                await loadUser();
            } else {
                showToast(result.error || 'Failed to complete profile.', 'error');
            }
        } catch (error) {
            showToast('An unexpected error occurred.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderHeader = (title, subtitle) => (
        <View style={styles.header}>
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
                        {renderHeader("Profile Details", "Let's get to know you better")}

                        <View style={{ alignItems: 'center', marginBottom: 30 }}>
                            <View>
                                <View style={[styles.avatarPlaceholder, { borderColor: theme.border, backgroundColor: themeName === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                    {profileImage ? (
                                        <Image
                                            source={{ uri: profileImage }}
                                            style={styles.avatarImage}
                                        />
                                    ) : (
                                        <Ionicons name="person-add" size={30} color={theme.textSecondary} />
                                    )}

                                    {isUploading && (
                                        <View style={styles.loadingOverlay}>
                                            <ActivityIndicator size="small" color="#FFF" />
                                        </View>
                                    )}
                                </View>
                                <TouchableOpacity onPress={handleImageSelection} style={[styles.cameraIconBg, { borderColor: theme.background }]}>
                                    <Ionicons name="camera" size={15} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        <BlurView intensity={themeName === 'dark' ? 20 : 50} tint={themeName === 'dark' ? 'light' : 'default'} style={[styles.glassCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                            <View style={styles.cardContent}>
                                <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: themeName === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="account-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.textPrimary }]}
                                        placeholder="e.g. John Doe"
                                        placeholderTextColor={theme.textSecondary}
                                        value={name}
                                        onChangeText={setName}
                                        editable={!isSubmitting}
                                    />
                                </View>

                                <Text style={[styles.label, { marginTop: 20, color: theme.textSecondary }]}>Email Address</Text>
                                <View style={[styles.inputWrapper, { backgroundColor: themeName === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)', borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="email-outline" size={20} color={theme.textSecondary} style={styles.inputIcon} />
                                    <TextInput
                                        style={[styles.input, { color: theme.textPrimary }]}
                                        placeholder="john@example.com"
                                        placeholderTextColor={theme.textSecondary}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        value={email}
                                        onChangeText={setEmail}
                                        editable={!isSubmitting}
                                    />
                                </View>

                                <TouchableOpacity onPress={handleCompleteProfile} activeOpacity={0.8} style={{ marginTop: 30 }} disabled={isSubmitting || isUploading}>
                                    <LinearGradient
                                        colors={theme.buttonGradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={[styles.button, isSubmitting && { opacity: 0.7 }]}
                                    >
                                        <Text style={styles.buttonText}>
                                            {isSubmitting ? (isUploading ? 'Uploading Image...' : 'Saving...') : 'Complete Profile'}
                                        </Text>
                                        {!isSubmitting && <Ionicons name="arrow-forward" size={20} color="#FFF" />}
                                    </LinearGradient>
                                </TouchableOpacity>
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
        alignItems: 'center'
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 10,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 16,
        textAlign: 'center',
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
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderStyle: 'dashed',
        // overflow: 'hidden', // Removed to allow icon to sit on edge if needed, though now icon is outside
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cameraIconBg: {
        position: 'absolute',
        bottom: -5,
        right: -10,
        backgroundColor: '#4299E1',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
});
