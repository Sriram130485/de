import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Switch, ScrollView, Alert, Image, Platform, Modal, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { getMyVehicles, createTrip, updateTrip } from '../services/api';

const PostTripScreen = ({ navigation, route }) => {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);

    // Edit Mode Params
    const tripToEdit = route.params?.tripData;
    const isEditMode = !!tripToEdit;

    const [loading, setLoading] = useState(false);
    const [vehicles, setVehicles] = useState([]);
    const [showVehicleModal, setShowVehicleModal] = useState(false);

    // Form State
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [fromLocation, setFromLocation] = useState(tripToEdit?.fromLocation || '');
    const [toLocation, setToLocation] = useState(tripToEdit?.toLocation || '');

    // Date/Time State
    const [date, setDate] = useState(tripToEdit ? new Date(tripToEdit.tripDate) : new Date());
    const [time, setTime] = useState(tripToEdit ? new Date(`2000-01-01T${tripToEdit.tripTime}:00`) : new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    // Trip Type
    const [tripType, setTripType] = useState(tripToEdit?.tripType || 'outstation'); // outstation, incity, roundtrip

    // In-City State
    const [bookingDuration, setBookingDuration] = useState(tripToEdit?.bookingDuration || 2);
    const [driverGearType, setDriverGearType] = useState(tripToEdit?.driverGearType || 'manual');

    // Round Trip State
    const [returnDate, setReturnDate] = useState(tripToEdit?.returnDate ? new Date(tripToEdit.returnDate) : new Date());
    const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);

    // Toggles
    const [isPassengerTrip, setIsPassengerTrip] = useState(tripToEdit?.isPassengerTrip || false);
    const [isDriverRequired, setIsDriverRequired] = useState(tripToEdit?.isDriverRequired || false);
    const [isCoDriverRequired, setIsCoDriverRequired] = useState(tripToEdit?.isCoDriverRequired || false);

    // Values
    const [pricePerSeat, setPricePerSeat] = useState(tripToEdit?.pricePerSeat ? tripToEdit.pricePerSeat.toString() : '');
    const [totalSeats, setTotalSeats] = useState(tripToEdit?.totalSeats ? tripToEdit.totalSeats.toString() : '4');
    const [driverAmount, setDriverAmount] = useState(tripToEdit?.driverPaymentAmount ? tripToEdit.driverPaymentAmount.toString() : '');

    // Estimation for In-City
    const hourlyRate = 18.50;
    const estimatedTotal = (bookingDuration * hourlyRate).toFixed(2);

    useEffect(() => {
        loadVehicles();
    }, []);

    // Set defaults when switching types
    useEffect(() => {
        if (tripType === 'incity') {
            setIsDriverRequired(true);
            setIsCoDriverRequired(false);
            setIsPassengerTrip(false);
            setDriverAmount(estimatedTotal);
        } else if (tripType === 'outstation' || tripType === 'roundtrip') {
            // Reset to defaults or keep user selection
            if (!isEditMode) {
                setIsDriverRequired(false);
                setIsCoDriverRequired(false);
            }
        }
    }, [tripType, bookingDuration]);

    const loadVehicles = async () => {
        try {
            const data = await getMyVehicles(user._id);

            if (data.vehicles && data.vehicles.length > 0) {
                setVehicles(data.vehicles);
                if (tripToEdit && tripToEdit.vehicle) {
                    const vehicleId = tripToEdit.vehicle._id || tripToEdit.vehicle;
                    const found = data.vehicles.find(v => v._id === vehicleId);
                    setSelectedVehicle(found || data.vehicles[0]);
                } else {
                    if (!selectedVehicle) setSelectedVehicle(data.vehicles[0]);
                }
            }
        } catch (error) {
            console.error("Failed to load vehicles", error);
            Alert.alert("Error", "Could not load your vehicles.");
        }
    };

    const onChangeDate = (event, selectedDate) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setDate(selectedDate);
            if (Platform.OS === 'android') setShowDatePicker(false);
        } else {
            if (Platform.OS === 'android') setShowDatePicker(false);
        }
    };

    const onChangeReturnDate = (event, selectedDate) => {
        setShowReturnDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setReturnDate(selectedDate);
            if (Platform.OS === 'android') setShowReturnDatePicker(false);
        } else {
            if (Platform.OS === 'android') setShowReturnDatePicker(false);
        }
    };

    const onChangeTime = (event, selectedTime) => {
        setShowTimePicker(Platform.OS === 'ios');
        if (selectedTime) {
            setTime(selectedTime);
            if (Platform.OS === 'android') setShowTimePicker(false);
        } else {
            if (Platform.OS === 'android') setShowTimePicker(false);
        }
    };

    const formatTime = (dateObj) => {
        let hours = dateObj.getHours();
        let minutes = dateObj.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        return `${hours}:${minutes} ${ampm}`;
    };

    const normalizeDate = (d) => {
        const newDate = new Date(d);
        newDate.setHours(0, 0, 0, 0);
        return newDate;
    };

    const handleSubmit = async () => {
        if (!selectedVehicle) return Alert.alert("Error", "Please select a vehicle.");
        if (!fromLocation || !toLocation) return Alert.alert("Error", "Please enter route details.");

        // Basic Validations
        if (isDriverRequired && !driverAmount) return Alert.alert("Required", "Please enter driver payment amount.");

        // Trip Type Validations
        if (tripType === 'roundtrip') {
            if (normalizeDate(returnDate) < normalizeDate(date)) {
                return Alert.alert("Invalid Date", "Return date cannot be before departure date.");
            }
        }

        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const tripDateStr = `${year}-${month}-${day}`;

        // Format time to HH:MM (24h) for backend consistency or as needed
        const hours = time.getHours().toString().padStart(2, '0');
        const mins = time.getMinutes().toString().padStart(2, '0');
        const tripTimeStr = `${hours}:${mins}`;

        // Date Validation
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const checkDate = normalizeDate(date);

        if (checkDate < today) {
            return Alert.alert("Invalid Date", "Trip date cannot be in the past.");
        }

        // Time Validation for Today
        if (checkDate.getTime() === today.getTime()) {
            const now = new Date();
            const selectedTime = new Date(time);

            // Create a Combined Date object for accurate comparison
            const combinedTripDate = new Date();
            combinedTripDate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

            if (combinedTripDate < now) {
                return Alert.alert("Invalid Time", "Trip time for today cannot be in the past.");
            }
        }

        // 4-Hour Warning Logic
        const tripFullDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0, 0);
        const now = new Date();
        const diffMs = tripFullDate - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        const processSubmission = async () => {
            setLoading(true);
            try {
                const payload = {
                    userId: user._id,
                    vehicleId: selectedVehicle._id,
                    fromLocation,
                    toLocation,
                    tripDate: tripDateStr,
                    tripTime: tripTimeStr,
                    isDriverRequired,
                    driverPaymentAmount: isDriverRequired ? parseFloat(driverAmount) : undefined,
                    isCoDriverRequired
                };

                if (isEditMode) {
                    await updateTrip(tripToEdit._id, payload);
                    Alert.alert("Success", "Trip Updated!", [{ text: "OK", onPress: () => navigation.goBack() }]);
                } else {
                    await createTrip(payload);
                    Alert.alert("Success", "Trip Published!", [{ text: "OK", onPress: () => navigation.goBack() }]);
                }

            } catch (error) {
                Alert.alert("Error", error.message || "Failed to save trip.");
            } finally {
                setLoading(false);
            }
        };

        if (diffHours < 4) {
            Alert.alert(
                "Non-Refundable Warning",
                "If you cancel this trip (scheduled within 4 hours), your money will not be refunded.",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "OK", onPress: processSubmission }
                ]
            );
        } else {
            processSubmission();
        }
    };

    // Helper for visual connection line
    const RouteConnector = () => (
        <View style={{ alignItems: 'center', marginRight: 15, paddingTop: 23 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', borderColor: theme.border, borderWidth: 1 }}>
                <Ionicons name="compass-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ width: 2, height: 40, backgroundColor: theme.border, marginVertical: 4, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.textSecondary }} />
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', borderColor: theme.border, borderWidth: 1 }}>
                <Ionicons name="location-outline" size={20} color="#ff4444" />
            </View>
        </View>
    );

    // Trip Type Selector Component
    const TripTypeSelector = () => (
        <View style={{ flexDirection: 'row', backgroundColor: theme.card, padding: 5, borderRadius: 12, marginBottom: 20, borderColor: theme.border, borderWidth: 1 }}>
            {['incity', 'outstation', 'roundtrip'].map((type) => (
                <TouchableOpacity
                    key={type}
                    style={{
                        flex: 1,
                        paddingVertical: 10,
                        backgroundColor: tripType === type ? theme.primary : 'transparent',
                        borderRadius: 8,
                        alignItems: 'center'
                    }}
                    onPress={() => setTripType(type)}
                >
                    <Text style={{
                        color: tripType === type ? '#fff' : theme.textSecondary,
                        fontWeight: 'bold',
                        fontSize: 13,
                        textTransform: 'capitalize'
                    }}>
                        {type === 'incity' ? 'In-City' : type === 'roundtrip' ? 'Round Trip' : 'Outstation'}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.textPrimary }]}>{isEditMode ? "Edit Trip" : "Define Trip"}</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <TripTypeSelector />

                {/* 1. Vehicle Card */}
                {selectedVehicle ? (
                    <TouchableOpacity
                        style={[styles.vehicleCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
                        onPress={() => {
                            if (vehicles.length > 1) setShowVehicleModal(true);
                            else Alert.alert("Garage", "You only have one vehicle registered.");
                        }}
                    >
                        <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                                <View style={[styles.badge, { backgroundColor: '#19875420', marginBottom: 0 }]}>
                                    <Text style={{ color: '#198754', fontWeight: 'bold', fontSize: 10 }}>READY</Text>
                                </View>
                                {vehicles.length > 1 && (
                                    <View style={{ backgroundColor: theme.primary + '20', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                        <Text style={{ color: theme.primary, fontSize: 10, fontWeight: 'bold' }}>CHANGE</Text>
                                    </View>
                                )}
                            </View>

                            <Text style={[styles.vehicleName, { color: theme.textPrimary }]}>{selectedVehicle.make} {selectedVehicle.model}</Text>
                            <Text style={{ color: theme.textSecondary }}>{selectedVehicle.plate}</Text>
                        </View>
                        <Image
                            source={{ uri: selectedVehicle.vehicleImage || "https://via.placeholder.com/150" }}
                            style={styles.vehicleImage}
                        />
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={[styles.vehicleCard, { backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: theme.textSecondary }]}
                        onPress={() => navigation.navigate("Garage")}
                    >
                        <Text style={{ color: theme.textSecondary }}>+ Select Vehicle (Go to Garage)</Text>
                    </TouchableOpacity>
                )}

                {tripType === 'incity' ? (
                    // ============ IN-CITY SPECIFIC UI ============
                    <View>
                        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>How long do you need a driver?</Text>
                        <Text style={{ color: theme.textSecondary, marginBottom: 15, fontSize: 13 }}>Book a professional driver by the hour.</Text>

                        <View style={{ backgroundColor: theme.card, padding: 20, borderRadius: 16, marginBottom: 25, borderColor: theme.border, borderWidth: 1 }}>
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                <View>
                                    <Text style={{ color: theme.textSecondary, fontSize: 12, marginBottom: 5, letterSpacing: 1 }}>SELECTED DURATION</Text>
                                    <Text style={{ color: theme.primary, fontSize: 32, fontWeight: 'bold' }}>{bookingDuration} <Text style={{ fontSize: 16, color: theme.textPrimary, fontWeight: 'normal' }}>hours</Text></Text>
                                </View>
                                <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primary + '20', justifyContent: 'center', alignItems: 'center' }}>
                                    <Ionicons name="time" size={24} color={theme.primary} />
                                </View>
                            </View>

                            {/* Use a Slider if available, strictly using RN views for now to simulate slider or just simple buttons until slider package confirmed */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                {[2, 4, 6, 8, 12, 24].map((hr) => (
                                    <TouchableOpacity
                                        key={hr}
                                        style={{ padding: 8, backgroundColor: bookingDuration === hr ? theme.primary : theme.background, borderRadius: 8 }}
                                        onPress={() => setBookingDuration(hr)}
                                    >
                                        <Text style={{ color: bookingDuration === hr ? '#fff' : theme.textPrimary, fontWeight: 'bold' }}>{hr}h</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style={{ color: theme.textSecondary, fontSize: 11, textAlign: 'center', marginTop: 10 }}>Minimum booking is 2 hours. Overtime rates apply after 24 hours.</Text>
                        </View>

                        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Driver Requirements</Text>
                        <View style={{ flexDirection: 'row', gap: 15, marginBottom: 25 }}>
                            <TouchableOpacity
                                style={[styles.staffCard, { backgroundColor: theme.card, borderColor: driverGearType === 'manual' ? theme.primary : theme.border, borderWidth: driverGearType === 'manual' ? 2 : 1 }]}
                                onPress={() => setDriverGearType('manual')}
                            >
                                <View style={{ alignItems: 'center', padding: 10 }}>
                                    <Ionicons name="git-network-outline" size={32} color={driverGearType === 'manual' ? theme.primary : theme.textSecondary} style={{ marginBottom: 10 }} />
                                    <Text style={{ fontWeight: 'bold', color: theme.textPrimary, marginBottom: 4 }}>Manual</Text>
                                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>Stick shift</Text>
                                </View>
                                {driverGearType === 'manual' && <View style={{ position: 'absolute', top: 10, right: 10 }}><Ionicons name="checkmark-circle" size={20} color={theme.primary} /></View>}
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.staffCard, { backgroundColor: theme.card, borderColor: driverGearType === 'automatic' ? theme.primary : theme.border, borderWidth: driverGearType === 'automatic' ? 2 : 1 }]}
                                onPress={() => setDriverGearType('automatic')}
                            >
                                <View style={{ alignItems: 'center', padding: 10 }}>
                                    <Ionicons name="car-sport-outline" size={32} color={driverGearType === 'automatic' ? theme.primary : theme.textSecondary} style={{ marginBottom: 10 }} />
                                    <Text style={{ fontWeight: 'bold', color: theme.textPrimary, marginBottom: 4 }}>Automatic</Text>
                                    <Text style={{ fontSize: 11, color: theme.textSecondary }}>Easy drive</Text>
                                </View>
                                {driverGearType === 'automatic' && <View style={{ position: 'absolute', top: 10, right: 10 }}><Ionicons name="checkmark-circle" size={20} color={theme.primary} /></View>}
                            </TouchableOpacity>
                        </View>

                        {/* Route Details for In-City (Still need Start/End) */}
                        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Location Details</Text>
                        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                            <RouteConnector />
                            <View style={{ flex: 1, gap: 15 }}>
                                <View>
                                    <Text style={{ color: theme.textSecondary, marginBottom: 5, fontSize: 12 }}>Pickup Location</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border, borderWidth: 1 }]}
                                        placeholder="Enter pickup location"
                                        placeholderTextColor={theme.textSecondary}
                                        value={fromLocation}
                                        onChangeText={setFromLocation}
                                    />
                                </View>
                                <View>
                                    <Text style={{ color: theme.textSecondary, marginBottom: 5, fontSize: 12 }}>Drop Location (Optional)</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border, borderWidth: 1 }]}
                                        placeholder="Any specific destination?"
                                        placeholderTextColor={theme.textSecondary}
                                        value={toLocation}
                                        onChangeText={setToLocation}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* Start Date/Time */}
                        <Text style={{ color: theme.textSecondary, marginBottom: 5, fontSize: 12 }}>Start Time</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 25 }}>
                            <TouchableOpacity
                                style={[styles.input, { flex: 1, backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} style={{ marginRight: 2 }} />
                                <Text style={{ color: theme.textPrimary }}>{date.toISOString().split('T')[0]}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.input, { flex: 1, backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Ionicons name="time-outline" size={20} color={theme.textSecondary} style={{ marginRight: 10 }} />
                                <Text style={{ color: theme.textPrimary }}>{formatTime(time)}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* Estimation Footer like UI */}
                        <View style={{ backgroundColor: theme.card, padding: 15, borderRadius: 12, borderTopWidth: 1, borderTopColor: theme.border, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <View>
                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>EST. HOURLY RATE <Ionicons name="information-circle" size={12} /></Text>
                                <Text style={{ color: theme.textPrimary, fontSize: 20, fontWeight: 'bold' }}>${hourlyRate}<Text style={{ fontSize: 12, fontWeight: 'normal' }}>/hr</Text></Text>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={{ color: theme.textSecondary, fontSize: 10, fontWeight: 'bold', marginBottom: 2 }}>TOTAL ESTIMATE</Text>
                                <Text style={{ color: theme.primary, fontSize: 24, fontWeight: 'bold' }}>${estimatedTotal}</Text>
                            </View>
                        </View>

                    </View>
                ) : (
                    <View>
                        {/* ============ OUTSTATION & ROUNDTRIP UI ============ */}

                        {/* 2. Route Details */}
                        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Route Details</Text>
                        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                            <RouteConnector />
                            <View style={{ flex: 1, gap: 15 }}>
                                <View>
                                    <Text style={{ color: theme.textSecondary, marginBottom: 5, fontSize: 12 }}>Pickup Location</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border, borderWidth: 1 }]}
                                        placeholder="e.g. Hyderabad"
                                        placeholderTextColor={theme.textSecondary}
                                        value={fromLocation}
                                        onChangeText={setFromLocation}
                                    />
                                </View>
                                <View>
                                    <Text style={{ color: theme.textSecondary, marginBottom: 5, fontSize: 12 }}>Destination</Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: theme.card, color: theme.textPrimary, borderColor: theme.border, borderWidth: 1 }]}
                                        placeholder="Where are you going?"
                                        placeholderTextColor={theme.textSecondary}
                                        value={toLocation}
                                        onChangeText={setToLocation}
                                    />
                                </View>
                            </View>
                        </View>

                        {/* 3. Departure */}
                        <Text style={{ color: theme.textSecondary, marginBottom: 5, fontSize: 12 }}>Departure</Text>
                        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 25 }}>
                            <TouchableOpacity
                                style={[styles.input, { flex: 1, backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} style={{ marginRight: 2 }} />
                                <Text style={{ color: theme.textPrimary }}>{date.toISOString().split('T')[0]}</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.input, { flex: 1, backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}
                                onPress={() => setShowTimePicker(true)}
                            >
                                <Ionicons name="time-outline" size={20} color={theme.textSecondary} style={{ marginRight: 10 }} />
                                <Text style={{ color: theme.textPrimary }}>{formatTime(time)}</Text>
                            </TouchableOpacity>
                        </View>

                        {/* ROUND TRIP RETURN DATE */}
                        {tripType === 'roundtrip' && (
                            <View style={{ marginBottom: 25 }}>
                                <Text style={{ color: theme.textSecondary, marginBottom: 5, fontSize: 12 }}>Return Date</Text>
                                <TouchableOpacity
                                    style={[styles.input, { flex: 1, backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1, flexDirection: 'row', alignItems: 'center' }]}
                                    onPress={() => setShowReturnDatePicker(true)}
                                >
                                    <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} style={{ marginRight: 2 }} />
                                    <Text style={{ color: theme.textPrimary }}>{returnDate.toISOString().split('T')[0]}</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {/* 4. Staffing Needs */}
                        <Text style={[styles.sectionHeader, { color: theme.textPrimary }]}>Staffing Needs</Text>
                        <View style={{ flexDirection: 'row', gap: 15, marginBottom: 25 }}>
                            {/* Need Driver Card */}
                            <TouchableOpacity
                                style={[styles.staffCard, { backgroundColor: theme.card, borderColor: isDriverRequired ? theme.primary : theme.border, borderWidth: 1 }]}
                                onPress={() => {
                                    setIsDriverRequired(!isDriverRequired);
                                    if (!isDriverRequired) setIsCoDriverRequired(false);
                                }}
                            >
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                    <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                                        <Ionicons name="car" size={20} color={theme.primary} />
                                    </View>
                                    <Ionicons
                                        name={isDriverRequired ? "radio-button-on" : "radio-button-off"}
                                        size={24}
                                        color={isDriverRequired ? theme.primary : theme.border}
                                    />
                                </View>
                                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Need Driver</Text>
                                <Text style={{ color: theme.textSecondary, fontSize: 11 }}>Request a pro</Text>
                                {isDriverRequired && (
                                    <TextInput
                                        style={[styles.miniInput, { color: theme.textPrimary, borderBottomColor: theme.border }]}
                                        placeholder="Payment ($)"
                                        placeholderTextColor={theme.textSecondary}
                                        keyboardType="numeric"
                                        value={driverAmount}
                                        onChangeText={setDriverAmount}
                                    />
                                )}
                            </TouchableOpacity>

                            {/* Need Co-driver Card (Outstation only) */}
                            {tripType === 'outstation' && (
                                <TouchableOpacity
                                    style={[styles.staffCard, { backgroundColor: theme.card, borderColor: isCoDriverRequired ? theme.primary : theme.border, borderWidth: 1 }]}
                                    onPress={() => {
                                        setIsCoDriverRequired(!isCoDriverRequired);
                                        if (!isCoDriverRequired) setIsDriverRequired(false);
                                    }}
                                >
                                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
                                        <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                                            <Ionicons name="people" size={20} color="#ff9800" />
                                        </View>
                                        <Ionicons
                                            name={isCoDriverRequired ? "radio-button-on" : "radio-button-off"}
                                            size={24}
                                            color={isCoDriverRequired ? theme.primary : theme.border}
                                        />
                                    </View>
                                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Need Co-driver</Text>
                                    <Text style={{ color: theme.textSecondary, fontSize: 11 }}>For long trips</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}


                {showDatePicker && (
                    <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onChangeDate}
                        minimumDate={new Date()}
                    />
                )}

                {showReturnDatePicker && (
                    <DateTimePicker
                        value={returnDate}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onChangeReturnDate}
                        minimumDate={date} // Return date can't be before departure
                    />
                )}

                {showTimePicker && (
                    <DateTimePicker
                        value={time}
                        mode="time"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={onChangeTime}
                    />
                )}




                {/* Submit Button */}
                <TouchableOpacity
                    style={[styles.submitBtn, { backgroundColor: theme.primary, opacity: loading ? 0.7 : 1 }]}
                    onPress={handleSubmit}
                    disabled={loading}
                >
                    <Text style={styles.submitText}>{loading ? (isEditMode ? "Updating..." : "Publishing...") : (isEditMode ? "Update Trip" : "Find Crew & Publish")}</Text>
                </TouchableOpacity>

            </ScrollView>

            {/* Vehicle Selection Modal */}
            <Modal
                visible={showVehicleModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowVehicleModal(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Select Vehicle</Text>
                            <TouchableOpacity onPress={() => setShowVehicleModal(false)}>
                                <Ionicons name="close" size={24} color={theme.textPrimary} />
                            </TouchableOpacity>
                        </View>
                        <FlatList
                            data={vehicles}
                            keyExtractor={item => item._id}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={[
                                        styles.vehicleOption,
                                        {
                                            borderColor: item._id === selectedVehicle?._id ? theme.primary : theme.border,
                                            backgroundColor: item._id === selectedVehicle?._id ? theme.primary + '10' : 'transparent'
                                        }
                                    ]}
                                    onPress={() => {
                                        setSelectedVehicle(item);
                                        setShowVehicleModal(false);
                                    }}
                                >
                                    <Image
                                        source={{ uri: item.vehicleImage || "https://via.placeholder.com/150" }}
                                        style={styles.optionImage}
                                    />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.optionName, { color: theme.textPrimary }]}>{item.make} {item.model}</Text>
                                        <Text style={{ color: theme.textSecondary, fontSize: 12 }}>{item.plate}</Text>
                                    </View>
                                    {item._id === selectedVehicle?._id && (
                                        <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                                    )}
                                </TouchableOpacity>
                            )}
                        />
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    title: { fontSize: 20, fontWeight: 'bold' },
    content: { padding: 20, paddingBottom: 50 },
    sectionHeader: { fontSize: 16, fontWeight: 'bold', marginBottom: 15 },

    vehicleCard: { borderRadius: 16, padding: 15, flexDirection: 'row', alignItems: 'center', marginBottom: 25, height: 100 },
    badge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginBottom: 5 },
    vehicleName: { fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
    vehicleImage: { width: 100, height: 60, borderRadius: 8, resizeMode: 'cover' },

    input: { height: 50, borderRadius: 12, paddingHorizontal: 15, fontSize: 16, justifyContent: 'center' },

    staffCard: { flex: 1, padding: 15, borderRadius: 16 },
    iconBox: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    cardTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 2 },
    miniInput: { marginTop: 10, borderBottomWidth: 1, paddingVertical: 2, fontSize: 14 },

    seatsCard: { padding: 15, borderRadius: 16, marginBottom: 25 },

    submitBtn: { height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 5 },
    submitText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },

    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '60%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: 'bold' },
    vehicleOption: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
    optionImage: { width: 50, height: 35, borderRadius: 6, marginRight: 15, resizeMode: 'cover' },
    optionName: { fontSize: 16, fontWeight: '600' }
});

export default PostTripScreen;
