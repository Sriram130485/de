import React, { useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { registerDriver } from '../services/api';

// REPLACE WITH YOUR CLOUDINARY DETAILS
const CLOUD_NAME = "dhkqyogas";
const UPLOAD_PRESET = "omniebee";

const DriverRegistrationScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { user, loadUser } = useContext(AuthContext);

    // Prefill data if available
    const [aadharNumber, setAadharNumber] = useState(user?.aadharNumber || '');
    const [panNumber, setPanNumber] = useState(user?.panNumber || '');
    const [licenseNumber, setLicenseNumber] = useState(user?.licenseNumber || '');

    // Updated state for Front/Back images
    const [images, setImages] = useState({
        aadharFront: user?.documentImages?.aadharFront || null,
        aadharBack: user?.documentImages?.aadharBack || null,
        panFront: user?.documentImages?.panFront || null,
        panBack: user?.documentImages?.panBack || null,
        licenseFront: user?.documentImages?.licenseFront || null,
        licenseBack: user?.documentImages?.licenseBack || null
    });

    const [loading, setLoading] = useState(false);

    const pickImage = async (type) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.5,
        });

        if (!result.canceled) {
            setImages(prev => ({ ...prev, [type]: result.assets[0].uri }));
        }
    };

    const uploadToCloudinary = async (uri) => {
        if (!uri) return null;
        if (uri.startsWith('http')) return uri;

        const data = new FormData();
        data.append('file', {
            uri,
            type: 'image/jpeg',
            name: 'upload.jpg'
        });
        data.append('upload_preset', UPLOAD_PRESET);
        data.append('cloud_name', CLOUD_NAME);

        try {
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
                method: 'post',
                body: data
            });
            const file = await res.json();
            return file.secure_url;
        } catch (error) {
            console.error("Upload failed", error);
            throw new Error("Image upload failed");
        }
    };

    const handleSubmit = async () => {
        if (!aadharNumber || !panNumber || !licenseNumber) {
            return Alert.alert("Error", "Please fill all ID numbers.");
        }

        // Validations
        const aadharRegex = /^\d{12}$/;
        if (!aadharRegex.test(aadharNumber)) return Alert.alert("Invalid Aadhar", "Aadhar number must be exactly 12 digits.");

        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(panNumber)) return Alert.alert("Invalid PAN", "Invalid PAN Format.");

        const dlRegex = /^[A-Z]{2}[0-9]{14}$/;
        if (!dlRegex.test(licenseNumber)) return Alert.alert("Invalid License", "Invalid License Format.");

        // Check if all images are present
        const requiredImages = ['aadharFront', 'aadharBack', 'panFront', 'panBack', 'licenseFront', 'licenseBack'];
        const missing = requiredImages.filter(key => !images[key]);
        if (missing.length > 0) {
            return Alert.alert("Error", "Please upload both Front and Back sides for all documents.");
        }

        setLoading(true);
        try {
            // Upload Images
            const imageUrls = {};
            for (const key of requiredImages) {
                imageUrls[key] = await uploadToCloudinary(images[key]);
            }

            const payload = {
                userId: user._id,
                aadharNumber,
                panNumber,
                licenseNumber,
                documentImages: imageUrls
            };

            await registerDriver(payload);

            if (loadUser) await loadUser();

            Alert.alert("Success", "Registration submitted! Please verify your documents.", [
                { text: "OK", onPress: () => navigation.navigate('DigilockerVerification') }
            ]);

        } catch (error) {
            Alert.alert("Error", error.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    // Helper to render a pair of image pickers
    const renderImagePair = (frontKey, backKey, labelPrefix) => (
        <View style={styles.imageRow}>
            <View style={styles.imageCol}>
                <Text style={[styles.subLabel, { color: theme.textSecondary }]}>{labelPrefix} (Front)</Text>
                <TouchableOpacity onPress={() => pickImage(frontKey)} style={[styles.imageBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    {images[frontKey] ? (
                        <Image source={{ uri: images[frontKey] }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="cloud-upload-outline" size={28} color="#FF9800" />
                            <Text style={styles.placeholderText}>Tap to Upload</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
            <View style={{ width: 15 }} />
            <View style={styles.imageCol}>
                <Text style={[styles.subLabel, { color: theme.textSecondary }]}>{labelPrefix} (Back)</Text>
                <TouchableOpacity onPress={() => pickImage(backKey)} style={[styles.imageBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
                    {images[backKey] ? (
                        <Image source={{ uri: images[backKey] }} style={styles.previewImage} />
                    ) : (
                        <View style={styles.placeholder}>
                            <Ionicons name="cloud-upload-outline" size={28} color="#FF9800" />
                            <Text style={styles.placeholderText}>Tap to Upload</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Driver / Co-Driver Registration</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={[styles.infoBox, { backgroundColor: '#E3F2FD' }]}>
                    <View style={styles.infoIcon}>
                        <Ionicons name="information" size={20} color="#fff" />
                    </View>
                    <Text style={{ flex: 1, marginLeft: 10, color: '#555', fontSize: 13 }}>
                        Upload your verification documents. Once approved, you can start accepting trips.
                    </Text>
                </View>

                {/* Aadhar Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Aadhar Details</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, color: theme.textPrimary }]}
                        placeholder="Aadhar Number"
                        placeholderTextColor={theme.textSecondary}
                        value={aadharNumber}
                        onChangeText={(text) => setAadharNumber(text.replace(/[^0-9]/g, ''))}
                        keyboardType="numeric"
                        maxLength={12}
                    />
                    {renderImagePair('aadharFront', 'aadharBack', 'Aadhar')}
                </View>

                {/* PAN Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>PAN Details</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, color: theme.textPrimary }]}
                        placeholder="PAN Number"
                        placeholderTextColor={theme.textSecondary}
                        value={panNumber}
                        onChangeText={(text) => setPanNumber(text.toUpperCase())}
                        autoCapitalize="characters"
                        maxLength={10}
                    />
                    {renderImagePair('panFront', 'panBack', 'PAN')}
                </View>

                {/* License Section */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Driving License Details</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.card, color: theme.textPrimary }]}
                        placeholder="Driving License Number"
                        placeholderTextColor={theme.textSecondary}
                        value={licenseNumber}
                        onChangeText={(text) => setLicenseNumber(text.toUpperCase())}
                        autoCapitalize="characters"
                        maxLength={16}
                    />
                    {renderImagePair('licenseFront', 'licenseBack', 'License')}
                </View>
            </ScrollView>

            <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: '#F57C00', opacity: loading ? 0.7 : 1 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.btnText}>Submit for Verification</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: 'bold' },
    content: { padding: 20, paddingBottom: 100 },

    infoBox: { flexDirection: 'row', padding: 15, borderRadius: 12, marginBottom: 25, alignItems: 'center' },
    infoIcon: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#F57C00', justifyContent: 'center', alignItems: 'center' },

    section: { marginBottom: 30 },
    sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },

    input: { height: 50, borderRadius: 8, paddingHorizontal: 15, marginBottom: 15 },

    imageRow: { flexDirection: 'row', justifyContent: 'space-between' },
    imageCol: { flex: 1 },
    subLabel: { marginBottom: 8, fontSize: 13 },
    imageBox: {
        height: 120,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ddd',
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        overflow: 'hidden'
    },
    previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholder: { alignItems: 'center' },
    placeholderText: { color: '#999', fontSize: 12, marginTop: 5 },

    footer: {
        padding: 20,
        borderTopWidth: 1,
        borderColor: '#eee'
    },
    submitBtn: { height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    btnText: { color: "#fff", fontSize: 16, fontWeight: 'bold' }
});

export default DriverRegistrationScreen;
