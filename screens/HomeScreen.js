import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ImageBackground,
    Dimensions,
    TouchableOpacity,
    FlatList,
    ScrollView,
    Image,
    TextInput,
    StatusBar // standard RN StatusBar, but we use expo-status-bar in App.js which is fine
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import Navbar from '../components/Navbar';
import RightSidebar from '../components/RightSidebar';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

// Mock Data for Rides
const RIDES = [
    { id: '1', name: 'Standard', time: '2 min', price: '$12.50', seats: 4, image: 'car-sport' },
    { id: '2', name: 'XL', time: '5 min', price: '$18.90', seats: 6, image: 'car-sport' },
    { id: '3', name: 'Electric', time: '8 min', price: '$14.20', seats: 4, eco: true, image: 'leaf' },
    { id: '4', name: 'Luxury', time: '12 min', price: '$28.00', seats: 3, image: 'diamond' },
];

export default function HomeScreen({ navigation }) {
    const [selectedRide, setSelectedRide] = useState('1');
    const [isSidebarVisible, setSidebarVisible] = useState(false);
    const { theme, themeName } = useTheme();
    const [fromLocation, setFromLocation] = useState('');
    const [toLocation, setToLocation] = useState('');

    const renderRideItem = ({ item }) => {
        const isSelected = selectedRide === item.id;
        return (
            <TouchableOpacity
                style={[
                    styles.rideCard,
                    {
                        backgroundColor: themeName === 'dark' ? '#323B50' : theme.secondary,
                        shadowColor: themeName === 'dark' ? "#000" : "#888"
                    },
                    isSelected && { borderWidth: 1, borderColor: theme.accent }
                ]}
                onPress={() => setSelectedRide(item.id)}
                activeOpacity={0.9}
            >
                <View style={[styles.rideIconContainer, { backgroundColor: themeName === 'dark' ? '#252B3B' : '#E0E0E0' }]}>
                    <Ionicons name={item.image} size={32} color={themeName === 'dark' ? '#FFF' : theme.textPrimary} />
                </View>

                <View style={styles.rideDetails}>
                    <Text style={[styles.rideName, { color: theme.textPrimary }]}>{item.name}</Text>
                    <View style={styles.rideMeta}>
                        <Ionicons name="time-outline" size={12} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.time}</Text>
                        <Text style={[styles.metaDot, { color: theme.textSecondary }]}>•</Text>
                        <Ionicons name="person" size={12} color={theme.textSecondary} />
                        <Text style={[styles.metaText, { color: theme.textSecondary }]}>{item.seats}</Text>
                        {item.eco && (
                            <>
                                <Text style={[styles.metaDot, { color: theme.textSecondary }]}>•</Text>
                                <Text style={[styles.metaText, { color: theme.success }]}>Eco-friendly</Text>
                            </>
                        )}
                    </View>
                </View>

                <View style={styles.ridePriceContainer}>
                    <Text style={[styles.price, { color: theme.textPrimary }]}>{item.price}</Text>
                    <TouchableOpacity style={[styles.arrowButton, { backgroundColor: themeName === 'dark' ? '#252B3B' : '#E0E0E0' }]}>
                        <Ionicons name="chevron-forward" size={16} color={theme.accent} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.secondary }]}>

            {/* Background Map Placeholder */}
            <ImageBackground
                source={{ uri: 'https://img.freepik.com/free-vector/grey-city-map-background_1053-625.jpg' }} // Placeholder Map
                style={styles.backgroundImage}
                resizeMode="cover"
            >
                <View style={[styles.overlay, { backgroundColor: themeName === 'dark' ? 'rgba(37, 43, 59, 0.4)' : 'rgba(255, 255, 255, 0.6)' }]} />

                {/* Navbar */}
                <Navbar
                    onMenuPress={() => setSidebarVisible(true)}
                    onProfilePress={() => navigation.navigate('Account')}
                />

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

                    {/* Status Pill */}
                    <View style={styles.pillContainer}>
                        <View style={[styles.pill, { backgroundColor: themeName === 'dark' ? 'rgba(37, 43, 59, 0.9)' : 'rgba(255, 255, 255, 0.9)', shadowColor: themeName === 'dark' ? "#000" : "#888" }]}>
                            <View style={[styles.greenDot, { backgroundColor: theme.success }]} />
                            <Text style={[styles.pillText, { color: theme.textPrimary }]}>3 cars nearby</Text>
                        </View>
                    </View>

                    {/* Search Card */}
                    <View style={[styles.searchCard, { backgroundColor: themeName === 'dark' ? theme.secondary : '#FFF', shadowColor: themeName === 'dark' ? "#000" : "#888" }]}>
                        {/* Timeline Graphic */}
                        <View style={styles.timelineContainer}>
                            <View style={[styles.circleHollow, { borderColor: theme.textSecondary }]} />
                            <View style={[styles.lineDashed, { backgroundColor: theme.textSecondary }]} />
                            <View style={[styles.circleHollow, { borderColor: theme.accent }]} />
                        </View>

                        <View style={styles.inputsWrapper}>
                            <View style={styles.inputBox}>
                                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>From</Text>
                                <TextInput
                                    style={[styles.inputValue, { color: theme.textPrimary, padding: 0 }]}
                                    value={fromLocation}
                                    onChangeText={setFromLocation}
                                    placeholder="Enter pickup location"
                                    placeholderTextColor={theme.textSecondary}
                                />
                            </View>

                            <View style={[styles.separator, { backgroundColor: theme.textSecondary }]} />

                            <View style={[styles.inputBox, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                                <View style={{ flex: 1, marginRight: 10 }}>
                                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>To</Text>
                                    <TextInput
                                        style={[styles.inputValue, { color: theme.textPrimary, padding: 0 }]}
                                        value={toLocation}
                                        onChangeText={setToLocation}
                                        placeholder="Where to?"
                                        placeholderTextColor={theme.textSecondary}
                                    />
                                </View>
                                <TouchableOpacity style={[styles.addButton, { backgroundColor: themeName === 'dark' ? '#333D55' : theme.textLight }]}>
                                    <Ionicons name="add" size={20} color={themeName === 'dark' ? '#FFF' : theme.textPrimary} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Available Rides Header */}
                    <View style={styles.sectionHeader}>
                        <View style={styles.iconTitleWrapper}>
                            <View style={[styles.carIconCircle, { backgroundColor: themeName === 'dark' ? '#FFF' : theme.textPrimary }]}>
                                <Ionicons name="car" size={16} color={themeName === 'dark' ? theme.textPrimary : '#FFF'} />
                            </View>
                            <Text style={[styles.sectionTitle, { color: themeName === 'dark' ? '#FFF' : theme.textPrimary, textShadowColor: themeName === 'dark' ? 'rgba(0, 0, 0, 0.75)' : 'transparent' }]}>Available Rides</Text>
                        </View>
                        <View style={[styles.sortPill, { backgroundColor: themeName === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.8)' }]}>
                            <Text style={[styles.sortText, { color: theme.textSecondary }]}>Sort by: </Text>
                            <Text style={[styles.sortText, { color: theme.accent }]}>Nearest</Text>
                        </View>
                    </View>

                    {/* Rides List */}
                    <View style={styles.ridesList}>
                        {RIDES.map(item => <View key={item.id} style={{ marginBottom: 16 }}>{renderRideItem({ item })}</View>)}
                    </View>

                </ScrollView>

                {/* Right Sidebar */}
                <RightSidebar
                    visible={isSidebarVisible}
                    onClose={() => setSidebarVisible(false)}
                    navigation={navigation}
                />

            </ImageBackground>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    backgroundImage: {
        flex: 1,
        width: '100%',
        height: '100%',
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
    },
    pillContainer: {
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
    },
    greenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    pillText: {
        fontSize: 14,
        fontWeight: '500',
    },
    searchCard: {
        marginHorizontal: 16, // used directly to match SIZES.padding typically
        borderRadius: 20,
        padding: 20,
        flexDirection: 'row',
        marginBottom: 30,
        // Shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
    },
    timelineContainer: {
        alignItems: 'center',
        marginRight: 16,
        justifyContent: 'center',
    },
    circleHollow: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
    },
    lineDashed: {
        flex: 1,
        width: 1,
        marginVertical: 4,
        borderStyle: 'dashed',
        opacity: 0.5,
    },
    inputsWrapper: {
        flex: 1,
    },
    inputBox: {
        paddingVertical: 8,
    },
    inputLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    inputValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    separator: {
        height: 1,
        opacity: 0.2,
        marginVertical: 12,
    },
    addButton: {
        width: 36,
        height: 36,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginHorizontal: 16,
        marginBottom: 16,
    },
    iconTitleWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    carIconCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    sortPill: {
        flexDirection: 'row',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    sortText: {
        fontSize: 12,
        fontWeight: '600',
    },
    ridesList: {
        marginHorizontal: 16,
    },
    rideCard: {
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 3,
    },
    rideIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    rideDetails: {
        flex: 1,
    },
    rideName: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    rideMeta: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    metaText: {
        fontSize: 12,
        marginLeft: 4,
    },
    metaDot: {
        marginHorizontal: 6,
        fontSize: 10,
    },
    ridePriceContainer: {
        alignItems: 'flex-end',
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    arrowButton: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
