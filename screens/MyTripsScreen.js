import React, { useState, useCallback, useContext, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Modal, ActivityIndicator, Image, Animated, Dimensions, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { getMyTrips, deleteTrip, getTripBookings, updateBookingStatus } from '../services/api';

const { height } = Dimensions.get('window');
const FILTER_PANEL_HEIGHT = 400;

const MyTripsScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);

    const [loading, setLoading] = useState(true);
    const [trips, setTrips] = useState([]);
    const [activeTab, setActiveTab] = useState('Upcoming');

    // Filter State
    const [activeFilter, setActiveFilter] = useState('All');
    const [filterVisible, setFilterVisible] = useState(false);
    const slideAnim = useRef(new Animated.Value(-FILTER_PANEL_HEIGHT)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // Booking Management State
    const [requestsModalVisible, setRequestsModalVisible] = useState(false);
    const [selectedTripId, setSelectedTripId] = useState(null);
    const [bookings, setBookings] = useState([]);
    const [loadingBookings, setLoadingBookings] = useState(false);

    // Trip Details Modal State
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedTrip, setSelectedTrip] = useState(null);

    const fetchTrips = async () => {
        try {
            setLoading(true);
            const data = await getMyTrips(user._id);
            setTrips(data.trips || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (user) fetchTrips();
        }, [user])
    );

    // Reset filter when tab changes
    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setActiveFilter('All');
        closeFilter();
    };

    const toggleFilter = () => {
        if (filterVisible) {
            closeFilter();
        } else {
            openFilter();
        }
    };

    const openFilter = () => {
        setFilterVisible(true);
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 600,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0.8,
                duration: 600,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const closeFilter = () => {
        Animated.parallel([
            Animated.timing(slideAnim, {
                toValue: -FILTER_PANEL_HEIGHT,
                duration: 400,
                useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 400,
                useNativeDriver: true,
            }),
        ]).start(() => setFilterVisible(false));
    };

    const filteredTrips = trips.filter(trip => {
        const isPast = new Date(trip.tripDate) < new Date();
        const isHistory = ['completed', 'cancelled'].includes(trip.status) || isPast;

        // First tab filter
        if (activeTab === 'Upcoming' && isHistory) return false;
        if (activeTab === 'History' && !isHistory) return false;

        // Then Filter Logic
        if (activeFilter === 'All') return true;

        // Status Filters
        const effectiveStatus = (isHistory && trip.status === 'scheduled') ? 'completed' : trip.status;
        if (activeFilter === 'Completed') return effectiveStatus === 'completed';
        if (activeFilter === 'Cancelled') return effectiveStatus === 'cancelled';

        // Trip Type Filters
        if (activeFilter === 'Round Trip') return trip.tripType === 'roundtrip';
        if (activeFilter === 'Outstation') return trip.tripType === 'outstation' || !trip.tripType;
        if (activeFilter === 'In-City') return trip.tripType === 'incity';

        return true;
    });

    const openRequests = async (tripId) => {
        setSelectedTripId(tripId);
        setRequestsModalVisible(true);
        loadBookings(tripId);
    };

    const formatDate = (value) => {
        if (!value) return "N/A";
        const date = new Date(value);
        if (isNaN(date.getTime())) return "N/A";
        // Format: Oct 24 • 10:30 AM
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
            " • " +
            date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const loadBookings = async (tripId) => {
        try {
            setLoadingBookings(true);
            const data = await getTripBookings(tripId);
            setBookings(data.bookings || []);
        } catch (error) {
            Alert.alert("Error", "Failed to load requests");
        } finally {
            setLoadingBookings(false);
        }
    };

    const handleBookingAction = async (bookingId, status) => {
        try {
            await updateBookingStatus(bookingId, status);
            Alert.alert("Success", `Request ${status}`);
            loadBookings(selectedTripId);
            fetchTrips();
        } catch (error) {
            Alert.alert("Error", error.message || "Action failed");
        }
    };

    const handleCancelTrip = (tripId) => {
        Alert.alert("Cancel Journey", "Are you sure? This will cancel all bookings.", [
            { text: "No", style: "cancel" },
            {
                text: "Yes, Cancel",
                style: "destructive",
                onPress: async () => {
                    try {
                        await deleteTrip(tripId);
                        fetchTrips();
                    } catch (error) {
                        Alert.alert("Error", "Failed to cancel trip");
                    }
                }
            }
        ]);
    };

    const renderBookingItem = ({ item }) => (
        <View style={[styles.bookingItem, { borderBottomColor: theme.border }]}>
            <Image source={{ uri: item.passenger?.profileImage || "https://via.placeholder.com/40" }} style={styles.avatarSmall} />
            <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={{ color: theme.textPrimary, fontWeight: 'bold' }}>{item.passenger?.name}</Text>
                <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{formatDate(item.createdAt)}</Text>
            </View>

            {item.status === 'pending' ? (
                <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity onPress={() => handleBookingAction(item._id, 'rejected')}>
                        <Ionicons name="close-circle" size={32} color={theme.danger} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleBookingAction(item._id, 'approved')}>
                        <Ionicons name="checkmark-circle" size={32} color={theme.success} />
                    </TouchableOpacity>
                </View>
            ) : (
                <Text style={{
                    color: item.status === 'approved' ? theme.success : theme.danger,
                    fontWeight: 'bold', fontSize: 12
                }}>
                    {item.status.toUpperCase()}
                </Text>
            )}
        </View>
    );

    const renderTripItem = ({ item }) => {
        const isPast = new Date(item.tripDate) < new Date();
        const isHistory = ['completed', 'cancelled'].includes(item.status) || isPast;

        const effectiveStatus = (isHistory && item.status === 'scheduled') ? 'completed' : item.status;
        const statusColor = effectiveStatus === 'cancelled' ? theme.danger : (effectiveStatus === 'completed' ? theme.success : theme.success);
        const statusIcon = effectiveStatus === 'completed' ? "checkmark-circle" : (effectiveStatus === 'cancelled' ? "close-circle" : "time");

        return (
            <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                        <View style={[styles.cardHeader, { justifyContent: 'space-between', marginBottom: 10 }]}>
                            <View style={{ gap: 5 }}>
                                {/* Trip Type Tag */}
                                <View style={{
                                    alignSelf: 'flex-start',
                                    paddingHorizontal: 8,
                                    paddingVertical: 4,
                                    borderRadius: 6,
                                    backgroundColor: item.tripType === 'incity' ? '#e3f2fd' : (item.tripType === 'roundtrip' ? '#f3e5f5' : '#e8f5e9')
                                }}>
                                    <Text style={{
                                        color: item.tripType === 'incity' ? '#1976d2' : (item.tripType === 'roundtrip' ? '#7b1fa2' : '#2e7d32'),
                                        fontSize: 10,
                                        fontWeight: 'bold',
                                        textTransform: 'uppercase'
                                    }}>
                                        {item.tripType === 'incity' ? 'In-City' : (item.tripType === 'roundtrip' ? 'Round Trip' : 'Outstation')}
                                    </Text>
                                </View>
                                {/* Status */}
                                {isHistory && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Ionicons name={statusIcon} size={14} color={statusColor} />
                                        <Text style={{ color: statusColor, fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
                                            {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>

                        {/* Route */}
                        <View style={{ marginVertical: 8 }}>
                            <Text style={[styles.routeText, { color: theme.textPrimary }]}>
                                {item.fromLocation} {item.toLocation && <Ionicons name="arrow-forward" size={14} color={theme.textSecondary} />} {item.toLocation}
                            </Text>
                        </View>

                        {/* Date & Duration Info */}
                        <View style={{ gap: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.dateText, { color: theme.textSecondary }]}> {formatDate(item.tripDate)}</Text>
                            </View>

                            {/* Additional Info based on Type */}
                            {item.tripType === 'incity' && item.bookingDuration && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="time-outline" size={14} color={theme.textSecondary} />
                                    <Text style={[styles.metaText, { color: theme.textSecondary }]}> Duration: {item.bookingDuration} hrs</Text>
                                </View>
                            )}

                            {item.tripType === 'roundtrip' && item.returnDate && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="repeat-outline" size={14} color={theme.textSecondary} />
                                    <Text style={[styles.metaText, { color: theme.textSecondary }]}>
                                        {Math.ceil((new Date(item.returnDate) - new Date(item.tripDate)) / (1000 * 60 * 60 * 24))} Days
                                    </Text>
                                </View>
                            )}
                        </View>
                    </View>

                    {/* Map/Vehicle Image */}
                    <Image
                        source={{ uri: item.vehicle?.vehicleImage || item.mapImage || "https://via.placeholder.com/100x100.png?text=No+Img" }}
                        style={[styles.mapThumbnail, { backgroundColor: theme.secondary }]}
                    />
                </View>

                {/* Footer Actions */}
                <View style={{ marginTop: 15 }}>
                    {!isHistory && item.status === 'scheduled' && (
                        <View style={styles.actionRow}>
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert("Modify Trip", "Do you want to modify this trip?", [
                                        { text: "No", style: "cancel" },
                                        { text: "Yes", onPress: () => navigation.navigate("PostTrip", { tripData: item }) }
                                    ]);
                                }}
                                style={[styles.miniIconBtn, { backgroundColor: theme.primary + '15' }]}
                            >
                                <Ionicons name="create-outline" size={20} color={theme.primary} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert("View Requests", "Do you want to view booking requests for this trip?", [
                                        { text: "No", style: "cancel" },
                                        { text: "Yes", onPress: () => openRequests(item._id) }
                                    ]);
                                }}
                                style={[styles.miniIconBtn, { backgroundColor: theme.accent + '15' }]}
                            >
                                <Ionicons name="chatbubbles-outline" size={20} color={theme.accent} />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => handleCancelTrip(item._id)}
                                style={[styles.miniIconBtn, { backgroundColor: theme.danger + '15' }]}
                            >
                                <Ionicons name="trash-outline" size={20} color={theme.danger} />
                            </TouchableOpacity>
                        </View>
                    )}

                    {isHistory && (
                        <TouchableOpacity
                            onPress={() => {
                                setSelectedTrip(item);
                                setDetailsModalVisible(true);
                            }}
                            style={[styles.detailsBtn, { backgroundColor: theme.secondary }]}
                        >
                            <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 14 }}>View Trip Summary</Text>
                        </TouchableOpacity>
                    )}
                </View>

            </View>
        );
    };

    // Filter Options
    const tripTypeFilters = ['All', 'Round Trip', 'Outstation', 'In-City'];
    const statusFilters = ['Completed', 'Cancelled'];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { zIndex: 20 }]}>
                <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>My Trips</Text>
                <TouchableOpacity onPress={toggleFilter} style={{ padding: 8 }}>
                    <Ionicons name="filter" size={24} color={theme.textPrimary} />
                    {activeFilter !== 'All' && <View style={styles.filterDot} />}
                </TouchableOpacity>
            </View>

            {/* Filter Panel (Top-Down) */}
            {filterVisible && (
                <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
                    {/* Backdrop */}
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeFilter}>
                        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} />
                    </TouchableOpacity>

                    {/* Animated Panel */}
                    <Animated.View style={[
                        styles.filterPanel,
                        {
                            backgroundColor: theme.background,
                            transform: [{ translateY: slideAnim }]
                        }
                    ]}>
                        <View style={styles.filterHeader}>
                            <Text style={[styles.filterTitle, { color: theme.textPrimary }]}>Filter Trips</Text>
                            <TouchableOpacity onPress={closeFilter}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={{ maxHeight: 300 }}>
                            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>TRIP TYPE</Text>
                            <View style={styles.filterOptionsContainer}>
                                {tripTypeFilters.map(filter => (
                                    <TouchableOpacity
                                        key={filter}
                                        style={[
                                            styles.filterOption,
                                            {
                                                backgroundColor: activeFilter === filter ? theme.primary : theme.card,
                                                borderColor: activeFilter === filter ? theme.primary : theme.border
                                            }
                                        ]}
                                        onPress={() => setActiveFilter(filter)}
                                    >
                                        <Text style={{
                                            color: activeFilter === filter ? '#fff' : theme.textPrimary,
                                            fontWeight: activeFilter === filter ? 'bold' : 'normal'
                                        }}>
                                            {filter}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {activeTab === 'History' && (
                                <>
                                    <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 20 }]}>STATUS</Text>
                                    <View style={styles.filterOptionsContainer}>
                                        {statusFilters.map(filter => (
                                            <TouchableOpacity
                                                key={filter}
                                                style={[
                                                    styles.filterOption,
                                                    {
                                                        backgroundColor: activeFilter === filter ? theme.primary : theme.card,
                                                        borderColor: activeFilter === filter ? theme.primary : theme.border
                                                    }
                                                ]}
                                                onPress={() => setActiveFilter(filter)}
                                            >
                                                <Text style={{
                                                    color: activeFilter === filter ? '#fff' : theme.textPrimary,
                                                    fontWeight: activeFilter === filter ? 'bold' : 'normal'
                                                }}>
                                                    {filter}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </>
                            )}
                        </ScrollView>

                        <View style={[styles.filterFooter, { borderTopColor: theme.border }]}>
                            <TouchableOpacity
                                onPress={() => {
                                    setActiveFilter('All');
                                }}
                                style={{ padding: 10 }}
                            >
                                <Text style={{ color: theme.textSecondary, fontWeight: 'bold' }}>Reset</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={closeFilter}
                                style={[styles.applyBtn, { backgroundColor: theme.primary }]}
                            >
                                <Text style={{ color: '#fff', fontWeight: 'bold' }}>Apply Filter</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </View>
            )}

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <View style={[styles.tabSegment, { backgroundColor: theme.card }]}>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'Upcoming' && { backgroundColor: theme.secondary }]}
                        onPress={() => handleTabChange('Upcoming')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'Upcoming' ? theme.textPrimary : theme.textSecondary }]}>Upcoming</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tabButton, activeTab === 'History' && { backgroundColor: theme.secondary }]}
                        onPress={() => handleTabChange('History')}
                    >
                        <Text style={[styles.tabText, { color: activeTab === 'History' ? theme.textPrimary : theme.textSecondary }]}>History</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Note: Removed the horizontal Filter Chips list from here as requested */}

            {loading ? (
                <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>
            ) : (
                <FlatList
                    data={filteredTrips}
                    keyExtractor={item => item._id}
                    renderItem={renderTripItem}
                    contentContainerStyle={styles.list}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="map-outline" size={48} color={theme.textSecondary} style={{ opacity: 0.5 }} />
                            <Text style={{ color: theme.textSecondary, marginTop: 10 }}>No {activeTab.toLowerCase()} trips found.</Text>
                            {activeFilter !== 'All' && <Text style={{ color: theme.primary, marginTop: 5 }}>Try clearing filters</Text>}
                        </View>
                    }
                />
            )}

            {/* Requests Modal - Keep existing functionality */}
            <Modal visible={requestsModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Trip Requests</Text>
                        <TouchableOpacity onPress={() => setRequestsModalVisible(false)}>
                            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    {loadingBookings ? (
                        <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
                    ) : (
                        <FlatList
                            data={bookings}
                            keyExtractor={item => item._id}
                            renderItem={renderBookingItem}
                            contentContainerStyle={{ padding: 20 }}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', color: theme.textSecondary, marginTop: 20 }}>No requests yet.</Text>}
                        />
                    )}
                </View>
            </Modal>

            {/* Trip Details Modal */}
            <Modal visible={detailsModalVisible} animationType="slide" presentationStyle="pageSheet">
                <View style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Trip Details</Text>
                        <TouchableOpacity onPress={() => setDetailsModalVisible(false)}>
                            <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Done</Text>
                        </TouchableOpacity>
                    </View>

                    {selectedTrip && (() => {
                        const isPast = new Date(selectedTrip.tripDate) < new Date();
                        const isTripHistory = ['completed', 'cancelled'].includes(selectedTrip.status) || isPast;
                        const effectiveStatus = (isTripHistory && selectedTrip.status === 'scheduled') ? 'completed' : selectedTrip.status;
                        const statusColor = effectiveStatus === 'cancelled' ? theme.danger : (effectiveStatus === 'completed' ? theme.success : theme.success);
                        const statusIcon = effectiveStatus === 'completed' ? "checkmark-circle" : (effectiveStatus === 'cancelled' ? "close-circle" : "time");

                        return (
                            <View style={{ padding: 20 }}>
                                <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 15 }}>
                                        <Ionicons
                                            name={statusIcon}
                                            size={20}
                                            color={statusColor}
                                        />
                                        <Text style={{
                                            color: statusColor,
                                            fontSize: 16,
                                            fontWeight: 'bold',
                                            marginLeft: 8
                                        }}>
                                            {effectiveStatus.charAt(0).toUpperCase() + effectiveStatus.slice(1)}
                                        </Text>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Ionicons name="location-outline" size={20} color={theme.primary} />
                                        <View style={{ marginLeft: 15 }}>
                                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>From</Text>
                                            <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '600' }}>{selectedTrip.fromLocation}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Ionicons name="navigate-outline" size={20} color={theme.primary} />
                                        <View style={{ marginLeft: 15 }}>
                                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>To</Text>
                                            <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '600' }}>{selectedTrip.toLocation}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Ionicons name="calendar-outline" size={20} color={theme.primary} />
                                        <View style={{ marginLeft: 15 }}>
                                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Date & Time</Text>
                                            <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '600' }}>{formatDate(selectedTrip.tripDate)}</Text>
                                        </View>
                                    </View>

                                    <View style={styles.detailRow}>
                                        <Ionicons name="car-sport-outline" size={20} color={theme.primary} />
                                        <View style={{ marginLeft: 15, flex: 1 }}>
                                            <Text style={{ color: theme.textSecondary, fontSize: 12 }}>Vehicle</Text>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <View>
                                                    <Text style={{ color: theme.textPrimary, fontSize: 16, fontWeight: '600' }}>
                                                        {selectedTrip.vehicle ? `${selectedTrip.vehicle.make} ${selectedTrip.vehicle.model}` : "Standard Vehicle"}
                                                    </Text>
                                                    <Text style={{ color: theme.textSecondary, fontSize: 13 }}>
                                                        {selectedTrip.vehicle?.type || "Compact"} • {selectedTrip.vehicle?.color || "Any"}
                                                    </Text>
                                                </View>
                                                <Image
                                                    source={{ uri: selectedTrip.vehicle?.vehicleImage || "https://via.placeholder.com/100" }}
                                                    style={{ width: 100, height: 60, borderRadius: 8 }}
                                                />
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        );
                    })()}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { paddingHorizontal: 20, paddingVertical: 15, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 28, fontWeight: 'bold' },
    filterDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ff4444', position: 'absolute', top: 8, right: 6 },

    tabContainer: { paddingHorizontal: 20, marginBottom: 15 },
    tabSegment: { flexDirection: 'row', borderRadius: 12, padding: 4 },
    tabButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
    tabText: { fontWeight: '600', fontSize: 14 },

    list: { paddingHorizontal: 20 },
    card: { borderRadius: 16, padding: 18, marginBottom: 15 },

    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },

    routeText: { fontSize: 17, fontWeight: 'bold', lineHeight: 24 },
    dateText: { fontSize: 13, marginLeft: 6 },
    metaText: { fontSize: 12, marginLeft: 4 },

    mapThumbnail: { width: 90, height: 90, borderRadius: 12 },

    detailsBtn: { marginTop: 0, paddingVertical: 10, borderRadius: 8, alignItems: 'center' },

    actionRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12 },
    miniIconBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },

    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    emptyContainer: { alignItems: 'center', marginTop: 50 },

    // Modal Styles
    modalContainer: { flex: 1 },
    modalHeader: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },
    bookingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15, borderBottomWidth: 1 },
    avatarSmall: { width: 40, height: 40, borderRadius: 20 },
    detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },

    // Top-Down Filter Panel Styles
    overlay: { backgroundColor: 'rgba(0,0,0,0.5)', width: '100%', height: '100%' },
    filterPanel: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
        paddingTop: 50,
        paddingHorizontal: 20,
        paddingBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10
    },
    filterTitle: { fontSize: 22, fontWeight: 'bold' },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15 },
    filterOptionsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    filterOption: {
        width: '48%',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
    },
    applyBtn: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
    }
});

export default MyTripsScreen;
