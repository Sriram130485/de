import React, { useState, useContext } from 'react';
import {
    View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
    TextInput, Image, Alert, ActivityIndicator, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { SIZES } from '../constants/theme';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import { registerVehicle } from '../services/api';
import Constants from 'expo-constants'; // To access upload preset if stored in app.json

// Note: Ensure you have CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET 
// in your app.json extra or .env
// For this implementation, I will access them from Constants.expoConfig.extra or hardcode placeholders for now

const CLOUD_NAME = Constants.expoConfig?.extra?.cloudinaryCloudName || 'YOUR_CLOUD_NAME';
const UPLOAD_PRESET = Constants.expoConfig?.extra?.cloudinaryUploadPreset || 'YOUR_PRESET';


const OwnerRegistrationScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext); // Assuming user contains userId
    const [loading, setLoading] = useState(false);

    // Form State
    const [vehicleData, setVehicleData] = useState({
        carName: '',
        carModel: '',
        licensePlate: '',
        year: '',
        color: '#FFFFFF', // Default color
    });

    // Image/Doc State
    const [vehicleImage, setVehicleImage] = useState(null);
    const [rcDoc, setRcDoc] = useState(null);
    const [pollutionDoc, setPollutionDoc] = useState(null);

    // Upload Status State (for spinners)
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingRc, setUploadingRc] = useState(false);
    const [uploadingPollution, setUploadingPollution] = useState(false);

    // Business Logic State
    const [servicePreferences, setServicePreferences] = useState({
        standard: true,
        coDriver: false,
        fullDriver: false
    });

    const colors = ['#FFFFFF', '#C0C0C0', '#FF4444', '#4488FF', '#FFBB33', '#111111'];

    // Helper for picking images
    const pickImage = async (setImageFunc, setUploadingFunc) => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Sorry, we need camera roll permissions to make this work!');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.7,
        });

        if (!result.canceled) {
            handleUpload(result.assets[0].uri, setImageFunc, setUploadingFunc);
        }
    };

    // Helper for direct upload
    const handleUpload = async (uri, setStateFunc, setLoadingFunc) => {
        setLoadingFunc(true);
        try {
            // Check if credentials are placeholders
            if (CLOUD_NAME === 'YOUR_CLOUD_NAME' || UPLOAD_PRESET === 'YOUR_PRESET') {
                Alert.alert("Configuration Error", "Please set Cloudinary credentials in app.json or ENV.");
                return;
            }

            const url = await uploadToCloudinary(uri, CLOUD_NAME, UPLOAD_PRESET);
            setStateFunc(url);
        } catch (error) {
            Alert.alert("Upload Failed", "Could not upload image. Please try again.");
        } finally {
            setLoadingFunc(false);
        }
    };

    const handleRegister = async () => {
        // Validation
        if (!vehicleData.carName || !vehicleData.carModel || !vehicleData.licensePlate || !vehicleData.year || !vehicleImage) {
            Alert.alert("Missing Details", "Please fill all required fields and upload a vehicle image.");
            return;
        }

        setLoading(true);
        try {
            // Prepare payload
            const selectedServices = Object.keys(servicePreferences).filter(key => servicePreferences[key]);

            // Map service keys to friendly strings if needed
            const friendlyPreferences = selectedServices.map(key => {
                if (key === 'standard') return 'Standard';
                if (key === 'coDriver') return 'Co-Driver';
                if (key === 'fullDriver') return 'Full Driver';
                return key;
            });

            const payload = {
                userId: user?._id, // Ensure user ID is available
                make: vehicleData.carName, // Mapping 'Name' to 'Make' loosely based on UI, usually Make=Brand
                model: vehicleData.carModel,
                plate: vehicleData.licensePlate,
                year: parseInt(vehicleData.year),
                color: vehicleData.color,
                vehicleImage: vehicleImage,
                rcCertificate: rcDoc,
                pollutionCertificate: pollutionDoc,
                servicePreferences: friendlyPreferences
            };

            // Call API
            const response = await registerVehicle(payload);

            console.log("Registration Response:", response);

            // TODO: Replace with real API call
            // await new Promise(resolve => setTimeout(resolve, 1000)); 

            Alert.alert("Success", "Vehicle Registered Successfully!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);

        } catch (error) {
            Alert.alert("Error", error.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Add New Vehicle</Text>
                </View>

                {/* Vehicle Image Upload */}
                <View style={styles.imageUploadContainer}>
                    <Image
                        source={vehicleImage ? { uri: vehicleImage } : null} // Placeholder could be added
                        style={styles.vehicleImage}
                    />
                    {!vehicleImage && (
                        <View style={[styles.placeholderOverlay, { backgroundColor: theme.surface }]}>
                            <Ionicons name="car-sport-outline" size={60} color={theme.textSecondary} />
                        </View>
                    )}

                    <TouchableOpacity
                        style={styles.uploadBtnOverlay}
                        onPress={() => pickImage(setVehicleImage, setUploadingImage)}
                        disabled={uploadingImage}
                    >
                        {uploadingImage ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="camera" size={20} color="#fff" />
                                <Text style={styles.uploadBtnText}>Upload Photo</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.formContainer}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Car Name (Make)</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                        placeholder="e.g. Toyota"
                        placeholderTextColor={theme.textSecondary}
                        value={vehicleData.carName}
                        onChangeText={(text) => setVehicleData({ ...vehicleData, carName: text })}
                    />

                    <Text style={[styles.label, { color: theme.textSecondary }]}>Car Model</Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                        placeholder="e.g. Camry"
                        placeholderTextColor={theme.textSecondary}
                        value={vehicleData.carModel}
                        onChangeText={(text) => setVehicleData({ ...vehicleData, carModel: text })}
                    />

                    <View style={styles.row}>
                        <View style={styles.halfInput}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>License Plate</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                                placeholder="ABC-1234"
                                placeholderTextColor={theme.textSecondary}
                                value={vehicleData.licensePlate}
                                onChangeText={(text) => setVehicleData({ ...vehicleData, licensePlate: text })}
                            />
                        </View>
                        <View style={styles.halfInput}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>Year</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: theme.border }]}
                                placeholder="2024"
                                placeholderTextColor={theme.textSecondary}
                                keyboardType="numeric"
                                value={vehicleData.year}
                                onChangeText={(text) => setVehicleData({ ...vehicleData, year: text })}
                            />
                        </View>
                    </View>

                    {/* Color Picker */}
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Car Color</Text>
                    <View style={styles.colorRow}>
                        {colors.map((c) => (
                            <TouchableOpacity
                                key={c}
                                style={[styles.colorCircle, { backgroundColor: c, borderColor: theme.border }]}
                                onPress={() => setVehicleData({ ...vehicleData, color: c })}
                            >
                                {vehicleData.color === c && (
                                    <Ionicons name="checkmark" size={16} color={c === '#FFFFFF' ? '#000' : '#fff'} />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Document Uploads */}
                    <Text style={[styles.label, { color: theme.textSecondary, marginTop: 20 }]}>Documents (Optional)</Text>
                    <View style={styles.docRow}>
                        <TouchableOpacity
                            style={[styles.docButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                            onPress={() => pickImage(setRcDoc, setUploadingRc)}
                            disabled={uploadingRc}
                        >
                            {uploadingRc ? <ActivityIndicator color={theme.primary} /> : (
                                <Text style={{ color: rcDoc ? theme.success : theme.textPrimary }}>
                                    {rcDoc ? "RC Uploaded" : "Upload RC"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.docButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                            onPress={() => pickImage(setPollutionDoc, setUploadingPollution)}
                            disabled={uploadingPollution}
                        >
                            {uploadingPollution ? <ActivityIndicator color={theme.primary} /> : (
                                <Text style={{ color: pollutionDoc ? theme.success : theme.textPrimary }}>
                                    {pollutionDoc ? "Pollution Uploaded" : "Upload Pollution"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Service Preferences */}
                    <Text style={[styles.headerTitle, { color: theme.textPrimary, marginTop: 30, fontSize: 18 }]}>Service Preferences</Text>

                    <View style={styles.prefRow}>
                        <Text style={{ color: theme.textPrimary, flex: 1 }}>Standard Service (Passengers)</Text>
                        <Switch
                            value={servicePreferences.standard}
                            onValueChange={(val) => setServicePreferences(prev => ({ ...prev, standard: val }))}
                            trackColor={{ true: theme.primary }}
                        />
                    </View>
                    <View style={styles.prefRow}>
                        <Text style={{ color: theme.textPrimary, flex: 1 }}>Need Co-Driver</Text>
                        <Switch
                            value={servicePreferences.coDriver}
                            onValueChange={(val) => setServicePreferences(prev => ({ ...prev, coDriver: val }))}
                            trackColor={{ true: theme.primary }}
                        />
                    </View>
                    <View style={styles.prefRow}>
                        <Text style={{ color: theme.textPrimary, flex: 1 }}>Full Driver Needed</Text>
                        <Switch
                            value={servicePreferences.fullDriver}
                            onValueChange={(val) => setServicePreferences(prev => ({ ...prev, fullDriver: val }))}
                            trackColor={{ true: theme.primary }}
                        />
                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitButton, { backgroundColor: theme.primary }]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color="#fff" /> : (
                            <Text style={styles.submitText}>+ Add Car</Text>
                        )}
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { paddingBottom: 50 },
    header: { flexDirection: 'row', alignItems: 'center', padding: SIZES.padding, paddingTop: 10 },
    backButton: { marginRight: 15 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },

    imageUploadContainer: {
        height: 200,
        margin: SIZES.padding,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
    },
    vehicleImage: { width: '100%', height: '100%', resizeMode: 'cover' },
    placeholderOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' },
    uploadBtnOverlay: {
        position: 'absolute',
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    uploadBtnText: { color: '#fff', fontWeight: '600' },

    formContainer: { padding: SIZES.padding },
    label: { marginBottom: 8, fontSize: 14, fontWeight: '500' },
    input: {
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 15,
        marginBottom: 15,
        fontSize: 16,
    },
    row: { flexDirection: 'row', gap: 15 },
    halfInput: { flex: 1 },

    colorRow: { flexDirection: 'row', gap: 10, marginBottom: 15 },
    colorCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },

    docRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
    docButton: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderStyle: 'dashed'
    },

    prefRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 15,
        paddingVertical: 5
    },

    submitButton: {
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 5
    },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default OwnerRegistrationScreen;
