import React, { useContext, useState, useCallback } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { useTheme } from "../context/ThemeContext";
import { AuthContext } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { getMyVehicles, getOwnerRequests } from "../services/api";

export default function OwnerScreen({ navigation }) {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [hasVehicles, setHasVehicles] = useState(false);
    const [requestCount, setRequestCount] = useState(0);

    // Check for vehicles on every focus
    useFocusEffect(
        useCallback(() => {
            const checkVehicles = async () => {
                if (!user?._id) return;
                try {
                    // Check Vehicles
                    const vehicleRes = await getMyVehicles(user._id);
                    setHasVehicles(vehicleRes.vehicles?.length > 0);

                    // Check Requests
                    const requestRes = await getOwnerRequests(user._id);
                    const pending = requestRes.requests?.filter(r => r.status === 'pending') || [];
                    setRequestCount(pending.length);

                } catch (error) {
                    console.error("Failed to fetch dashboard data", error);
                } finally {
                    setLoading(false);
                }
            };
            checkVehicles();
        }, [user])
    );

    const menuItems = [
        {
            title: "Post New Trip",
            desc: "Create a trip with dynamic options",
            icon: "add-circle",
            color: theme.primary,
            screen: "PostTrip"
        },
        {
            title: "My Garage",
            desc: "Manage your vehicles",
            icon: "car-sport",
            color: theme.accent,
            screen: "Garage"
        },

        {
            title: "My Journeys",
            desc: "View your scheduled trips",
            icon: "map",
            color: theme.success,
            screen: "MyJourneys"
        }
    ];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <View>
                    <Text style={[styles.greeting, { color: theme.textSecondary }]}>Welcome,</Text>
                    <Text style={[styles.name, { color: theme.textPrimary }]}>{user?.name || "Owner"}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity
                        style={{ marginRight: 15, position: 'relative' }}
                        onPress={() => navigation.navigate("TripRequests")}
                    >
                        <Ionicons name="notifications-outline" size={28} color={theme.textPrimary} />
                        {requestCount > 0 && (
                            <View style={styles.badge}>
                                <Text style={styles.badgeText}>{requestCount > 9 ? '9+' : requestCount}</Text>
                            </View>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => navigation.navigate("Account")}>
                        {user?.profileImage ?
                            <Image
                                source={{ uri: user?.profileImage }}
                                style={styles.avatar}
                            /> :
                            <Ionicons name="person-circle-outline" size={40} color={theme.textPrimary} />}
                    </TouchableOpacity>
                </View>
            </View>


            <ScrollView contentContainerStyle={styles.content}>
                <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>DASHBOARD</Text>

                {loading ? (
                    <View style={{ height: 200, justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                ) : !hasVehicles ? (
                    // RESTRICTED VIEW: Only Add Vehicle
                    <View style={styles.grid}>
                        <TouchableOpacity
                            style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
                            onPress={() => navigation.navigate("Garage")}
                        >
                            <View style={[styles.iconBox, { backgroundColor: theme.primary + '20' }]}>
                                <Ionicons name="add" size={32} color={theme.primary} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>Add First Vehicle</Text>
                                <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>
                                    You need to add a vehicle before you can post trips.
                                </Text>
                            </View>
                            <Ionicons name="arrow-forward" size={24} color={theme.textSecondary} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    // FULL DASHBOARD
                    <View style={styles.grid}>
                        {menuItems.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }]}
                                onPress={() => navigation.navigate(item.screen)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: item.color + '20' }]}>
                                    <Ionicons name={item.icon} size={32} color={item.color} />
                                </View>
                                <View>
                                    <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>{item.title}</Text>
                                    <Text style={[styles.cardDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                                </View>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    greeting: { fontSize: 14 },
    name: { fontSize: 24, fontWeight: 'bold' },
    avatar: { width: 40, height: 40, borderRadius: 20 },
    content: { padding: 20 },
    sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 15, letterSpacing: 1 },
    grid: { gap: 15 },
    card: { padding: 20, borderRadius: 16, flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
    cardDesc: { fontSize: 12 },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: '#dc3545',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#fff'
    },
    badgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' }
});
