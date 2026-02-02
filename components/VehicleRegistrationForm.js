import React, { useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View, Text, StyleSheet, TouchableOpacity,
    TextInput, Image, Alert, ActivityIndicator, Switch, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { SIZES } from '../constants/theme';
import { uploadToCloudinary } from '../utils/uploadToCloudinary';
import { registerVehicle, updateVehicle } from '../services/api';
import Constants from 'expo-constants';

// Access Cloudinary config
const CLOUD_NAME = Constants.expoConfig?.extra?.cloudinaryCloudName || 'dhkqyogas';
const UPLOAD_PRESET = Constants.expoConfig?.extra?.cloudinaryUploadPreset || 'omniebee';

// ... (props include initialValues and isEditMode)
const VehicleRegistrationForm = ({ onSuccess, initialValues, isEditMode }) => {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [draftId] = useState(initialValues?.id || Date.now().toString());

    // Form State (init with initialValues if editing)
    const [vehicleData, setVehicleData] = useState({
        carName: initialValues?.make || '',
        carModel: initialValues?.model || '',
        licensePlate: initialValues?.plate || '',
        year: initialValues?.year ? initialValues.year.toString() : '',
    });

    const [vehicleImage, setVehicleImage] = useState(initialValues?.vehicleImage || null);
    const [rcDoc, setRcDoc] = useState(initialValues?.documents?.rc || null);
    const [pollutionDoc, setPollutionDoc] = useState(initialValues?.documents?.pollution || null);
    const [rcName, setRcName] = useState(initialValues?.documents?.rcName || (initialValues?.documents?.rc ? initialValues.documents.rc.split('/').pop() : ''));
    const [pollutionName, setPollutionName] = useState(initialValues?.documents?.pollutionName || (initialValues?.documents?.pollution ? initialValues.documents.pollution.split('/').pop() : ''));

    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingRc, setUploadingRc] = useState(false);
    const [uploadingPollution, setUploadingPollution] = useState(false);

    const [servicePreferences, setServicePreferences] = useState({
        standard: true,
        coDriver: false,
        fullDriver: false
    });

    const [errors, setErrors] = useState({});

    // Auto-save draft
    useEffect(() => {
        if (!isEditMode) {
            const saveDraft = async () => {
                // Don't save if all fields are empty
                const hasData = vehicleData.carName || vehicleData.carModel || vehicleData.licensePlate || vehicleImage || rcDoc;
                if (!hasData) return;

                const currentDraft = {
                    id: draftId,
                    vehicleData,
                    vehicleImage,
                    rcDoc,
                    pollutionDoc,
                    rcName,
                    pollutionName,
                    updatedAt: new Date().toISOString()
                };

                try {
                    const existingDraftsJson = await AsyncStorage.getItem('@vehicle_drafts');
                    let drafts = existingDraftsJson ? JSON.parse(existingDraftsJson) : [];

                    // Filter out existing version of this draft if it exists
                    drafts = drafts.filter(d => d.id !== draftId);

                    // Add current version to the top
                    drafts.unshift(currentDraft);

                    // Limit to e.g. 5 drafts
                    const limitedDrafts = drafts.slice(0, 5);

                    await AsyncStorage.setItem('@vehicle_drafts', JSON.stringify(limitedDrafts));
                } catch (e) {
                    console.error("Failed to save drafts", e);
                }
            };

            const timeoutId = setTimeout(saveDraft, 1000); // Debounce
            return () => clearTimeout(timeoutId);
        }
    }, [vehicleData, vehicleImage, rcDoc, pollutionDoc, rcName, pollutionName, isEditMode, draftId]);

    const pickImage = async (setImageFunc, setUploadingFunc, setNameFunc, errorKey) => {
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
            const uri = result.assets[0].uri;
            if (setNameFunc) {
                const fileName = uri.split('/').pop();
                setNameFunc(fileName);
            }
            handleUpload(uri, setImageFunc, setUploadingFunc, errorKey);
        }
    };

    const handleUpload = async (uri, setStateFunc, setLoadingFunc, errorKey) => {
        setLoadingFunc(true);
        try {
            const url = await uploadToCloudinary(uri, CLOUD_NAME, UPLOAD_PRESET);
            setStateFunc(url);
            if (errorKey) {
                setErrors(prev => ({ ...prev, [errorKey]: null }));
            }
        } catch (error) {
            Alert.alert("Upload Failed", "Could not upload image. Please try again.");
            console.error(error);
        } finally {
            setLoadingFunc(false);
        }
    };

    const validateForm = () => {
        let newErrors = {};
        if (!vehicleData.carName.trim()) newErrors.carName = "Car name is required";
        if (!vehicleData.carModel.trim()) newErrors.carModel = "Car model is required";
        if (!vehicleData.licensePlate.trim()) {
            newErrors.licensePlate = "Number plate is required";
        } else if (!/^[A-Z0-9]+$/i.test(vehicleData.licensePlate)) {
            newErrors.licensePlate = "Only letters and numbers allowed";
        }

        // Year is optional, but if filled, must be 4 digits
        if (vehicleData.year && !/^\d{4}$/.test(vehicleData.year)) {
            newErrors.year = "Year must be 4 digits";
        }

        if (!vehicleImage) newErrors.vehicleImage = "Vehicle photo is required";
        if (!rcDoc) newErrors.rcDoc = "RC document is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        try {
            // ... (payload construction)
            const selectedServices = Object.keys(servicePreferences).filter(key => servicePreferences[key]);
            const friendlyPreferences = selectedServices.map(key => {
                if (key === 'standard') return 'Standard';
                if (key === 'coDriver') return 'Co-Driver';
                if (key === 'fullDriver') return 'Full Driver';
                return key;
            });

            const payload = {
                userId: user?._id,
                make: vehicleData.carName,
                model: vehicleData.carModel,
                plate: vehicleData.licensePlate,
                year: parseInt(vehicleData.year),
                vehicleImage: vehicleImage,
                rcCertificate: rcDoc,
                pollutionCertificate: pollutionDoc,
                servicePreferences: friendlyPreferences
            };

            if (isEditMode) {
                await updateVehicle(initialValues._id, payload);
                Alert.alert("Success", "Vehicle Updated Successfully!", [
                    { text: "OK", onPress: () => onSuccess && onSuccess() }
                ]);
            } else {
                await registerVehicle(payload);

                // Clear this specific draft from the drafts array
                try {
                    const existingDraftsJson = await AsyncStorage.getItem('@vehicle_drafts');
                    if (existingDraftsJson) {
                        let drafts = JSON.parse(existingDraftsJson);
                        drafts = drafts.filter(d => d.id !== draftId);
                        await AsyncStorage.setItem('@vehicle_drafts', JSON.stringify(drafts));
                    }
                } catch (e) {
                    console.error("Failed to clear draft", e);
                }

                Alert.alert("Success", "Vehicle Registered Successfully!", [
                    { text: "OK", onPress: () => onSuccess && onSuccess() }
                ]);
            }

        } catch (error) {
            Alert.alert("Error", error.message || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.formContent}>
            {/* Use styles matched from OwnerRegistrationScreen but adapted for component usage */}

            {/* Image Upload */}
            <View style={styles.imageUploadContainer}>
                <Image
                    source={vehicleImage ? { uri: vehicleImage } : null}
                    style={styles.vehicleImage}
                />
                {!vehicleImage && (
                    <View style={[styles.placeholderOverlay, { backgroundColor: theme.surface }]}>
                        <Ionicons name="car-sport-outline" size={60} color={theme.textSecondary} />
                    </View>
                )}
                <TouchableOpacity
                    style={styles.uploadBtnOverlay}
                    onPress={() => pickImage(setVehicleImage, setUploadingImage, null, 'vehicleImage')}
                    disabled={uploadingImage}
                >
                    {uploadingImage ? <ActivityIndicator color="#fff" /> : (
                        <>
                            <Ionicons name="camera" size={20} color="#fff" />
                            <Text style={styles.uploadBtnText}>Upload Photo</Text>
                        </>
                    )}
                </TouchableOpacity>
                {errors.vehicleImage && <Text style={styles.errorText}>{errors.vehicleImage}</Text>}
            </View>

            <View style={styles.formContainer}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    Car Name <Text style={{ color: theme.danger || 'red' }}>*</Text>
                </Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: errors.carName ? theme.danger : theme.border }]}
                    placeholder="e.g. Toyota"
                    placeholderTextColor={theme.textSecondary}
                    value={vehicleData.carName}
                    onChangeText={(text) => {
                        setVehicleData({ ...vehicleData, carName: text });
                        if (errors.carName) setErrors({ ...errors, carName: null });
                    }}
                />
                {errors.carName && <Text style={styles.errorText}>{errors.carName}</Text>}

                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    Car Model <Text style={{ color: theme.danger || 'red' }}>*</Text>
                </Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: errors.carModel ? theme.danger : theme.border }]}
                    placeholder="e.g. Camry"
                    placeholderTextColor={theme.textSecondary}
                    value={vehicleData.carModel}
                    onChangeText={(text) => {
                        setVehicleData({ ...vehicleData, carModel: text });
                        if (errors.carModel) setErrors({ ...errors, carModel: null });
                    }}
                />
                {errors.carModel && <Text style={styles.errorText}>{errors.carModel}</Text>}

                <View style={styles.row}>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>
                            Number Plate <Text style={{ color: theme.danger || 'red' }}>*</Text>
                        </Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: errors.licensePlate ? theme.danger : theme.border }]}
                            placeholder="ABC-1234"
                            placeholderTextColor={theme.textSecondary}
                            value={vehicleData.licensePlate}
                            onChangeText={(text) => {
                                const alphanumeric = text.replace(/[^A-Za-z0-9]/g, '');
                                setVehicleData({ ...vehicleData, licensePlate: alphanumeric });
                                if (errors.licensePlate) setErrors({ ...errors, licensePlate: null });
                            }}
                        />
                        {errors.licensePlate && <Text style={styles.errorText}>{errors.licensePlate}</Text>}
                    </View>
                    <View style={styles.halfInput}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>Year (Optional)</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, color: theme.textPrimary, borderColor: errors.year ? theme.danger : theme.border }]}
                            placeholder="2024"
                            placeholderTextColor={theme.textSecondary}
                            keyboardType="numeric"
                            maxLength={4}
                            value={vehicleData.year}
                            onChangeText={(text) => {
                                const numericValue = text.replace(/[^0-9]/g, '');
                                setVehicleData({ ...vehicleData, year: numericValue });
                                if (errors.year) setErrors({ ...errors, year: null });
                            }}
                        />
                        {errors.year && <Text style={styles.errorText}>{errors.year}</Text>}
                    </View>
                </View>

                {/* Documents */}
                <Text style={[styles.label, { color: theme.textSecondary, marginTop: 20 }]}>Documents</Text>
                <View style={styles.docRow}>
                    <View style={{ flex: 1 }}>
                        <TouchableOpacity
                            style={[styles.docButton, { borderColor: errors.rcDoc ? theme.danger : theme.border, backgroundColor: theme.surface }]}
                            onPress={() => pickImage(setRcDoc, setUploadingRc, setRcName, 'rcDoc')}
                            disabled={uploadingRc}
                        >
                            {uploadingRc ? <ActivityIndicator color={theme.primary} /> : (
                                <Text style={{ color: rcDoc ? theme.success : theme.textPrimary }}>
                                    {rcDoc ? "RC Uploaded" : "Upload RC "}
                                    {!rcDoc && <Text style={{ color: theme.danger || 'red' }}>*</Text>}
                                </Text>
                            )}
                        </TouchableOpacity>
                        {rcDoc && (
                            <View style={[styles.docPreviewContainer, { backgroundColor: theme.surface }]}>
                                <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                                <Text style={[styles.docName, { color: theme.textPrimary }]} numberOfLines={1}>
                                    {rcName || "RC_Document.jpg"}
                                </Text>
                                <TouchableOpacity
                                    style={styles.removeDocBtnSmall}
                                    onPress={() => {
                                        setRcDoc(null);
                                        setRcName('');
                                        if (errors.rcDoc) setErrors({ ...errors, rcDoc: null });
                                    }}
                                >
                                    <Ionicons name="close-circle" size={20} color={theme.danger} />
                                </TouchableOpacity>
                            </View>
                        )}
                        {errors.rcDoc && <Text style={styles.docErrorText}>{errors.rcDoc}</Text>}
                    </View>

                    <View style={{ flex: 1 }}>
                        <TouchableOpacity
                            style={[styles.docButton, { borderColor: theme.border, backgroundColor: theme.surface }]}
                            onPress={() => pickImage(setPollutionDoc, setUploadingPollution, setPollutionName)}
                            disabled={uploadingPollution}
                        >
                            {uploadingPollution ? <ActivityIndicator color={theme.primary} /> : (
                                <Text style={{ color: pollutionDoc ? theme.success : theme.textPrimary }}>
                                    {pollutionDoc ? "Pollution Uploaded" : "Upload Pollution (Optional)"}
                                </Text>
                            )}
                        </TouchableOpacity>
                        {pollutionDoc && (
                            <View style={[styles.docPreviewContainer, { backgroundColor: theme.surface }]}>
                                <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                                <Text style={[styles.docName, { color: theme.textPrimary }]} numberOfLines={1}>
                                    {pollutionName || "Pollution_Doc.jpg"}
                                </Text>
                                <TouchableOpacity style={styles.removeDocBtnSmall} onPress={() => {
                                    setPollutionDoc(null);
                                    setPollutionName('');
                                }}>
                                    <Ionicons name="close-circle" size={20} color={theme.danger} />
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                </View>

                {/* Submit */}
                <TouchableOpacity
                    style={[styles.submitButton, { backgroundColor: theme.primary }]}
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : (
                        <Text style={styles.submitText}>{isEditMode ? "Update Vehicle" : "+ Add Car"}</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    errorText: { color: 'red', fontSize: 11, marginTop: -10, marginBottom: 10, marginLeft: 5 },
    docErrorText: { color: 'red', fontSize: 11, marginTop: 5, marginBottom: 5, marginLeft: 5 },
    formContent: { marginBottom: 30 },
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
    docPreviewContainer: {
        marginTop: 10,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        height: 45,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#eee',
        gap: 8
    },
    docName: {
        flex: 1,
        fontSize: 13,
        fontWeight: '500'
    },
    removeDocBtnSmall: {
        marginLeft: 5
    },
    submitButton: {
        height: 55,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 30,
    },
    submitText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});

export default VehicleRegistrationForm;
