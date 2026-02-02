import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Modal,
    Pressable,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';

export default function EditProfileScreen({ navigation, route }) {
    const { user, updateUserProfile } = useContext(AuthContext);
    const { showToast } = useToast();
    const { theme, themeName } = useTheme();

    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.mobile || '');
    const [bio, setBio] = useState('Frequent traveler. Coffee enthusiast. ☕');

    // Check if initialImage was passed from AccountScreen
    const [profileImage, setProfileImage] = useState(route.params?.initialImage || user?.profilePicture);

    // Sync changes from AuthContext (e.g. after successful update)
    React.useEffect(() => {
        if (user?.profileImage || user?.profilePicture) {
            setProfileImage(user.profileImage || user.profilePicture);
        }
    }, [user]);

    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);

    // Hardcoded Cloudinary Credentials (as requested/provided by user previously)
    const CLOUD_NAME = "dhkqyogas";
    const UPLOAD_PRESET = "omniebee";

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            showToast('Sorry, we need camera roll permissions to make this work!', 'error');
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
            setModalVisible(false);
        }
    };

    const takePhoto = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
            showToast('Sorry, we need camera permissions to make this work!', 'error');
            return;
        }

        let result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
        });

        if (!result.canceled) {
            setProfileImage(result.assets[0].uri);
            setModalVisible(false);
        }
    };

    const uploadToCloudinary = async (uri) => {
        if (!uri) return null;

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
                console.error("Cloudinary Error:", result);
                return null;
            }
        } catch (error) {
            console.error("Upload Logic Error:", error);
            return null;
        }
    };

    const handleUpdate = async () => {
        setLoading(true);
        let imageUrl = profileImage;

        // Upload only if it's a local file URI
        if (profileImage && !profileImage.startsWith('http')) {
            const uploadedUrl = await uploadToCloudinary(profileImage);
            if (uploadedUrl) {
                imageUrl = uploadedUrl;
            } else {
                showToast("Failed to upload image. Please try again.", "error");
                setLoading(false);
                return;
            }
        }

        const result = await updateUserProfile({
            name,
            email,
            profileImage: imageUrl
        });

        setLoading(false);

        if (result.success) {
            showToast('Profile Updated Successfully!', 'success');
            navigation.goBack();
        } else {
            showToast(result.error || 'Failed to update profile', 'error');
        }
    };

    // Helper to determine image source
    const getImageSource = () => {
        if (profileImage) {
            // Append timestamp only if it's a remote URL to bust cache
            if (profileImage.startsWith('http')) {
                return { uri: `${profileImage}?t=${new Date().getTime()}` };
            }
            return { uri: profileImage };
        }
        // Fallback placeholder (no hardcoded randomuser unless specifically desired)
        return { uri: 'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_user_personalization&w=740&q=80' };
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: themeName === 'dark' ? theme.secondary : '#FFF' }]}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Edit Profile</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Avatar Section */}
                <View style={[styles.avatarContainer, { borderColor: theme.background }]}>
                    <Pressable onPress={() => setModalVisible(true)}>
                        <Image
                            key={profileImage} // Force re-render when URI changes
                            source={getImageSource()}
                            style={[styles.avatar, { borderColor: themeName === 'dark' ? theme.secondary : '#FFF' }]}
                        />
                        {loading && (
                            <View style={styles.loadingOverlay}>
                                <ActivityIndicator size="small" color="#FFF" />
                            </View>
                        )}
                        <View style={[styles.cameraButton, { backgroundColor: theme.primary, borderColor: themeName === 'dark' ? theme.secondary : '#FFF' }]}>
                            <Ionicons name="camera" size={20} color="#FFF" />
                        </View>
                    </Pressable>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Full Name</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.secondary, color: theme.textPrimary, borderColor: theme.border }]}
                            value={name}
                            onChangeText={setName}
                            placeholder="Full Name"
                            placeholderTextColor={theme.textSecondary}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Email</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.secondary, color: theme.textPrimary, borderColor: theme.border }]}
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            placeholder="Email"
                            placeholderTextColor={theme.textSecondary}
                            editable={!loading}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Phone Number</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.secondary, color: theme.textPrimary, borderColor: theme.border }]}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                            placeholder="Phone Number"
                            placeholderTextColor={theme.textSecondary}
                            editable={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Bio</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, { backgroundColor: theme.secondary, color: theme.textPrimary, borderColor: theme.border }]}
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            placeholder="Tell us about yourself"
                            placeholderTextColor={theme.textSecondary}
                            editable={!loading}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, { backgroundColor: theme.primary }, loading && { opacity: 0.7 }]}
                        onPress={handleUpdate}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>{loading ? 'Updating...' : 'Update Profile'}</Text>
                        {loading && <ActivityIndicator size="small" color="#FFF" style={{ marginLeft: 10 }} />}
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Selection Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
                    <View style={[styles.modalContent, { backgroundColor: themeName === 'dark' ? '#252B3B' : '#FFF' }]}>
                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Change Profile Photo</Text>

                        <TouchableOpacity style={styles.modalOption} onPress={takePhoto}>
                            <Ionicons name="camera-outline" size={24} color={theme.textPrimary} />
                            <Text style={[styles.modalOptionText, { color: theme.textPrimary }]}>Take Photo</Text>
                        </TouchableOpacity>

                        <View style={[styles.divider, { backgroundColor: theme.border }]} />

                        <TouchableOpacity style={styles.modalOption} onPress={pickImage}>
                            <Ionicons name="images-outline" size={24} color={theme.textPrimary} />
                            <Text style={[styles.modalOptionText, { color: theme.textPrimary }]}>Choose from Library</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.modalOption, { marginTop: 10 }]} onPress={() => setModalVisible(false)}>
                            <Text style={{ color: theme.danger, fontWeight: '600' }}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Modal>
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
        paddingBottom: 20,
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    scrollContent: {
        paddingHorizontal: 20,
    },
    avatarContainer: {
        alignSelf: 'center',
        marginVertical: 20,
        position: 'relative',
        width: 100, // Ensure loading overlay is constrained
        height: 100,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
    },
    cameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 50, // Match avatar
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    form: {
        marginTop: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderRadius: 10,
        padding: 16,
        fontSize: 16,
        borderWidth: 1,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    button: {
        padding: 18,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        marginBottom: 40,
        flexDirection: 'row'
    },
    buttonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        paddingBottom: 40,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    modalOption: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        gap: 15
    },
    modalOptionText: {
        fontSize: 16,
        fontWeight: '500'
    },
    divider: {
        height: 1,
        marginVertical: 5
    }
});
