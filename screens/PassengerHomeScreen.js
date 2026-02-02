import React, { useState, useCallback, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, Dimensions, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { getTrips, createBooking } from '../services/api';

const { width } = Dimensions.get('window');

const PassengerHomeScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    const [selectedTrip, setSelectedTrip] = useState(null);

    const fetchTrips = async () => {
        try {
            setLoading(true);

            const res = await getTrips({
                type: "passenger",
                // userId: user._id
            });
            setTrips(res.trips || []);
        } catch (error) {
            console.error("Failed to fetch trips", error);
        } finally {
            setLoading(false);
        }
    };


    useFocusEffect(
        useCallback(() => {
            fetchTrips();
        }, [])
    );

    const formatDate = (value) => {
        if (!value) return "N/A";
        const date = new Date(value);
        return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
    };

    const handleRequestJoin = async () => {
        if (!selectedTrip) return;
        try {
            await createBooking({
                tripId: selectedTrip._id,
                userId: user._id,
                seatsRequested: 1,
                totalPrice: selectedTrip.pricePerSeat
            });
            Alert.alert("Success", "Request Sent! The driver will review it shortly.");
            setSelectedTrip(null);
        } catch (error) {
            Alert.alert("Request Failed", error.message || "Could not send request.");
        }
    };

    const renderTripItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
            onPress={() => setSelectedTrip(item)}
        >
            <View style={styles.cardHeader}>
                <Image
                    source={{ uri: item.owner?.profileImage || "https://via.placeholder.com/50" }}
                    style={styles.avatar}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={[styles.name, { color: theme.textPrimary }]}>{item.owner?.name || "Driver"}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="star" size={12} color={theme.primary} />
                        <Text style={{ color: theme.textSecondary, fontSize: 12, marginLeft: 4 }}>4.8 • 120 rides</Text>
                    </View>
                </View>
                <Text style={[styles.price, { color: theme.primary }]}>₹{item.pricePerSeat}</Text>
            </View>

            <View style={styles.routeRow}>
                <View style={styles.timeline}>
                    <View style={[styles.dot, { borderColor: theme.textSecondary }]} />
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                    <View style={[styles.dot, { borderColor: theme.primary, backgroundColor: theme.primary }]} />
                </View>
                <View style={{ flex: 1, marginLeft: 10, height: 60, justifyContent: 'space-between' }}>
                    <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>{item.fromLocation}</Text>
                    <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>{item.toLocation}</Text>
                </View>
            </View>

            <View style={[styles.metaRow, { backgroundColor: theme.secondary }]}>
                <Text style={{ color: theme.primary }}>{item.tripTime}</Text>
                <Text style={{ color: theme.textSecondary }}>{new Date(item.tripDate).toDateString()}</Text>
                <Text style={{ color: theme.textSecondary }}>•</Text>
                <Text style={{ color: theme.textSecondary }}>{item.availableSeats} seats left</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Find a Ride</Text>
                <TouchableOpacity onPress={fetchTrips}>
                    <Ionicons name="refresh" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <FlatList
                    data={trips}
                    keyExtractor={item => item._id}
                    renderItem={renderTripItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="map-outline" size={60} color={theme.textSecondary} />
                            <Text style={{ color: theme.textSecondary, marginTop: 10 }}>No rides available right now.</Text>
                        </View>
                    }
                />
            )}

            {/* Trip Detail Modal */}
            <Modal visible={!!selectedTrip} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        {selectedTrip && (
                            <>
                                <View style={styles.modalHeader}>
                                    <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Trip Details</Text>
                                    <TouchableOpacity onPress={() => setSelectedTrip(null)}>
                                        <Ionicons name="close" size={24} color={theme.textPrimary} />
                                    </TouchableOpacity>
                                </View>

                                <ScrollView contentContainerStyle={{ padding: 20 }}>
                                    {/* Route */}
                                    <View style={[styles.detailSection, { backgroundColor: theme.card }]}>
                                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>ROUTE</Text>
                                        <Text style={[styles.detailValue, { color: theme.textPrimary }]}>{selectedTrip.fromLocation} ➝ {selectedTrip.toLocation}</Text>
                                        <Text style={{ color: theme.textSecondary, marginTop: 5 }}>{formatDate(selectedTrip.tripDate)}</Text>
                                        <Text style={{ color: theme.textSecondary, marginTop: 5 }}>{selectedTrip.tripTime}</Text>
                                    </View>
                                    {/* Vehicle */}
                                    <View style={[styles.detailSection, { backgroundColor: theme.card }]}>
                                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>VEHICLE</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                            <Image source={{ uri: selectedTrip.vehicle?.vehicleImage }} style={{ width: 60, height: 60, borderRadius: 8 }} />
                                            <View style={{ marginLeft: 15 }}>
                                                <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 16 }}>{selectedTrip.vehicle?.make} {selectedTrip.vehicle?.model}</Text>
                                                <Text style={{ color: theme.textSecondary }}>{selectedTrip.vehicle?.plate}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Owner */}
                                    <View style={[styles.detailSection, { backgroundColor: theme.card }]}>
                                        <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>DRIVER</Text>
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                                            <Image source={{ uri: selectedTrip.owner?.profileImage || "https://via.placeholder.com/50" }} style={{ width: 50, height: 50, borderRadius: 25 }} />
                                            <View style={{ marginLeft: 15 }}>
                                                <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>{selectedTrip.owner?.name}</Text>
                                                <Text style={{ color: theme.textSecondary }}>Verified Owner</Text>
                                            </View>
                                        </View>
                                    </View>
                                </ScrollView>

                                <View style={[styles.footer, { borderTopColor: theme.border }]}>
                                    <View>
                                        <Text style={{ color: theme.textSecondary }}>Total Price</Text>
                                        <Text style={{ color: theme.primary, fontSize: 24, fontWeight: 'bold' }}>₹{selectedTrip.pricePerSeat}</Text>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.bookBtn, { backgroundColor: theme.primary }]}
                                        onPress={handleRequestJoin}
                                    >
                                        <Text style={{ color: '#fff', fontWeight: 'bold' }}>Request to Join</Text>
                                    </TouchableOpacity>
                                </View>
                            </>
                        )}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold' },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 12,
    },
    list: { padding: 20 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    card: { borderRadius: 16, marginBottom: 20, overflow: 'hidden' },
    cardHeader: { flexDirection: 'row', padding: 15, alignItems: 'center' },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    name: { fontWeight: 'bold', fontSize: 16 },
    price: { fontSize: 18, fontWeight: 'bold' },

    routeRow: { flexDirection: 'row', paddingHorizontal: 15, paddingBottom: 15, alignItems: 'center' },
    timeline: { alignItems: 'center', marginRight: 15, height: 60, width: 20, justifyContent: 'center' },
    dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
    line: { width: 2, flex: 1, marginVertical: 2 },

    metaRow: { padding: 10, flexDirection: 'row', justifyContent: 'center', gap: 10 },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { height: '85%', borderTopLeftRadius: 25, borderTopRightRadius: 25 },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },

    detailSection: { padding: 15, borderRadius: 12, marginBottom: 15 },
    detailLabel: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
    detailValue: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },

    footer: { padding: 20, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    bookBtn: { paddingHorizontal: 30, paddingVertical: 15, borderRadius: 15 }
});

export default PassengerHomeScreen;
