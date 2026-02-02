import React, { useCallback, useState, useContext } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    ScrollView,
    Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { getOwnerRequests, updateRequestStatus } from '../services/api';

const TripRequestsScreen = ({ navigation }) => {
    const { theme } = useTheme();
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [processing, setProcessing] = useState({});
    const [selectedDoc, setSelectedDoc] = useState(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await getOwnerRequests(user._id);
            setRequests(res.requests || []);
        } catch (error) {
            console.error(error);
            Alert.alert("Error", "Failed to fetch requests.");
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            if (user?._id) fetchRequests();
        }, [user])
    );

    const handleAction = async (requestId, status) => {
        try {
            setProcessing(prev => ({ ...prev, [requestId]: status }));
            await updateRequestStatus(requestId, status);
            Alert.alert("Success", `Request ${status}!`);
            fetchRequests(); // Refresh list
        } catch (error) {
            Alert.alert("Action Failed", error.message || "Could not update request.");
        } finally {
            setProcessing(prev => ({ ...prev, [requestId]: null }));
        }
    };

    const renderRequest = ({ item }) => (
        <View style={[
            styles.card,
            { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 }
        ]}>
            {/* Header: Driver Info & Status */}
            <View style={styles.cardHeader}>
                <View style={styles.driverContainer}>
                    <Image
                        source={{ uri: item.driver?.profileImage || "https://via.placeholder.com/50" }}
                        style={styles.avatar}
                    />
                    <View style={styles.driverText}>
                        <Text style={[styles.name, { color: theme.textPrimary }]}>{item.driver?.name || "Driver"}</Text>
                        <View style={styles.ratingRow}>
                            <Ionicons name="star" size={12} color={theme.primary} />
                            <Text style={[styles.ratingText, { color: theme.textSecondary }]}> 4.8 • 50+ Trips</Text>
                        </View>
                    </View>
                </View>
                <View style={[styles.statusBadge, { borderColor: theme.primary, borderWidth: 1 }]}>
                    <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 10, letterSpacing: 0.5 }}>PENDING</Text>
                </View>
            </View>

            {/* Content Body */}
            <View style={styles.cardBody}>
                {/* Visual Route Timeline */}
                <View style={styles.routeContainer}>
                    <View style={styles.timelineColumn}>
                        <View style={[styles.dot, { borderColor: theme.success }]} />
                        <View style={[styles.line, { backgroundColor: theme.border }]} />
                        <View style={[styles.dot, { borderColor: theme.primary }]} />
                    </View>
                    <View style={styles.routeTextColumn}>
                        <View style={styles.routeRow}>
                            <Text style={[styles.locationText, { color: theme.textPrimary }]}>{item.trip?.fromLocation}</Text>
                        </View>
                        <View style={[styles.routeRow, { marginTop: 18 }]}>
                            <Text style={[styles.locationText, { color: theme.textPrimary }]}>{item.trip?.toLocation}</Text>
                        </View>
                    </View>
                </View>

                {/* Date & Time Strip */}
                <View style={[styles.dateTimeStrip, { borderColor: theme.border }]}>
                    <View style={styles.infoItem}>
                        <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                            {new Date(item.trip?.tripDate).toDateString()}
                        </Text>
                    </View>
                    <View style={[styles.verticalDivider, { backgroundColor: theme.border }]} />
                    <View style={styles.infoItem}>
                        <Ionicons name="time-outline" size={16} color={theme.textSecondary} />
                        <Text style={[styles.infoText, { color: theme.textPrimary }]}>
                            {item.trip?.tripTime}
                        </Text>
                    </View>
                </View>

                {/* Documents Strip */}
                {item.driver?.documentImages && (
                    <View style={{ marginTop: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.border }}>
                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: theme.textSecondary, marginBottom: 5, textTransform: 'uppercase' }}>Verified Documents</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                            {['aadhar', 'license', 'pan'].map((docType) => (
                                item.driver.documentImages[docType] && (
                                    <TouchableOpacity
                                        key={docType}
                                        onPress={() => setSelectedDoc({ uri: item.driver.documentImages[docType], title: docType.toUpperCase() })}
                                        style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4, backgroundColor: theme.secondary, flexDirection: 'row', alignItems: 'center' }}
                                    >
                                        <Ionicons name="document-text-outline" size={12} color={theme.textPrimary} />
                                        <Text style={{ fontSize: 10, fontWeight: '600', color: theme.textPrimary, marginLeft: 4 }}>{docType.toUpperCase()}</Text>
                                    </TouchableOpacity>
                                )
                            ))}
                        </ScrollView>
                    </View>
                )}
            </View>

            {/* Footer Actions */}
            <View style={[styles.cardFooter, { borderTopColor: theme.border }]}>
                <TouchableOpacity
                    style={[styles.actionBtn, styles.rejectBtn, { borderColor: theme.border }]}
                    onPress={() => handleAction(item._id, 'rejected')}
                    disabled={!!processing[item._id]}
                >
                    {processing[item._id] === 'rejected' ? (
                        <ActivityIndicator size="small" color={theme.danger} />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="close-circle-outline" size={18} color={theme.danger} style={{ marginRight: 6 }} />
                            <Text style={[styles.btnText, { color: theme.danger }]}>Reject</Text>
                        </View>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.actionBtn, styles.acceptBtn, { backgroundColor: theme.success }]}
                    onPress={() => handleAction(item._id, 'accepted')}
                    disabled={!!processing[item._id]}
                >
                    {processing[item._id] === 'accepted' ? (
                        <ActivityIndicator size="small" color={theme.textPrimary} />
                    ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Ionicons name="checkmark-circle-outline" size={18} color={theme.textPrimary} style={{ marginRight: 6 }} />
                            <Text style={[styles.btnText, { color: theme.textPrimary }]}>Accept</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={[styles.backBtn, { backgroundColor: theme.card }]}
                >
                    <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.textPrimary }]}>Trip Requests</Text>
            </View>

            {loading ? (
                <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={item => item._id}
                    renderItem={renderRequest}
                    contentContainerStyle={{ padding: 20, paddingTop: 10 }}
                    ListEmptyComponent={
                        <View style={styles.center}>
                            <Ionicons name="documents-outline" size={64} color={theme.textSecondary + '50'} />
                            <Text style={{ color: theme.textSecondary, marginTop: 10 }}>No pending requests yet.</Text>
                        </View>
                    }
                />
            )}

            {/* Document Viewer Modal */}
            <Modal visible={!!selectedDoc} transparent={true} animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                    <TouchableOpacity
                        style={{ position: 'absolute', top: 50, right: 20, zIndex: 10 }}
                        onPress={() => setSelectedDoc(null)}
                    >
                        <Ionicons name="close-circle" size={40} color="#fff" />
                    </TouchableOpacity>

                    {selectedDoc && (
                        <>
                            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 20, top: 20 }}>
                                {selectedDoc.title}
                            </Text>
                            <Image
                                source={{ uri: selectedDoc.uri }}
                                style={{ width: '100%', height: '70%', resizeMode: 'contain', borderRadius: 10 }}
                            />
                        </>
                    )}
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 15, elevation: 2 },
    title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', minHeight: 400 },

    // Card Styles
    card: {
        borderRadius: 16, // Clean rounded corners
        marginBottom: 15,
        // No elevation/shadow as per request for My Trips style
        overflow: 'hidden',
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingBottom: 12,
    },
    driverContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 6,
        paddingRight: 12,
        borderRadius: 30,
    },
    avatar: { width: 42, height: 42, borderRadius: 21 },
    driverText: { marginLeft: 10 },
    name: { fontWeight: '700', fontSize: 15 },

    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
    ratingText: { fontSize: 11, fontWeight: '600' },

    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },

    // Body & Route
    cardBody: { paddingHorizontal: 16, paddingBottom: 16 },
    routeContainer: { flexDirection: 'row', marginBottom: 16 },
    timelineColumn: { alignItems: 'center', marginRight: 12, width: 20, paddingTop: 6 },
    dot: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, backgroundColor: 'transparent' },
    line: { width: 2, height: 26, marginVertical: 2 },

    routeTextColumn: { flex: 1 },
    routeRow: { height: 24, justifyContent: 'center' },
    locationText: { fontSize: 15, fontWeight: '600' },

    dateTimeStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
    },
    infoItem: { flexDirection: 'row', alignItems: 'center', flex: 1, justifyContent: 'center' },
    verticalDivider: { width: 1, height: 20 },
    infoText: { marginLeft: 8, fontWeight: '600', fontSize: 13 },

    // Docs
    docSection: { marginTop: 5 },
    sectionLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    docList: { gap: 10 },
    docThumb: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', position: 'relative' },
    docImg: { width: 70, height: 45 },
    docIconOverlay: {
        position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center', alignItems: 'center', opacity: 0
    },

    // Footer
    cardFooter: {
        flexDirection: 'row',
        padding: 12,
        borderTopWidth: 1,
        gap: 12,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 14,
    },
    acceptBtn: { backgroundColor: 'transparent', borderWidth: 1 },
    rejectBtn: { backgroundColor: 'transparent', borderWidth: 1 },
    btnText: { fontWeight: '700', fontSize: 14 },
});

export default TripRequestsScreen;
