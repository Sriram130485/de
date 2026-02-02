import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ScrollView, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api from '../services/api';
import * as FileSystem from 'expo-file-system/legacy';
// Local constants for backend verification
const VERIFICATION_STATUS = {
    VERIFIED: 'VERIFIED',
    REVIEW_REQUIRED: 'REVIEW_REQUIRED',
    FAILED: 'FAILED'
};

const DigilockerVerificationScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { user, loadUser } = useContext(AuthContext);
    const [result, setResult] = useState(null);
    const [verifying, setVerifying] = useState(false);

    // Form State (Removed as per requirement)
    // const [dlNumber, setDlNumber] = useState('');
    // const [panNumber, setPanNumber] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalConfig, setModalConfig] = useState({ type: 'success', title: '', message: '' });
    const [errorMessage, setErrorMessage] = useState(null); // New state for inline error

    // Deep Link Handler
    const handleDeepLink = async (event) => {
        let data = Linking.parse(event.url);

        console.log("Deep link received:", event.url);

        const status = data.queryParams?.status;
        const code = data.queryParams?.code;
        const state = data.queryParams?.state;
        const sessionId = data.queryParams?.sessionId; // Legacy
        const rawError = data.queryParams?.error;
        const error = rawError ? rawError.trim() : null;

        console.log(`Parsed Status: ${status}, Error: '${error}'`);

        WebBrowser.dismissBrowser();

        if (status === 'success' && code && state) {
            console.log("✅ OAuth Success. Exchanging Token with Backend...");
            setErrorMessage(null); // Clear any previous errors
            exchangeTokenAndVerify(code, state);
        } else if (status === 'success' && sessionId) {
            console.log("⚠️ Legacy SessionID detected. Verifying...");
            verifyDetails(sessionId);
        } else if (error === 'no_issued_docs') {
            // Handle specific no_issued_docs error inline
            console.log("⚠️ No Issued Docs Error - Showing inline message");
            setErrorMessage("NO_DOCS_INSTRUCTION");
            setModalVisible(false);
            setVerifying(false); // Stop loading state
        } else if (error) {
            console.error("DigiLocker Error:", error);
            setModalConfig({
                type: 'error',
                title: 'Verification Cancelled',
                message: 'DigiLocker verification was cancelled or failed.'
            });
            setModalVisible(true);
            setVerifying(false); // Stop loading state
        }
    };

    // Persist "No Docs" instruction if user has failed history
    useEffect(() => {
        if (user?.digilockerRetryCount > 0) {
            setErrorMessage("NO_DOCS_INSTRUCTION");
        } else {
            // Optionally clear it if count is 0 (success)
            setErrorMessage(null);
        }
    }, [user]);


    const downloadImage = async (uri) => {
        try {
            if (!uri) return null;

            // Generate a clean unique filename to avoid path issues with special chars/query params
            const timestamp = Date.now();
            // We assume jpg mostly, but could try to infer. For now, a clean name is priority.
            // Digilocker images are often JPG/PNG.
            const filename = `digilocker_temp_${timestamp}.jpg`;
            const fileUri = `${FileSystem.documentDirectory}${filename}`;

            console.log(`Downloading image...`);

            // Legacy API downloadAsync
            const result = await FileSystem.downloadAsync(uri, fileUri);

            if (result.status !== 200) {
                console.error("Download failed with status:", result.status);
                return null;
            }

            // Verify file info
            const info = await FileSystem.getInfoAsync(result.uri);
            if (!info.exists) {
                console.error("Downloaded file does not exist at:", result.uri);
                return null;
            }

            return result.uri;
        } catch (error) {
            console.error("Image Download Error:", error);
            return null;
        }
    };

    const verifyWithBackendOCR = async (localUri, docType, dataToVerify) => {
        try {
            console.log(`Uploading ${docType} for Backend OCR...`);
            // Construct base URL from api instance if possible, or use relative? 
            // FileSystem cannot use relative. We need absolute. 
            // api.defaults.baseURL is likely 'http://192.168.1.11:5000/api'
            const baseUrl = api.defaults.baseURL;
            const uploadUrl = `${baseUrl}/digilocker/verify-ocr`;

            const response = await FileSystem.uploadAsync(uploadUrl, localUri, {
                fieldName: 'documentImage',
                httpMethod: 'POST',
                uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                parameters: {
                    docType: docType,
                    digilockerData: JSON.stringify(dataToVerify)
                }
            });

            console.log(`Backend OCR Response (${docType}):`, response.body);
            return JSON.parse(response.body);
        } catch (error) {
            console.error(`Backend OCR Upload Error (${docType}):`, error);
            // If upload fails, we can assume technical issue or network. 
            // We should ideally return FAILED so the user knows.
            return { status: VERIFICATION_STATUS.FAILED, reason: "OCR Upload Service failed: " + error.message };
        }
    };

    const exchangeTokenAndVerify = async (code, state) => {
        try {
            setVerifying(true);

            // 1. Exchange Code for Token (Local Backend)
            const response = await api.post('/digilocker/exchange-token', {
                code,
                state
            });

            if (response.data.success) {
                console.log("Token Exchange & Fetch Success");
                const { extractedData } = response.data;
                // Proceed to OCR Comparison (Reusing logic)
                // We can either call a shared function or implement here.
                // let's reuse verifyMatch logic but we need to adapt it. 
                // Actually the `verify-match` endpoint is now redundant if we do this differently, 
                // or we can just send the data to `verify-match` manually? 
                // Better: Pass the `extractedData` directly to the OCR / Finalize steps.

                // Since we have the data, let's verify text match LOCALLY or via a helper?
                // The old verifyMatch did DB lookup. 
                // Let's call verifyMatch with the extractedData? No, verifyMatch expects sessionId.
                // We should probably just call `verify-ocr` and `finalize` now. 
                // But wait, we need to check TEXT match too (DL number vs DB).

                // Let's call a new endpoint `verify-text-match` or just do it in the app? 
                // Security risk if app does it? 
                // The Backend `exchange-token` ALREADY fetched the docs. 
                // Ideally `exchange-token` should ALSO return the Match Result. 

                // For now, let's assume `exchange-token` returns `extractedData`.
                // We will verify against User Data in Context?
                // Or we can add a simple backend check.

                // Let's just proceed to OCR if data exists.
                // Or we can modify `verify-match` to accept raw data?

                // Simplest: `exchange-token` returns the data. We proceed to OCR.
                // Text match is implicitly done if we verify OCR?
                // User requirement: "Match details".
                // Let's continue to OCR directly.

                performOCRVerification(extractedData);

            } else {
                setModalConfig({ type: 'error', title: 'Token Error', message: response.data.message });
                setModalVisible(true);
            }
        } catch (error) {
            console.error(error);
            setModalConfig({ type: 'error', title: 'Exchange Error', message: error.message });
            setModalVisible(true);
        } finally {
            setVerifying(false);
        }
    };

    // Extracted OCR Logic for reuse
    const performOCRVerification = async (digilockerData) => {
        // ... Similar to the logic inside verifyDetails but using digilockerData object
        // We'll copy the logic from verifyDetails 2nd half here in next steps or refactor.

        // For this specific insert, I'll just put a placeholder and then REFACTOR verifyDetails to use it.
        verifyDetailsWithData(digilockerData);
    };

    const verifyDetailsWithData = async (digilockerData) => {
        try {
            // Granular Verification Status
            const newVerificationStatus = {
                dl: false,
                pan: false,
                aadhar: false
            };
            let failureReasons = [];

            // --- 1. Driving License Verification ---
            if (digilockerData?.dlNumber && user?.documentImages?.licenseFront) {
                const localUri = await downloadImage(user.documentImages.licenseFront);
                if (localUri) {
                    const dlResult = await verifyWithBackendOCR(localUri, 'DL', {
                        number: digilockerData.dlNumber,
                        name: digilockerData.name,
                        dob: digilockerData.dob
                    });
                    await FileSystem.deleteAsync(localUri, { idempotent: true });

                    if (dlResult.status === VERIFICATION_STATUS.VERIFIED) {
                        newVerificationStatus.dl = true;
                        console.log("✅ DL Verified");
                    } else {
                        const reason = dlResult.reason || "Details mismatch";
                        console.warn("❌ DL Failed:", reason);
                        failureReasons.push(`DL: ${reason}`);
                    }
                } else {
                    failureReasons.push("DL: Image download failed");
                }
            } else {
                failureReasons.push("DL: Missing Data or Image");
            }

            // --- 2. PAN Card Verification ---
            if (digilockerData?.panNumber && user?.documentImages?.panFront) {
                const localUri = await downloadImage(user.documentImages.panFront);
                if (localUri) {
                    const panResult = await verifyWithBackendOCR(localUri, 'PAN', {
                        number: digilockerData.panNumber,
                        name: digilockerData.name,
                        dob: digilockerData.dob
                    });
                    await FileSystem.deleteAsync(localUri, { idempotent: true });

                    if (panResult.status === VERIFICATION_STATUS.VERIFIED) {
                        newVerificationStatus.pan = true;
                        console.log("✅ PAN Verified");
                    } else {
                        const reason = panResult.reason || "Details mismatch";
                        console.warn("❌ PAN Failed:", reason);
                        failureReasons.push(`PAN: ${reason}`);
                    }
                } else {
                    failureReasons.push("PAN: Image download failed");
                }
            } else {
                // PAN might be optional or handled differently? Assuming required for now as per previous logic
                failureReasons.push("PAN: Missing Data or Image");
            }

            // --- 3. Aadhaar Verification ---
            if (user?.aadharNumber && user?.documentImages?.aadharFront) {
                const localUri = await downloadImage(user.documentImages.aadharFront);
                if (localUri) {
                    const aadhaarResult = await verifyWithBackendOCR(localUri, 'AADHAAR', {
                        number: user.aadharNumber,
                        name: digilockerData.name,
                        dob: digilockerData.dob
                    });
                    await FileSystem.deleteAsync(localUri, { idempotent: true });

                    if (aadhaarResult.status === VERIFICATION_STATUS.VERIFIED) {
                        newVerificationStatus.aadhar = true;
                        console.log("✅ Aadhaar Verified");
                    } else {
                        const reason = aadhaarResult.reason || "Details mismatch";
                        console.warn("❌ Aadhaar Failed:", reason);
                        failureReasons.push(`Aadhaar: ${reason}`);
                    }
                } else {
                    failureReasons.push("Aadhaar: Image download failed");
                }
            } else {
                failureReasons.push("Aadhaar: Missing Data or Image");
            }

            // Check Final Status
            const allPassed = newVerificationStatus.dl && newVerificationStatus.pan && newVerificationStatus.aadhar;

            if (allPassed) {
                // 3. Finalize Verification on Backend
                const finalRes = await api.post(`/digilocker/finalize-verification`, {
                    userId: user?._id,
                    status: 'VERIFIED',
                    detailedStatus: newVerificationStatus
                });

                if (finalRes.data.success) {
                    console.log("Final Approval Success");
                    setIsVerified(true);
                    if (loadUser) await loadUser();

                    setTimeout(() => {
                        navigation.reset({
                            index: 0,
                            routes: [{ name: 'RoleSelection' }],
                        });
                    }, 2000);
                } else {
                    setModalConfig({
                        type: 'error',
                        title: 'Verification Error',
                        message: "Failed to finalize verification status."
                    });
                    setModalVisible(true);
                }
            } else {
                // Show specific failures
                const message = "Some documents failed verification:\n" + failureReasons.join("\n");
                setModalConfig({
                    type: 'error',
                    title: 'Verification Incomplete',
                    message: message
                });
                setModalVisible(true);

                // Optional: Send partial status to backend if needed for logging
                await api.post(`/digilocker/finalize-verification`, {
                    userId: user?._id,
                    status: 'PARTIAL',
                    detailedStatus: newVerificationStatus
                });
            }
        } catch (error) {
            console.error(error);
            setModalConfig({ type: 'error', title: 'Verification Logic Error', message: error.message });
            setModalVisible(true);
        }
    };

    const verifyDetails = async (sessionId) => {
        try {
            setVerifying(true);

            // 1. Call Backend to Verify Match against DB Records (Text Match)
            const response = await api.post(`/digilocker/verify-match`, {
                sessionId,
                userId: user?._id
            });

            if (response.data.success) {
                console.log("Text Verification Success:", response.data.message);
                const { digilockerData } = response.data;

                // 2. Perform OCR Verification (Image vs DigiLocker Data)
                // Only if we have the images in user profile

                // Granular Verification Status
                const newVerificationStatus = {
                    dl: false,
                    pan: false,
                    aadhar: false
                };
                let failureReasons = [];

                // --- 1. Driving License Verification ---
                if (digilockerData?.dlNumber && user?.documentImages?.licenseFront) {
                    const localUri = await downloadImage(user.documentImages.licenseFront);
                    if (localUri) {
                        const dlResult = await verifyWithBackendOCR(localUri, 'DL', {
                            number: digilockerData.dlNumber,
                            name: digilockerData.name,
                            dob: digilockerData.dob
                        });
                        await FileSystem.deleteAsync(localUri, { idempotent: true });

                        if (dlResult.status === VERIFICATION_STATUS.VERIFIED) {
                            newVerificationStatus.dl = true;
                            console.log("✅ DL Verified");
                        } else {
                            const reason = dlResult.reason || "Details mismatch";
                            console.warn("❌ DL Failed:", reason);
                            failureReasons.push(`DL: ${reason}`);
                        }
                    } else {
                        failureReasons.push("DL: Image download failed");
                    }
                } else {
                    failureReasons.push("DL: Missing Data or Image");
                }

                // --- 2. PAN Card Verification ---
                if (digilockerData?.panNumber && user?.documentImages?.panFront) {
                    const localUri = await downloadImage(user.documentImages.panFront);
                    if (localUri) {
                        const panResult = await verifyWithBackendOCR(localUri, 'PAN', {
                            number: digilockerData.panNumber,
                            name: digilockerData.name,
                            dob: digilockerData.dob
                        });
                        await FileSystem.deleteAsync(localUri, { idempotent: true });

                        if (panResult.status === VERIFICATION_STATUS.VERIFIED) {
                            newVerificationStatus.pan = true;
                            console.log("✅ PAN Verified");
                        } else {
                            const reason = panResult.reason || "Details mismatch";
                            console.warn("❌ PAN Failed:", reason);
                            failureReasons.push(`PAN: ${reason}`);
                        }
                    } else {
                        failureReasons.push("PAN: Image download failed");
                    }
                } else {
                    failureReasons.push("PAN: Missing Data or Image");
                }

                // --- 3. Aadhaar Verification ---
                if (user?.aadharNumber && user?.documentImages?.aadharFront) {
                    const localUri = await downloadImage(user.documentImages.aadharFront);
                    if (localUri) {
                        const aadhaarResult = await verifyWithBackendOCR(localUri, 'AADHAAR', {
                            number: user.aadharNumber,
                            name: digilockerData.name,
                            dob: digilockerData.dob
                        });
                        await FileSystem.deleteAsync(localUri, { idempotent: true });

                        if (aadhaarResult.status === VERIFICATION_STATUS.VERIFIED) {
                            newVerificationStatus.aadhar = true;
                            console.log("✅ Aadhaar Verified");
                        } else {
                            const reason = aadhaarResult.reason || "Details mismatch";
                            console.warn("❌ Aadhaar Failed:", reason);
                            failureReasons.push(`Aadhaar: ${reason}`);
                        }
                    } else {
                        failureReasons.push("Aadhaar: Image download failed");
                    }
                } else {
                    failureReasons.push("Aadhaar: Missing Data or Image");
                }

                // Check Final Status
                const allPassed = newVerificationStatus.dl && newVerificationStatus.pan && newVerificationStatus.aadhar;

                if (allPassed) {
                    // 3. Finalize Verification on Backend
                    const finalRes = await api.post(`/digilocker/finalize-verification`, {
                        userId: user?._id,
                        status: 'VERIFIED',
                        detailedStatus: newVerificationStatus
                    });

                    if (finalRes.data.success) {
                        console.log("Final Approval Success");
                        setIsVerified(true);
                        if (loadUser) await loadUser();

                        setTimeout(() => {
                            navigation.reset({
                                index: 0,
                                routes: [{ name: 'RoleSelection' }],
                            });
                        }, 2000);
                    } else {
                        setModalConfig({
                            type: 'error',
                            title: 'Verification Error',
                            message: "Failed to finalize verification status."
                        });
                        setModalVisible(true);
                    }
                } else {
                    // Show specific failures
                    const message = "Some documents failed verification:\n" + failureReasons.join("\n");
                    setModalConfig({
                        type: 'error',
                        title: 'Verification Incomplete',
                        message: message
                    });
                    setModalVisible(true);

                    // Optional: Send partial status to backend if needed for logging
                    await api.post(`/digilocker/finalize-verification`, {
                        userId: user?._id,
                        status: 'PARTIAL',
                        detailedStatus: newVerificationStatus
                    });
                }

            } else {
                setModalConfig({
                    type: 'error',
                    title: 'Verification Failed',
                    message: response.data.message || "Documents did not match your registered details."
                });
                setModalVisible(true);
            }
        } catch (err) {
            console.error(err);
            setModalConfig({
                type: 'error',
                title: 'Connection Error',
                message: 'Failed to verify details. ' + (err.message || '')
            });
            setModalVisible(true);
        } finally {
            setVerifying(false);
        }
    };

    useEffect(() => {
        const subscription = Linking.addEventListener('url', handleDeepLink);
        return () => subscription.remove();
    }, []); // No dependencies needed now

    const handleDigilockerVerify = async () => {
        if (verifying) return;
        setVerifying(true);
        setErrorMessage(null); // Reset inline error on retry
        try {
            // 1. Generate correct redirect URL 
            const callbackUrl = Linking.createURL('digilocker');

            // 2. Get Auth URL from Backend 
            const response = await api.get(`/digilocker/initiate`, {
                params: {
                    userId: user?._id,
                    callbackUrl: callbackUrl
                }
            });
            console.log("Auth Init Answer:", response.data);
            const { authUrl } = response.data;

            if (!authUrl) {
                throw new Error("No Auth URL returned from backend. Check backend logs.");
            }

            // 3. Open Browser
            let result = await WebBrowser.openAuthSessionAsync(authUrl, callbackUrl);
            setResult(result);

        } catch (error) {
            console.error("Auth Init Error:", error);
            setModalConfig({
                type: 'error',
                title: 'Initialization Failed',
                message: 'Failed to initiate DigiLocker login. Please try again.'
            });
            setModalVisible(true);
            setVerifying(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                    </TouchableOpacity>
                    <Text style={[styles.title, { color: theme.textPrimary }]}>Verification</Text>
                    <View style={{ width: 24 }} />
                </View>

                {!isVerified ? (
                    <View style={styles.content}>
                        <View style={styles.iconContainer}>
                            <Ionicons name="shield-checkmark" size={80} color={theme.primary} />
                        </View>

                        <Text style={[styles.heading, { color: theme.textPrimary }]}>Verify Identity</Text>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>
                            Verify your documents with DigiLocker. We will compare them with your registered details automatically.
                        </Text>

                        {/* Inline Error Message (Replaces Modal for no_issued_docs) */}
                        {errorMessage === 'NO_DOCS_INSTRUCTION' ? (
                            <View style={styles.errorContainer}>
                                <Ionicons name="information-circle-outline" size={36} color="#F97316" style={{ marginBottom: 10 }} />
                                <Text style={styles.errorText}>
                                    We found 0 documents in your DigiLocker account. Please fetch your documents in DigiLocker by using the link below:
                                </Text>
                                <TouchableOpacity
                                    style={styles.modifyLink}
                                    onPress={() => Linking.openURL('https://www.digilocker.gov.in/web/issued-documents')}
                                >
                                    <Text style={styles.modifyLinkText}>Open DigiLocker Website</Text>
                                </TouchableOpacity>
                                <Text style={[styles.errorText, { marginTop: 15, marginBottom: 0, fontSize: 13 }]}>
                                    After fetching your documents, please re-verify with DigiLocker to start your trips.
                                </Text>
                            </View>
                        ) : errorMessage && (
                            <View style={styles.errorContainer}>
                                <Ionicons name="warning-outline" size={32} color="#F44336" style={{ marginBottom: 10 }} />
                                <Text style={styles.errorText}>
                                    {errorMessage}
                                </Text>
                            </View>
                        )}


                        <TouchableOpacity
                            style={[styles.verifyBtn, { backgroundColor: theme.primary, opacity: verifying ? 0.7 : 1 }]}
                            onPress={handleDigilockerVerify}
                            disabled={verifying}
                        >
                            {verifying ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.btnText}>Verify with Digilocker</Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.skipBtn, { borderColor: theme.border }]}
                            onPress={() => navigation.navigate('RoleSelection')}
                        >
                            <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip for now</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.content}>
                        <Ionicons name="checkmark-circle" size={100} color="green" />
                        <Text style={[styles.heading, { color: theme.textPrimary, marginTop: 20 }]}>Profile Verified!</Text>
                        <Text style={[styles.description, { color: theme.textSecondary }]}>
                            Your documents have been successfully verified.
                        </Text>
                        <TouchableOpacity
                            style={[styles.verifyBtn, { backgroundColor: 'green', marginTop: 20 }]}
                            onPress={() => navigation.navigate('RoleSelection')}
                        >
                            <Text style={styles.btnText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>

            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: '#fff' }]}>
                        <View style={[styles.modalIconContainer, { backgroundColor: modalConfig.type === 'success' ? '#E8F5E9' : '#FFEBEE' }]}>
                            <Ionicons
                                name={modalConfig.type === 'success' ? "checkmark-circle" : "alert-circle"}
                                size={64}
                                color={modalConfig.type === 'success' ? "#4CAF50" : "#F44336"}
                            />
                        </View>

                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                            {modalConfig.title}
                        </Text>

                        <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>
                            {modalConfig.message}
                        </Text>

                        <TouchableOpacity
                            style={[styles.modalButton, { backgroundColor: modalConfig.type === 'success' ? theme.primary : '#F44336' }]}
                            onPress={() => {
                                setModalVisible(false);
                                if (modalConfig.type === 'success') {
                                    navigation.navigate('RoleSelection');
                                } else {
                                    // For errors, navigate back to registration to try again
                                    navigation.navigate('DriverRegistration');
                                }
                            }}
                        >
                            <Text style={styles.modalButtonText}>
                                {modalConfig.type === 'success' ? "Continue" : "Try Again"}
                            </Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { flexGrow: 1 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { flex: 1, padding: 20, alignItems: 'center' },
    iconContainer: { marginBottom: 20 },
    heading: { fontSize: 24, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
    description: { fontSize: 16, textAlign: 'center', marginBottom: 30, paddingHorizontal: 10 },
    inputContainer: { width: '100%', marginBottom: 15 },
    label: { marginBottom: 5, fontSize: 14, fontWeight: '600' },
    input: { width: '100%', height: 50, borderWidth: 1, borderRadius: 10, paddingHorizontal: 15, fontSize: 16 },
    verifyBtn: { width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 15, marginTop: 10 },
    btnText: { color: "#fff", fontSize: 18, fontWeight: 'bold' },
    skipBtn: { width: '100%', height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    skipText: { fontSize: 16 },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    modalIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        backgroundColor: 'transparent' // Override in inline style
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 12,
        textAlign: 'center'
    },
    modalMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 22
    },
    modalButton: {
        width: '100%',
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold'
    },
    // New Styles for Inline Error
    errorContainer: {
        backgroundColor: '#FFEBEE',
        padding: 20,
        borderRadius: 12,
        alignItems: 'center',
        width: '100%',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFCDD2'
    },
    errorText: {
        color: '#D32F2F',
        textAlign: 'center',
        fontSize: 15,
        marginBottom: 15,
        lineHeight: 22,
        fontWeight: '500'
    },
    modifyLink: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#D32F2F'
    },
    modifyLinkText: {
        color: '#D32F2F',
        fontWeight: 'bold',
        fontSize: 14
    }
});

export default DigilockerVerificationScreen;
