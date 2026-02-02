import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { getMyVehicles, deleteVehicle } from '../services/api'; // Ensure deleteVehicle is exported in api.js
import VehicleRegistrationForm from '../components/VehicleRegistrationForm';

const GarageScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [vehicles, setVehicles] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingVehicle, setEditingVehicle] = useState(null);
    const [drafts, setDrafts] = useState([]);

    const loadVehicles = async () => {
        setLoading(true);
        try {
            const data = await getMyVehicles(user._id);
            setVehicles(data.vehicles || []);
        } catch (error) {
            Alert.alert("Error", "Failed to load vehicles");
        } finally {
            setLoading(false);
        }
    };

    const loadDrafts = async () => {
        try {
            const savedDrafts = await AsyncStorage.getItem('@vehicle_drafts');
            if (savedDrafts) {
                setDrafts(JSON.parse(savedDrafts));
            } else {
                setDrafts([]);
            }
        } catch (e) {
            console.error("Failed to load drafts", e);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadVehicles();
            loadDrafts();
        }, [])
    );

    const handleDiscardDraft = (draftId) => {
        Alert.alert("Discard Draft", "Are you sure you want to discard this draft?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Discard",
                style: "destructive",
                onPress: async () => {
                    try {
                        const existingDraftsJson = await AsyncStorage.getItem('@vehicle_drafts');
                        if (existingDraftsJson) {
                            let updatedDrafts = JSON.parse(existingDraftsJson);
                            updatedDrafts = updatedDrafts.filter(d => d.id !== draftId);
                            await AsyncStorage.setItem('@vehicle_drafts', JSON.stringify(updatedDrafts));
                            setDrafts(updatedDrafts);
                        }
                    } catch (e) {
                        console.error("Failed to discard draft", e);
                    }
                }
            }
        ]);
    };

    const handleResumeDraft = (draft) => {
        const preparedDraft = {
            id: draft.id,
            make: draft.vehicleData.carName,
            model: draft.vehicleData.carModel,
            plate: draft.vehicleData.licensePlate,
            year: draft.vehicleData.year,
            vehicleImage: draft.vehicleImage,
            documents: {
                rc: draft.rcDoc,
                pollution: draft.pollutionDoc,
                rcName: draft.rcName,
                pollutionName: draft.pollutionName
            }
        };
        setEditingVehicle(preparedDraft);
        setModalVisible(true);
    };

    const handleDelete = (vehicleId) => {
        Alert.alert("Remove Vehicle", "Are you sure? This will also delete any active trips associated with this vehicle and cannot be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteVehicle(vehicleId);
                        loadVehicles(); // Refresh
                    } catch (error) {
                        Alert.alert("Error", "Failed to delete vehicle");
                    }
                }
            }
        ]);
    };

    const handleEdit = (vehicle) => {
        setEditingVehicle(vehicle);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setEditingVehicle(null);
        loadDrafts(); // Check if a draft was saved or updated
    };

    const renderVehicleItem = ({ item }) => (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                    {/* Header: Vehicle Make & Model */}
                    <View style={styles.cardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="car-sport" size={16} color={theme.primary} />
                            <Text style={[styles.makeModel, { color: theme.textPrimary, marginLeft: 8 }]}>
                                {item.make} {item.model}
                            </Text>
                        </View>
                    </View>

                    {/* Vehicle Details */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailItem}>
                            <Ionicons name="card-outline" size={14} color={theme.textSecondary} />
                            <Text style={[styles.detailText, { color: theme.textSecondary }]}>{item.plate}</Text>
                        </View>
                        <View style={styles.detailItem}>
                            <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                            <Text style={[styles.detailText, { color: theme.textSecondary }]}>{item.year}</Text>
                        </View>
                    </View>
                </View>

                {/* Vehicle Image */}
                <Image
                    source={{ uri: item.vehicleImage || "https://via.placeholder.com/100" }}
                    style={[styles.vehicleThumbnail, { backgroundColor: theme.secondary }]}
                />
            </View>

            {/* Footer Actions */}
            <View style={styles.cardFooter}>
                <TouchableOpacity
                    onPress={() => handleEdit(item)}
                    style={[styles.actionBtn, { backgroundColor: theme.primary + '15' }]}
                >
                    <Ionicons name="create-outline" size={18} color={theme.primary} />
                    <Text style={[styles.actionBtnText, { color: theme.primary }]}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleDelete(item._id)}
                    style={[styles.actionBtn, { backgroundColor: theme.danger + '15' }]}
                >
                    <Ionicons name="trash-outline" size={18} color={theme.danger} />
                    <Text style={[styles.actionBtnText, { color: theme.danger }]}>Remove</Text>
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
                <Text style={[styles.title, { color: theme.textPrimary }]}>My Garage</Text>
                <TouchableOpacity onPress={() => { setEditingVehicle(null); setModalVisible(true); }}>
                    <Ionicons name="add-circle" size={30} color={theme.primary} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={vehicles}
                keyExtractor={item => item._id}
                renderItem={renderVehicleItem}
                contentContainerStyle={styles.list}
                ListHeaderComponent={
                    drafts.length > 0 ? (
                        <View style={{ marginBottom: 10 }}>
                            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Drafts ({drafts.length})</Text>
                            {drafts.map((draft) => (
                                <View key={draft.id} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.primary + '40', borderWidth: 1, borderStyle: 'dashed' }]}>
                                    <View style={styles.cardHeader}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={[styles.draftBadge, { backgroundColor: theme.primary }]}>
                                                <Text style={styles.draftBadgeText}>DRAFT</Text>
                                            </View>
                                            <Text style={[styles.makeModel, { color: theme.textPrimary }]}>
                                                {draft.vehicleData.carName ? `${draft.vehicleData.carName} ${draft.vehicleData.carModel}` : "Untitled Vehicle"}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.detailsContainer}>
                                        <Text style={[styles.draftSubtitle, { color: theme.textSecondary }]}>You have an unfinished vehicle registration. Would you like to continue?</Text>
                                    </View>
                                    <View style={styles.cardFooter}>
                                        <TouchableOpacity
                                            onPress={() => handleResumeDraft(draft)}
                                            style={[styles.actionBtn, { backgroundColor: theme.primary + '15' }]}
                                        >
                                            <Ionicons name="play-outline" size={18} color={theme.primary} />
                                            <Text style={[styles.actionBtnText, { color: theme.primary }]}>Resume</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => handleDiscardDraft(draft.id)}
                                            style={[styles.actionBtn, { backgroundColor: theme.danger + '15' }]}
                                        >
                                            <Ionicons name="trash-outline" size={18} color={theme.danger} />
                                            <Text style={[styles.actionBtnText, { color: theme.danger }]}>Discard</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))}
                            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 15 }]} />
                            <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginBottom: 10 }]}>Registered Vehicles</Text>
                        </View>
                    ) : null
                }
                ListEmptyComponent={drafts.length === 0 && <Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 50 }}>No vehicles in your garage.</Text>}
            />

            {/* Add Vehicle Modal */}
            <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={{ flex: 1, backgroundColor: theme.background }}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.title, { color: theme.textPrimary }]}>{editingVehicle ? "Edit Vehicle" : "Add Vehicle"}</Text>
                        <TouchableOpacity onPress={handleCloseModal}>
                            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                        <VehicleRegistrationForm
                            onSuccess={() => { handleCloseModal(); loadVehicles(); }}
                            initialValues={editingVehicle}
                            isEditMode={!!(editingVehicle && editingVehicle._id)}
                        />
                    </ScrollView>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
    divider: { height: 1, width: '100%' },
    list: { paddingHorizontal: 20, paddingBottom: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    card: { borderRadius: 16, padding: 18, marginBottom: 15 },
    cardHeader: { marginBottom: 10 },
    makeModel: { fontWeight: 'bold', fontSize: 18 },

    detailsContainer: { gap: 6 },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailText: { fontSize: 13, marginLeft: 8 },

    vehicleThumbnail: { width: 100, height: 80, borderRadius: 12 },

    cardFooter: {
        flexDirection: 'row',
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 0.5,
        borderTopColor: '#ccc3',
        gap: 12
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    actionBtnText: { fontWeight: 'bold', fontSize: 14 },

    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

    draftBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        marginRight: 8
    },
    draftBadgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: 'bold'
    },
    draftSubtitle: {
        fontSize: 12,
        marginTop: 4
    }
});

export default GarageScreen;
