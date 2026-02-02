import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { createTripRequest, deleteTripRequest } from '../services/api';

const TripDetailsScreen = ({ route, navigation }) => {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);
    const { trip, existingRequest, viewContext } = route.params;

    const [currentRequest, setCurrentRequest] = useState(existingRequest || null);
    const [requestSent, setRequestSent] = useState(!!existingRequest);
    const [requesting, setRequesting] = useState(false);

    const handleSendRequest = async () => {
        try {
            setRequesting(true);
            const response = await createTripRequest({
                driverId: user._id,
                tripId: trip._id,
                ownerId: trip.owner._id || trip.owner
            });
            setCurrentRequest(response.request); // Assuming backend returns { message, request }
            setRequestSent(true);
            Alert.alert("Success", "Request sent successfully!");
        } catch (error) {
            const errorMessage = error.message || (typeof error === 'string' ? error : "Failed to send request.");
            Alert.alert("Error", errorMessage);
        } finally {
            setRequesting(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!currentRequest?._id) return;

        try {
            setRequesting(true);
            await deleteTripRequest(currentRequest._id);
            setRequestSent(false);
            setCurrentRequest(null);
            Alert.alert("Success", "Request cancelled.");
        } catch (error) {
            const errorMessage = error.message || "Failed to cancel request.";
            Alert.alert("Error", errorMessage);
        } finally {
            setRequesting(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Trip Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                {/* 1. Owner Info */}
                <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>OWNER</Text>
                    <View style={styles.profileRow}>
                        <Image
                            source={{ uri: trip.owner?.profileImage || "https://via.placeholder.com/60" }}
                            style={styles.avatar}
                        />
                        <View style={{ marginLeft: 15 }}>
                            <Text style={[styles.name, { color: theme.textPrimary }]}>{trip.owner?.name || "Owner Name"}</Text>
                            <View style={styles.ratingRow}>
                                <Ionicons name="star" size={16} color="#ffc107" />
                                <Text style={{ color: theme.textSecondary, marginLeft: 5 }}>4.9 (Verified)</Text>
                            </View>
                        </View>
                    </View>
                </View>

                {/* 2. Vehicle Info */}
                <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>VEHICLE</Text>
                    <View style={styles.vehicleRow}>
                        {/* Placeholder for vehicle image if available in model */}
                        <View style={[styles.vehicleIcon, { backgroundColor: theme.primary + '20' }]}>
                            <Ionicons name="car-sport" size={32} color={theme.primary} />
                        </View>
                        <View style={{ marginLeft: 15 }}>
                            <Text style={[styles.vehicleName, { color: theme.textPrimary }]}>
                                {trip.vehicle?.make} {trip.vehicle?.model}
                            </Text>
                            <Text style={{ color: theme.textSecondary }}>{trip.vehicle?.plate}</Text>
                        </View>
                    </View>
                </View>

                {/* 3. Route Info */}
                <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                    <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>ROUTE & TIMING</Text>

                    <View style={styles.timelineItem}>
                        <View style={[styles.dot, { backgroundColor: theme.success }]} />
                        <Text style={[styles.location, { color: theme.textPrimary }]}>{trip.fromLocation}</Text>
                    </View>
                    <View style={[styles.line, { backgroundColor: theme.border }]} />
                    <View style={styles.timelineItem}>
                        <View style={[styles.dot, { backgroundColor: theme.danger }]} />
                        <Text style={[styles.location, { color: theme.textPrimary }]}>{trip.toLocation}</Text>
                    </View>

                    <View style={styles.metaRow}>
                        <View style={styles.metaItem}>
                            <Ionicons name="calendar" size={18} color={theme.textSecondary} />
                            <Text style={{ color: theme.textPrimary, marginLeft: 8, fontWeight: 'bold' }}>
                                {new Date(trip.tripDate).toDateString()}
                            </Text>
                        </View>
                        <View style={styles.metaItem}>
                            <Ionicons name="time" size={18} color={theme.textSecondary} />
                            <Text style={{ color: theme.textPrimary, marginLeft: 8, fontWeight: 'bold' }}>
                                {trip.tripTime}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* 4. Payment Info */}
                {viewContext !== 'co-driver' && (
                    <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PAYMENT</Text>
                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.success }}>
                            ₹{trip.driverPaymentAmount || "N/A"}
                        </Text>
                        <Text style={{ color: theme.textSecondary }}>Total payout for this trip</Text>
                    </View>
                )}

            </ScrollView>

            {/* Bottom Action Button */}
            <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
                {requestSent && currentRequest?.status === 'pending' ? (
                    <TouchableOpacity
                        style={[styles.requestBtn, { backgroundColor: theme.danger, opacity: requesting ? 0.7 : 1 }]}
                        onPress={handleCancelRequest}
                        disabled={requesting}
                    >
                        {requesting ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Cancel Request</Text>}
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[
                            styles.requestBtn,
                            { backgroundColor: requestSent ? theme.success : theme.primary, opacity: requesting ? 0.7 : 1 }
                        ]}
                        onPress={handleSendRequest}
                        disabled={requesting || (requestSent && currentRequest?.status !== 'pending')}
                    >
                        {requesting ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
                                {requestSent ?
                                    (currentRequest?.status ? `Request ${currentRequest.status.toUpperCase()} ✅` : "Request Sent ✅")
                                    : "Send Request to Owner"}
                            </Text>
                        )}
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
    headerTitle: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 16, paddingBottom: 100 },

    section: { padding: 16, borderRadius: 12, marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 12, letterSpacing: 1 },

    profileRow: { flexDirection: 'row', alignItems: 'center' },
    avatar: { width: 60, height: 60, borderRadius: 30 },
    name: { fontSize: 18, fontWeight: 'bold' },
    ratingRow: { flexDirection: 'row', marginTop: 4, alignItems: 'center' },

    vehicleRow: { flexDirection: 'row', alignItems: 'center' },
    vehicleIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    vehicleName: { fontSize: 16, fontWeight: 'bold' },

    timelineItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
    dot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    line: { width: 2, height: 20, marginLeft: 5, marginVertical: 2 },
    location: { fontSize: 16, fontWeight: '500' },

    metaRow: { flexDirection: 'row', marginTop: 16, justifyContent: 'space-between' },
    metaItem: { flexDirection: 'row', alignItems: 'center' },

    footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
    requestBtn: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});

export default TripDetailsScreen;
