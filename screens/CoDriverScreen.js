import React, { useCallback, useState, useContext, useEffect } from "react";
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    RefreshControl,
    TextInput,
    Modal,
    ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getTrips, createTripRequest, getDriverRequests, getDriverStatus } from "../services/api";
import { fetchPlaceSuggestions, fetchPlaceDetails } from "../services/googleMapsService";
import * as Location from 'expo-location';
import { AuthContext } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

export default function CoDriverScreen({ navigation }) {
    const { user } = useContext(AuthContext);
    const { theme, themeName } = useTheme();

    // Container State
    const [statusLoading, setStatusLoading] = useState(true);
    const [driverStatus, setDriverStatus] = useState({
        isRegistered: false,
        approvalStatus: 'pending' // 'pending' | 'approved' | 'rejected'
    });

    // Dashboard State
    // const [activeTab, setActiveTab] = useState('jobs'); // REMOVED TABS
    const [requestsMap, setRequestsMap] = useState({}); // Map tripId -> request object
    const [trips, setTrips] = useState([]);


    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [requesting, setRequesting] = useState({});

    // Filter State
    const [filterFrom, setFilterFrom] = useState('');
    const [filterTo, setFilterTo] = useState('');
    const [selectedDate, setSelectedDate] = useState('today'); // 'today', 'tomorrow', or Date object
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Advanced Filter State
    const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
    const [activeFilterCategory, setActiveFilterCategory] = useState('sort'); // 'sort' | 'time'

    // Effective filters
    const [appliedSort, setAppliedSort] = useState('relevance');
    const [appliedTimeSlots, setAppliedTimeSlots] = useState([]); // ['morning', 'afternoon', etc]

    // Temporary filters (inside modal)
    const [tempSort, setTempSort] = useState('relevance');
    const [tempTimeSlots, setTempTimeSlots] = useState([]);

    const [isLocating, setIsLocating] = useState(false);

    // Google Places Autocomplete State
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [showFromSuggestions, setShowFromSuggestions] = useState(false);
    const [showToSuggestions, setShowToSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);

    // Debounce Logic
    const debounceTimer = React.useRef(null);

    const handleLocationSearch = (text, type) => {
        if (type === 'from') setFilterFrom(text);
        if (type === 'to') setFilterTo(text);

        if (debounceTimer.current) clearTimeout(debounceTimer.current);

        // Require at least 4 characters to search
        if (text.length < 4) {
            if (type === 'from') { setFromSuggestions([]); setShowFromSuggestions(false); }
            if (type === 'to') { setToSuggestions([]); setShowToSuggestions(false); }
            return;
        }

        setSuggestionsLoading(true);
        debounceTimer.current = setTimeout(async () => {
            try {
                const results = await fetchPlaceSuggestions(text);
                if (type === 'from') {
                    setFromSuggestions(results);
                    setShowFromSuggestions(true);
                    setShowToSuggestions(false); // Close other
                } else {
                    setToSuggestions(results);
                    setShowToSuggestions(true);
                    setShowFromSuggestions(false); // Close other
                }
            } catch (error) {
                console.error("Autosuggest Error:", error);
            } finally {
                setSuggestionsLoading(false);
            }
        }, 400);
    };

    const handleSelectLocation = async (item, type) => {
        const prediction = item.placePrediction;
        const mainText = prediction.text.text;
        const placeId = prediction.placeId;

        // Optimistically set text
        if (type === 'from') {
            setFilterFrom(mainText);
            setShowFromSuggestions(false);
        } else {
            setFilterTo(mainText);
            setShowToSuggestions(false);
        }

        // Fetch details (optional if you want lat/lng stored)
        try {
            const details = await fetchPlaceDetails(placeId);
            if (details) {
                const cityName = details.city || details.address;
                if (type === 'from') setFilterFrom(cityName);
                if (type === 'to') setFilterTo(cityName);
            }
        } catch (error) {
            console.error("Details fetch error", error);
        }
    };

    const renderLocationSuggestion = ({ item }, type) => {
        const prediction = item.placePrediction;
        const primaryText = prediction.structuredFormat?.mainText?.text || prediction.text?.text;
        const secondaryText = prediction.structuredFormat?.secondaryText?.text || "";

        return (
            <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 0.5, borderBottomColor: theme.border }}
                onPress={() => handleSelectLocation(item, type)}
            >
                <Ionicons name="location-outline" size={20} color={theme.textSecondary} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '500', color: theme.textPrimary }}>{primaryText}</Text>
                    {secondaryText ? <Text style={{ fontSize: 12, color: theme.textSecondary, marginTop: 2 }}>{secondaryText}</Text> : null}
                </View>
            </TouchableOpacity>
        );
    };

    // --- CHECK STATUS ---
    const checkStatus = async () => {
        if (!user?._id) return;
        try {
            // Keep status loading true only on first load/check
            // setStatusLoading(true); 
            const res = await getDriverStatus(user._id);
            setDriverStatus(res);
        } catch (error) {
            console.error("Failed to check status", error);
        } finally {
            setStatusLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            checkStatus();
            setFilterTo('');
            // Auto-fetch location on screen focus
            handleGetCurrentLocation(true);
        }, [user])
    );



    // --- DASHBOARD ACTIONS ---
    const fetchData = async (isRefresh = false) => {
        try {
            if (!isRefresh) setLoading(true);

            // Fetch both Jobs and Requests in parallel
            const [jobsRes, requestsRes] = await Promise.all([
                getTrips({ type: "co-driver-jobs", userId: user._id }),
                getDriverRequests(user._id)
            ]);

            // Filter out past trips
            const allTrips = jobsRes.trips || [];
            const now = new Date();
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const upcomingTrips = allTrips.filter(trip => {
                const tripDate = new Date(trip.tripDate);
                // Reset tripDate time components to strictly compare dates
                tripDate.setHours(0, 0, 0, 0);

                if (tripDate < today) {
                    return false; // Past date
                } else if (tripDate > today) {
                    return true; // Future date
                } else {
                    // It's today, check time
                    if (!trip.tripTime) return true; // Keep if no time specified

                    const timeParts = trip.tripTime.match(/(\d+):(\d+)\s?(AM|PM)/i);
                    if (timeParts) {
                        let hours = parseInt(timeParts[1], 10);
                        const minutes = parseInt(timeParts[2], 10);
                        const modifier = timeParts[3].toUpperCase();

                        if (hours === 12) {
                            hours = modifier === 'PM' ? 12 : 0;
                        } else if (modifier === 'PM') {
                            hours += 12;
                        }

                        const tripDateTime = new Date();
                        tripDateTime.setHours(hours, minutes, 0, 0);

                        return tripDateTime > now;
                    }
                    return true; // Fallback if time format parse fails
                }
            });

            setTrips(upcomingTrips);

            // Create a map for easy lookup: tripId -> request
            const reqMap = {};
            if (requestsRes.requests) {
                requestsRes.requests.forEach(req => {
                    if (req.trip && req.trip._id) {
                        reqMap[req.trip._id] = req;
                    } else if (req.trip) {
                        // Fallback if trip is just an ID (though backend usually populates)
                        reqMap[req.trip] = req;
                    }
                });
            }
            setRequestsMap(reqMap);

        } catch (error) {
            console.error("Failed to fetch dashboard data", error);
            if (!isRefresh) Alert.alert("Error", "Could not fetch dashboard data.");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Auto-fetch data when Status is Approved
    useFocusEffect(
        useCallback(() => {
            if (driverStatus.approvalStatus === 'approved') {
                fetchData();
            }
        }, [driverStatus.approvalStatus])
    );

    // Auto-Refresh Interval
    useEffect(() => {
        let interval;
        if (driverStatus.approvalStatus === 'approved') {
            interval = setInterval(() => {
                fetchData(true); // Silent refresh
            }, 15000); // 15 seconds
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [driverStatus.approvalStatus]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchData(true);
    }, [driverStatus.approvalStatus]);

    // --- FILTERING LOGIC ---
    const getTargetDate = () => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        if (selectedDate === 'today') return d;
        if (selectedDate === 'tomorrow') {
            d.setDate(d.getDate() + 1);
            return d;
        }
        const customDate = new Date(selectedDate);
        customDate.setHours(0, 0, 0, 0);
        return customDate;
    };

    const formatDateDisplay = (date) => {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]} ${date.getDate()}-${months[date.getMonth()]}`;
    };

    // --- ADVANCED FILTERING LOGIC ---
    const getTimeSlot = (timeString) => {
        // timeString format: "10:00 AM" or "22:00"
        if (!timeString) return null;

        let hours = 0;
        const timeParts = timeString.match(/(\d+):(\d+)\s?(AM|PM)/i);

        if (timeParts) {
            hours = parseInt(timeParts[1], 10);
            const modifier = timeParts[3].toUpperCase();
            if (hours === 12) {
                hours = modifier === 'PM' ? 12 : 0;
            } else if (modifier === 'PM') {
                hours += 12;
            }
        } else {
            // Try 24h format
            const simpleParts = timeString.split(':');
            if (simpleParts.length >= 1) hours = parseInt(simpleParts[0], 10);
        }

        if (hours >= 0 && hours < 6) return 'night';
        if (hours >= 6 && hours < 12) return 'morning';
        if (hours >= 12 && hours < 18) return 'afternoon';
        if (hours >= 18 && hours <= 24) return 'evening';
        return null;
    };

    const filteredTrips = trips.filter(trip => {
        const matchesFrom = (trip.fromLocation || "").toLowerCase().includes(filterFrom.toLowerCase());
        const matchesTo = (trip.toLocation || "").toLowerCase().includes(filterTo.toLowerCase());

        const tripDate = new Date(trip.tripDate);
        tripDate.setHours(0, 0, 0, 0);
        const targetDate = getTargetDate();

        const matchesDate = tripDate.getTime() === targetDate.getTime();

        // Time Slot Filter
        let matchesTimeSlot = true;
        if (appliedTimeSlots.length > 0) {
            const slot = getTimeSlot(trip.tripTime);
            matchesTimeSlot = appliedTimeSlots.includes(slot);
        }

        return matchesFrom && matchesTo && matchesDate && matchesTimeSlot;
    });

    // Apply Sorting
    const sortedTrips = [...filteredTrips].sort((a, b) => {
        if (appliedSort === 'early') {
            // Simple string comparison for time or convert to minutes
            const getMinutes = (t) => {
                if (!t) return 0;
                const parts = t.match(/(\d+):(\d+)\s?(AM|PM)/i);
                if (!parts) return 0;
                let h = parseInt(parts[1], 10);
                let m = parseInt(parts[2], 10);
                if (h === 12) h = parts[3].toUpperCase() === 'PM' ? 12 : 0;
                else if (parts[3].toUpperCase() === 'PM') h += 12;
                return h * 60 + m;
            };
            return getMinutes(a.tripTime) - getMinutes(b.tripTime);
        }
        if (appliedSort === 'late') {
            const getMinutes = (t) => {
                if (!t) return 0;
                const parts = t.match(/(\d+):(\d+)\s?(AM|PM)/i);
                if (!parts) return 0;
                let h = parseInt(parts[1], 10);
                let m = parseInt(parts[2], 10);
                if (h === 12) h = parts[3].toUpperCase() === 'PM' ? 12 : 0;
                else if (parts[3].toUpperCase() === 'PM') h += 12;
                return h * 60 + m;
            };
            return getMinutes(b.tripTime) - getMinutes(a.tripTime);
        }
        return 0; // Relevance/Default
    });

    const handleApplyFilters = () => {
        setAppliedSort(tempSort);
        setAppliedTimeSlots(tempTimeSlots);
        setIsFilterModalVisible(false);
    };

    const handleClearAll = () => {
        setTempSort('relevance');
        setTempTimeSlots([]);
    };

    const toggleTimeSlot = (slot) => {
        setTempTimeSlots(prev =>
            prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]
        );
    };

    const handleGetCurrentLocation = async (isAuto = false) => {
        try {
            // If it's manual, we show loading. If auto, we might not want to show it depending on UX.
            // But since the button is below the input, showing a loader inside it is fine.
            setIsLocating(true);

            // 1. Check if location services are enabled
            let enabled = await Location.hasServicesEnabledAsync();
            if (!enabled) {
                if (!isAuto) {
                    try {
                        // Prompt user to enable GPS
                        await Location.enableNetworkProviderAsync();
                        // Re-check if it was enabled
                        enabled = await Location.hasServicesEnabledAsync();
                    } catch (e) {
                        console.log("User cancelled GPS enable");
                    }
                }

                if (!enabled) {
                    if (!isAuto) Alert.alert("Location Disabled", "Please enable location services on your device.");
                    return;
                }
            }

            // 2. Check/Request permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                if (!isAuto) Alert.alert("Permission Denied", "Please allow location access to use this feature.");
                return;
            }

            // 3. Get position with Balanced accuracy (faster than High)
            // Sometimes getCurrentPositionAsync fails on emulators/certain devices without a timeout
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            const { latitude, longitude } = location.coords;

            // 4. Reverse Geocode
            const reverseGeocode = await Location.reverseGeocodeAsync({ latitude, longitude });

            if (reverseGeocode && reverseGeocode.length > 0) {
                const place = reverseGeocode[0];

                // Get only city name or best available localized name
                const locationName = place.city || place.subregion || place.district || place.name;

                if (locationName) {
                    setFilterFrom(locationName);
                } else if (!isAuto) {
                    Alert.alert("Location Found", "We found your location but couldn't determine a clear address.");
                }
            } else if (!isAuto) {
                Alert.alert("Error", "Could not determine your address from coordinates.");
            }
        } catch (error) {
            console.error("Location error details:", error);
            if (!isAuto) Alert.alert("Error", "Failed to get location. Please ensure GPS is on and you have an internet connection.");
        } finally {
            setIsLocating(false);
        }
    };

    const handleDateChange = (event, date) => {
        setShowDatePicker(false);
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleSwap = () => {
        const temp = filterFrom;
        setFilterFrom(filterTo);
        setFilterTo(temp);
    };

    const RouteConnector = () => (
        <View style={{ alignItems: 'center', marginRight: 15, paddingTop: 23 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', borderColor: theme.border, borderWidth: 1 }}>
                <Ionicons name="compass-outline" size={20} color={theme.primary} />
            </View>
            <View style={{ width: 2, height: 44, backgroundColor: theme.border, marginVertical: 4, borderStyle: 'dashed', borderWidth: 1, borderColor: theme.textSecondary }} />
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.card, justifyContent: 'center', alignItems: 'center', borderColor: theme.border, borderWidth: 1 }}>
                <Ionicons name="location-outline" size={20} color="#ff4444" />
            </View>
        </View>
    );


    // SCENARIO A: Not Registered
    if (statusLoading) {
        return (
            <View style={[styles.center, { backgroundColor: theme.background }]} >
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!driverStatus.isRegistered) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]} >
                <Ionicons name="car-sport-outline" size={80} color={theme.primary} />
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginVertical: 10, color: theme.textPrimary }}>
                    Become a Driver / Co - driver
                </Text>
                < Text style={{ textAlign: 'center', color: theme.textSecondary, paddingHorizontal: 40, marginBottom: 30 }
                }>
                    Start earning by driving passengers.Upload your documents to get verified.
                </Text>
                < TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: theme.primary, width: 200 }]}
                    onPress={() => navigation.navigate("DriverRegistration")
                    }
                >
                    <Text style={styles.btnText}> Register Now </Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // SCENARIO B: Pending Approval
    if (driverStatus.approvalStatus === 'pending') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]} >
                <Ionicons name="time-outline" size={80} color="#ffc107" />
                <Text style={{ fontSize: 22, fontWeight: 'bold', marginVertical: 10, color: theme.textPrimary }}>
                    Verification in Progress
                </Text>
                < Text style={{ textAlign: 'center', color: theme.textSecondary, paddingHorizontal: 40, marginBottom: 30 }
                }>
                    Your documents are under review.You will be notified once approved.
                </Text>
                < TouchableOpacity onPress={checkStatus} style={{ padding: 10 }}>
                    <Text style={{ color: theme.primary, fontWeight: 'bold' }}> Check Status Again </Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    // SCENARIO C: Approved (Dashboard)
    const renderTrip = ({ item }) => {
        const existingRequest = requestsMap[item._id];
        let statusBadge = null;

        if (existingRequest) {
            let statusColor = '#ffc107'; // Pending
            if (existingRequest.status === 'accepted') statusColor = '#198754';
            if (existingRequest.status === 'rejected') statusColor = '#dc3545';

            statusBadge = (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name={existingRequest.status === 'accepted' ? "checkmark-circle" : "time"} size={14} color={statusColor} />
                    <Text style={{ color: statusColor, fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
                        {existingRequest.status.toUpperCase()}
                    </Text>
                </View>
            );
        }

        return (
            <TouchableOpacity
                onPress={() => navigation.navigate("TripDetails", { trip: item, viewContext: 'co-driver', existingRequest })}
                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
            >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>

                        {/* Header: "Looking for a Co-Driver" as the highlight */}
                        <View style={[styles.cardHeader, { justifyContent: 'space-between' }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="people-outline" size={14} color={theme.primary} />
                                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: 'bold', marginLeft: 4 }}>
                                    Looking for a Co-Driver
                                </Text>
                            </View>
                        </View>

                        {/* Route */}
                        <View style={{ marginVertical: 8 }}>
                            <Text style={[styles.routeText, { color: theme.textPrimary }]} numberOfLines={1}>
                                {item.fromLocation} <Ionicons name="arrow-forward" size={14} color={theme.textSecondary} /> {item.toLocation}
                            </Text>
                        </View>

                        {/* Date & Owner Name */}
                        <View style={{ gap: 4 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                                    {new Date(item.tripDate).toDateString()} • {item.tripTime}
                                </Text>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="person-outline" size={14} color={theme.textSecondary} />
                                <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                                    {item.owner?.name || "Owner"}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Owner/Vehicle Image */}
                    {item.owner?.profileImage ? (
                        <Image
                            source={{ uri: item.owner.profileImage }}
                            style={[styles.mapThumbnail, { backgroundColor: theme.secondary }]}
                        />
                    ) : (
                        <View style={[styles.mapThumbnail, { backgroundColor: theme.secondary, justifyContent: 'center', alignItems: 'center' }]}>
                            <Ionicons name="person" size={32} color={theme.textSecondary} />
                        </View>
                    )}
                </View>

                {/* Footer Actions */}
                <View style={{ marginTop: 15, alignItems: 'flex-end' }}>
                    {existingRequest ? (
                        statusBadge
                    ) : (
                        <TouchableOpacity
                            onPress={() => navigation.navigate("TripDetails", { trip: item, viewContext: 'co-driver', existingRequest })}
                            style={[styles.actionBtn, { backgroundColor: theme.primary, minWidth: 100 }]}
                        >
                            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 12 }}>Send Request</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // --- MAIN RENDER ---
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} >
            <View style={styles.header}>
                <Text style={[styles.heading, { color: theme.textPrimary }]}>Co-Driver Dashboard</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                    <TouchableOpacity
                        onPress={() => {
                            setTempSort(appliedSort);
                            setTempTimeSlots(appliedTimeSlots);
                            setIsFilterModalVisible(true);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center' }}
                    >
                        <Ionicons name="options-outline" size={24} color={theme.textPrimary} />
                        <Text style={{ color: theme.textPrimary, fontWeight: 'bold', marginLeft: 4 }}>Filter</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={{ padding: 16 }}>
                <View style={[styles.filterCard, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}>
                    {/* From Input */}
                    <View style={styles.filterRow}>
                        <Ionicons name="car-outline" size={20} color={theme.textSecondary} style={styles.filterIcon} />
                        <TextInput
                            style={[styles.filterInput, { color: theme.textPrimary }]}
                            placeholder="From"
                            placeholderTextColor={theme.textSecondary}
                            value={filterFrom}
                            onChangeText={(text) => handleLocationSearch(text, 'from')}
                            onFocus={() => {
                                if (filterFrom.length >= 4 && fromSuggestions.length > 0) setShowFromSuggestions(true);
                                setShowToSuggestions(false);
                            }}
                        />
                        {/* Suggestions List for FROM */}
                        {showFromSuggestions && fromSuggestions.length > 0 && (
                            <View style={[styles.suggestionsDropdown, { backgroundColor: '#fff', borderColor: theme.border }]}>
                                {suggestionsLoading && <ActivityIndicator size="small" color={theme.primary} style={{ margin: 10 }} />}
                                <FlatList
                                    data={fromSuggestions}
                                    keyExtractor={(item, index) => item.placePrediction?.placeId || index.toString()}
                                    renderItem={(props) => renderLocationSuggestion(props, 'from')}
                                    keyboardShouldPersistTaps="handled"
                                    style={{ maxHeight: 200 }}
                                />
                                <View style={{ padding: 5, alignItems: 'flex-end', opacity: 0.5 }}><Text style={{ fontSize: 10, color: theme.textSecondary }}>Powered by Google</Text></View>
                            </View>
                        )}
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    {/* Current Location Button - only shown if filterFrom is empty */}
                    {!filterFrom && (
                        <TouchableOpacity
                            onPress={() => handleGetCurrentLocation(false)}
                            style={[styles.useLocationBtn, { borderBottomColor: theme.border, borderBottomWidth: 1 }]}
                            disabled={isLocating}
                        >
                            {isLocating ? (
                                <ActivityIndicator size="small" color={theme.primary} />
                            ) : (
                                <>
                                    <Ionicons name="location" size={16} color={theme.primary} />
                                    <Text style={[styles.useLocationText, { color: theme.primary }]}>Use Current Location</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    )}

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    {/* To Input */}
                    <View style={styles.filterRow}>
                        <Ionicons name="car-outline" size={20} color={theme.textSecondary} style={styles.filterIcon} />
                        <TextInput
                            style={[styles.filterInput, { color: theme.textPrimary }]}
                            placeholder="To"
                            placeholderTextColor={theme.textSecondary}
                            value={filterTo}
                            onChangeText={(text) => handleLocationSearch(text, 'to')}
                            onFocus={() => {
                                if (filterTo.length >= 4 && toSuggestions.length > 0) setShowToSuggestions(true);
                                setShowFromSuggestions(false);
                            }}
                        />
                        {/* Suggestions List for TO */}
                        {showToSuggestions && toSuggestions.length > 0 && (
                            <View style={[styles.suggestionsDropdown, { backgroundColor: '#fff', borderColor: theme.border }]}>
                                {suggestionsLoading && <ActivityIndicator size="small" color={theme.primary} style={{ margin: 10 }} />}
                                <FlatList
                                    data={toSuggestions}
                                    keyExtractor={(item, index) => item.placePrediction?.placeId || index.toString()}
                                    renderItem={(props) => renderLocationSuggestion(props, 'to')}
                                    keyboardShouldPersistTaps="handled"
                                    style={{ maxHeight: 200 }}
                                />
                                <View style={{ padding: 5, alignItems: 'flex-end', opacity: 0.5 }}><Text style={{ fontSize: 10, color: theme.textSecondary }}>Powered by Google</Text></View>
                            </View>
                        )}
                        <TouchableOpacity onPress={handleSwap} style={[styles.swapBtn, { backgroundColor: theme.secondary }]}>
                            <Ionicons name="swap-vertical" size={18} color={theme.textPrimary} />
                        </TouchableOpacity>
                    </View>

                    <View style={[styles.divider, { backgroundColor: theme.border }]} />

                    {/* Date Picker Section */}
                    <View style={[styles.filterRow, { justifyContent: 'space-between', paddingVertical: 10 }]}>
                        <TouchableOpacity
                            onPress={() => setShowDatePicker(true)}
                            style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                        >
                            <Ionicons name="calendar-outline" size={20} color={theme.textSecondary} style={styles.filterIcon} />
                            <View>
                                <Text style={{ color: theme.textSecondary, fontSize: 10 }}>Date of Journey</Text>
                                <Text style={{ color: theme.textPrimary, fontWeight: 'bold', fontSize: 14 }}>
                                    {formatDateDisplay(getTargetDate())}
                                </Text>
                            </View>
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            <TouchableOpacity
                                onPress={() => setSelectedDate('today')}
                                style={[styles.chip, selectedDate === 'today' && { backgroundColor: '#ff444420', borderColor: '#ff4444' }, { borderColor: theme.border }]}
                            >
                                <Text style={[styles.chipText, { color: selectedDate === 'today' ? '#ff4444' : theme.textSecondary }]}>Today</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => setSelectedDate('tomorrow')}
                                style={[styles.chip, selectedDate === 'tomorrow' && { backgroundColor: '#ff444420', borderColor: '#ff4444' }, { borderColor: theme.border }]}
                            >
                                <Text style={[styles.chipText, { color: selectedDate === 'tomorrow' ? '#ff4444' : theme.textSecondary }]}>Tomorrow</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {showDatePicker && (
                    <DateTimePicker
                        value={getTargetDate()}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        minimumDate={new Date()}
                    />
                )}
            </View>

            <View style={{ paddingHorizontal: 16, marginBottom: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.textPrimary }}>
                    {selectedDate === 'today' ? 'Today' : selectedDate === 'tomorrow' ? 'Tomorrow' : formatDateDisplay(getTargetDate())}
                </Text>
            </View>

            {
                loading && !refreshing ? (
                    <View style={styles.center} >
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={sortedTrips}
                        keyExtractor={(item) => item._id}
                        renderItem={renderTrip}
                        contentContainerStyle={{ padding: 16 }}
                        refreshControl={
                            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />
                        }
                        ListEmptyComponent={
                            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                                {filterFrom || filterTo ? "No trips found matching your research." : "No co-driving jobs available at the moment."}
                            </Text>
                        }
                    />
                )}

            {/* Advanced Filter Modal */}
            <Modal
                visible={isFilterModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setIsFilterModalVisible(false)}
            >
                <SafeAreaView style={[styles.modalOverlay, { backgroundColor: theme.background }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.background }]}>
                        {/* Header */}
                        <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <TouchableOpacity onPress={() => setIsFilterModalVisible(false)} style={{ marginRight: 15 }}>
                                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                                </TouchableOpacity>
                                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Filter Trips</Text>
                            </View>
                            <TouchableOpacity onPress={handleClearAll}>
                                <Text style={{ color: '#ff4444', fontWeight: 'bold' }}>Clear all</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ flex: 1, flexDirection: 'row' }}>
                            {/* Sidebar */}
                            <View style={[styles.modalSidebar, { backgroundColor: theme.card, borderRightWidth: 1, borderRightColor: theme.border }]}>
                                <TouchableOpacity
                                    style={[styles.sidebarItem, activeFilterCategory === 'sort' && { backgroundColor: theme.background }]}
                                    onPress={() => setActiveFilterCategory('sort')}
                                >
                                    <View style={[styles.activeIndicator, { backgroundColor: activeFilterCategory === 'sort' ? '#ff4444' : 'transparent' }]} />
                                    <View style={{ flex: 1, paddingVertical: 15 }}>
                                        <Text style={[styles.sidebarText, { color: activeFilterCategory === 'sort' ? '#ff4444' : theme.textPrimary }]}>Sort by</Text>
                                    </View>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.sidebarItem, activeFilterCategory === 'time' && { backgroundColor: theme.background }]}
                                    onPress={() => setActiveFilterCategory('time')}
                                >
                                    <View style={[styles.activeIndicator, { backgroundColor: activeFilterCategory === 'time' ? '#ff4444' : 'transparent' }]} />
                                    <View style={{ flex: 1, paddingVertical: 15 }}>
                                        <Text style={[styles.sidebarText, { color: activeFilterCategory === 'time' ? '#ff4444' : theme.textPrimary }]}>Departure time</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                            {/* Options */}
                            <ScrollView style={[styles.modalOptions, { backgroundColor: theme.background }]}>
                                {activeFilterCategory === 'sort' ? (
                                    <View style={{ padding: 10 }}>
                                        {[
                                            { id: 'relevance', label: 'Relevance' },
                                            { id: 'early', label: 'Early departure' },
                                            { id: 'late', label: 'Late departure' },
                                        ].map(opt => (
                                            <TouchableOpacity
                                                key={opt.id}
                                                style={[styles.optionRow, { borderBottomColor: theme.border }]}
                                                onPress={() => setTempSort(opt.id)}
                                            >
                                                <Text style={[styles.optionLabel, { color: theme.textPrimary }]}>{opt.label}</Text>
                                                <View style={[styles.radio, { borderColor: tempSort === opt.id ? '#ff4444' : theme.border }]}>
                                                    {tempSort === opt.id && <View style={[styles.radioInner, { backgroundColor: '#ff4444' }]} />}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                ) : (
                                    <View style={{ padding: 10 }}>
                                        {[
                                            { id: 'morning', label: '06:00 - 12:00', sub: 'Morning', icon: 'sunny-outline' },
                                            { id: 'afternoon', label: '12:00 - 18:00', sub: 'Afternoon', icon: 'partly-sunny-outline' },
                                            { id: 'evening', label: '18:00 - 00:00', sub: 'Evening', icon: 'moon-outline' },
                                            { id: 'night', label: '00:00 - 06:00', sub: 'Night', icon: 'cloudy-night-outline' },
                                        ].map(opt => (
                                            <TouchableOpacity
                                                key={opt.id}
                                                style={[styles.optionRow, { borderBottomColor: theme.border }]}
                                                onPress={() => toggleTimeSlot(opt.id)}
                                            >
                                                <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                                    <View style={{ marginRight: 15 }}>
                                                        <Ionicons name={opt.icon} size={24} color={tempTimeSlots.includes(opt.id) ? '#ff4444' : theme.textSecondary} />
                                                    </View>
                                                    <View>
                                                        <Text style={[styles.timeLabel, { color: theme.textPrimary, fontWeight: tempTimeSlots.includes(opt.id) ? 'bold' : '500' }]}>{opt.label}</Text>
                                                        <Text style={{ color: theme.textSecondary, fontSize: 13 }}>{opt.sub}</Text>
                                                    </View>
                                                </View>
                                                <View style={[styles.checkbox, { borderColor: tempTimeSlots.includes(opt.id) ? '#ff4444' : theme.border, backgroundColor: tempTimeSlots.includes(opt.id) ? '#ff4444' : 'transparent' }]}>
                                                    {tempTimeSlots.includes(opt.id) && <Ionicons name="checkmark" size={16} color="#fff" />}
                                                </View>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                )}
                            </ScrollView>
                        </View>

                        {/* Footer */}
                        <View style={[styles.modalFooter, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
                            <TouchableOpacity
                                style={[styles.applyBtn, { backgroundColor: '#ff4444' }]}
                                onPress={handleApplyFilters}
                            >
                                <Text style={styles.applyText}>View {filteredTrips.length} trips</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heading: { fontSize: 24, fontWeight: "bold" },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

    // Card Styles adapted
    card: { borderRadius: 16, padding: 15, marginBottom: 15 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },

    routeText: { fontSize: 16, fontWeight: 'bold' },
    dateText: { fontSize: 13, marginLeft: 4 },

    mapThumbnail: { width: 80, height: 80, borderRadius: 12 },
    actionBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center' },

    primaryBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, alignItems: 'center' },
    btnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

    emptyText: { marginTop: 40, textAlign: "center", fontSize: 16 },
    input: { height: 50, borderRadius: 12, paddingHorizontal: 15, fontSize: 16, justifyContent: 'center' },

    filterCard: { borderRadius: 16, marginBottom: 20, zIndex: 10 },
    filterRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 60 },
    filterIcon: { marginRight: 12 },
    filterInput: { flex: 1, fontSize: 15, height: '100%', fontWeight: '500' },
    useLocationBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'rgba(0,0,0,0.02)'
    },
    useLocationText: { fontSize: 13, fontWeight: 'bold', marginLeft: 6 },
    divider: { height: 1.2, marginHorizontal: 16 },
    swapBtn: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
    chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
    chipText: { fontSize: 13, fontWeight: 'bold' },

    // Modal Styles
    modalOverlay: { flex: 1 },
    modalContent: { flex: 1 },
    modalHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, height: 60 },
    modalTitle: { fontSize: 20, fontWeight: 'bold' },

    modalSidebar: { width: '38%', height: '100%' },
    sidebarItem: { flexDirection: 'row', alignItems: 'stretch' },
    activeIndicator: { width: 4, height: '100%' },
    sidebarText: { fontSize: 15, fontWeight: '600', paddingLeft: 12 },

    modalOptions: { flex: 1 },
    optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 20, paddingHorizontal: 15, borderBottomWidth: 0.5 },
    optionLabel: { fontSize: 15, fontWeight: '500' },
    radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
    radioInner: { width: 10, height: 10, borderRadius: 5 },

    timeLabel: { fontSize: 15, fontWeight: 'bold' },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },

    modalFooter: { padding: 16, paddingBottom: 24, borderTopWidth: 1 },
    applyBtn: { height: 55, borderRadius: 12, justifyContent: 'center', alignItems: 'center', shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 5 },
    applyText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
    suggestionsDropdown: {
        position: 'absolute',
        top: 60,
        left: 0,
        right: 0,
        zIndex: 9999,
        borderWidth: 1,
        borderTopWidth: 0,
        backgroundColor: "#fff",
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        maxHeight: 200,
        elevation: 0, // No shadow as requested
    }
});
