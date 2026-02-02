import { useFocusEffect } from '@react-navigation/native';
import React, { useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Modal, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const UserDocumentsScreen = ({ navigation }) => {
    const { user, loadUser } = useContext(AuthContext);
    const { theme } = useTheme();
    const [selectedImage, setSelectedImage] = useState(null);

    useFocusEffect(
        useCallback(() => {
            if (loadUser) loadUser();
        }, [])
    );

    const isVerifiedGlobal = user?.isApproved;
    const verificationStatus = user?.verificationStatus || {};

    const getStatus = (key) => {
        if (isVerifiedGlobal) return true;
        return verificationStatus[key] === true;
    };

    // Prepare data with proper Front/Back keys
    const documents = [
        {
            key: 'license',
            statusKey: 'dl',
            label: 'Driving License',
            number: user?.licenseNumber,
            front: user?.documentImages?.licenseFront,
            back: user?.documentImages?.licenseBack
        },
        {
            key: 'pan',
            statusKey: 'pan',
            label: 'PAN Card',
            number: user?.panNumber,
            front: user?.documentImages?.panFront,
            back: user?.documentImages?.panBack
        },
        {
            key: 'aadhar',
            statusKey: 'aadhar',
            label: 'Aadhaar Card',
            number: user?.aadharNumber,
            front: user?.documentImages?.aadharFront,
            back: user?.documentImages?.aadharBack
        }
    ];

    const hasPartialVerification = !isVerifiedGlobal && Object.values(verificationStatus).some(v => v === true);

    const renderImageBox = (uri, labelPart) => (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => uri && setSelectedImage(uri)}
            style={[styles.imageBox, { borderColor: theme.border, backgroundColor: theme.card }]}
        >
            {uri ? (
                <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
            ) : (
                <View style={styles.placeholder}>
                    <Ionicons name="image-outline" size={24} color={theme.textSecondary} />
                    <Text style={[styles.placeholderText, { color: theme.textSecondary }]}>No Image</Text>
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.textPrimary }]}>My Documents</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* Overall Status Banner */}
                <View style={[styles.statusBanner, {
                    backgroundColor: isVerifiedGlobal ? '#E8F5E9' : (hasPartialVerification ? '#FFF3E0' : '#FFEBEE')
                }]}>
                    <Ionicons
                        name={isVerifiedGlobal ? "checkmark-circle" : "alert-circle"}
                        size={24}
                        color={isVerifiedGlobal ? "green" : (hasPartialVerification ? "#FF9800" : "#F44336")}
                    />
                    <Text style={[styles.statusText, {
                        color: isVerifiedGlobal ? "green" : (hasPartialVerification ? "#FF9800" : "#F44336")
                    }]}>
                        {isVerifiedGlobal ? "Documents Verified" : (hasPartialVerification ? "Partial Verification" : "Verification Pending")}
                    </Text>
                </View>

                {/* Documents List */}
                <View style={styles.listContainer}>
                    {documents.map((doc) => {
                        const isDocVerified = getStatus(doc.statusKey);
                        return (
                            <View key={doc.key} style={[styles.docSection, { borderBottomColor: theme.border }]}>
                                {/* Title Row */}
                                <View style={styles.rowBetween}>
                                    <View>
                                        <Text style={[styles.docLabel, { color: theme.textSecondary }]}>{doc.label}</Text>
                                        <Text style={[styles.docNumber, { color: theme.textPrimary }]}>
                                            {doc.number || "N/A"}
                                        </Text>
                                    </View>
                                    <View style={[styles.badge, { backgroundColor: isDocVerified ? '#E8F5E9' : '#FFEBEE' }]}>
                                        <Text style={[styles.badgeText, { color: isDocVerified ? 'green' : '#F44336' }]}>
                                            {isDocVerified ? "Verified" : "Not Verified"}
                                        </Text>
                                    </View>
                                </View>

                                {/* Images Row: Front & Back side-by-side */}
                                <View style={styles.imageRow}>
                                    <View style={styles.imageCol}>
                                        <Text style={[styles.subLabel, { color: theme.textSecondary }]}>Front</Text>
                                        {renderImageBox(doc.front, 'Front')}
                                    </View>
                                    <View style={{ width: 15 }} />
                                    <View style={styles.imageCol}>
                                        <Text style={[styles.subLabel, { color: theme.textSecondary }]}>Back</Text>
                                        {renderImageBox(doc.back, 'Back')}
                                    </View>
                                </View>
                            </View>
                        );
                    })}
                </View>

            </ScrollView>

            {/* Sticky Footer Action Section */}
            {!isVerifiedGlobal && (
                <View style={[styles.footerContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
                    <Text style={[styles.instructionText, { color: theme.textSecondary }]}>
                        If your documents are incorrect or missing, you can modify them here.
                    </Text>
                    <TouchableOpacity
                        style={[styles.verifyButton, { backgroundColor: theme.primary }]}
                        onPress={() => navigation.navigate('DriverRegistration')}
                    >
                        <Text style={styles.verifyButtonText}>Modify / Re-Upload Documents</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Image Modal */}
            <Modal
                visible={!!selectedImage}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setSelectedImage(null)}
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity
                        style={styles.modalOverlayClickable}
                        activeOpacity={1}
                        onPress={() => setSelectedImage(null)}
                    >
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setSelectedImage(null)}
                        >
                            <Ionicons name="close-circle" size={40} color="#fff" />
                        </TouchableOpacity>

                        {selectedImage && (
                            <Image
                                source={{ uri: selectedImage }}
                                style={styles.fullImage}
                                resizeMode="contain"
                            />
                        )}
                    </TouchableOpacity>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        justifyContent: 'space-between',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    content: {
        padding: 16,
        paddingBottom: 40
    },
    statusBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 30,
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    listContainer: {
        marginBottom: 20
    },
    docSection: {
        marginBottom: 30,
        borderBottomWidth: 1,
        paddingBottom: 25,
        borderBottomStyle: 'dotted'
    },
    rowBetween: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 15
    },
    docLabel: {
        fontSize: 13,
        marginBottom: 4,
        fontWeight: '600',
    },
    docNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5
    },

    // Matched Image Styles
    imageRow: { flexDirection: 'row', justifyContent: 'space-between' },
    imageCol: { flex: 1 },
    subLabel: { marginBottom: 8, fontSize: 13 },
    imageBox: {
        height: 120,
        borderRadius: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden'
    },
    previewImage: { width: '100%', height: '100%' },
    placeholder: { alignItems: 'center' },
    placeholderText: { fontSize: 12, marginTop: 5 },

    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 6,
    },
    badgeText: {
        fontSize: 12,
        fontWeight: 'bold'
    },
    actionContainer: {
        marginTop: 10,
        alignItems: 'center'
    },
    instructionText: {
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 20,
        paddingHorizontal: 20,
        fontSize: 13
    },
    verifyButton: {
        width: '100%',
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold'
    },
    // Modal Styles
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalOverlayClickable: {
        flex: 1,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    footerContainer: {
        padding: 16,
        borderTopWidth: 1,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: -2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
    }
});

export default UserDocumentsScreen;
