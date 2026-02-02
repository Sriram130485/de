import React, { useState } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StatusBar,
    Linking,
    Platform,
    LayoutAnimation,
    UIManager
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SIZES } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

const faqs = [
    {
        id: 1,
        question: "How do I book a ride?",
        answer: "To book a ride, go to the Home screen, enter your destination, select your preferred ride type, and confirm your booking. You'll be connected with a nearby driver instantly."
    },
    {
        id: 2,
        question: "How can I cancel my trip?",
        answer: "You can cancel your trip by tapping the 'Cancel' button on the trip details screen. Please note that cancellation fees may apply depending on when you cancel."
    },
    {
        id: 3,
        question: "Is my payment information secure?",
        answer: "Yes, we use industry-standard encryption to protect your payment details. We do not store your full credit card information on our servers."
    },
    {
        id: 4,
        question: "How do I contact my driver?",
        answer: "Once a driver is assigned, you'll see a phone icon and a message icon on the trip screen. You can use these to contact your driver directly."
    },
    {
        id: 5,
        question: "What if I lose an item in the car?",
        answer: "If you lost an item, please go to 'Your Trips', select the trip, and tap on 'I lost an item'. We will help you connect with the driver."
    }
];

const contactOptions = [
    {
        id: 'call',
        title: 'Customer Care',
        subtitle: '+91 1800-123-4567',
        icon: 'call-outline',
        action: () => Linking.openURL('tel:18001234567')
    },
    {
        id: 'email',
        title: 'Send us an Email',
        subtitle: 'support@driivera.com',
        icon: 'mail-outline',
        action: () => Linking.openURL('mailto:support@driivera.com')
    }
];

export default function HelpSupportScreen() {
    const navigation = useNavigation();
    const { theme, themeName } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedId, setExpandedId] = useState(null);

    const toggleExpand = (id) => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpandedId(expandedId === id ? null : id);
    };

    const filteredFaqs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: theme.background }]}>
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
            >
                <Ionicons name="arrow-back" size={24} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: theme.textPrimary }]}>Help & Support</Text>
        </View>
    );

    const renderSearchBar = () => (
        <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
            <Ionicons name="search" size={20} color={theme.textSecondary} />
            <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search for help..."
                placeholderTextColor={theme.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar
                barStyle={themeName === 'dark' ? 'light-content' : 'dark-content'}
                backgroundColor={theme.background}
            />

            {renderHeader()}

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
                    How can we help you?
                </Text>

                {renderSearchBar()}

                {/* Contact Options */}
                <View style={styles.contactSection}>
                    {contactOptions.map((option) => (
                        <TouchableOpacity
                            key={option.id}
                            style={[
                                styles.contactCard,
                                { backgroundColor: theme.card, borderColor: theme.border }
                            ]}
                            onPress={option.action}
                        >
                            <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                                <Ionicons name={option.icon} size={24} color={theme.primary} />
                            </View>
                            <View style={styles.contactInfo}>
                                <Text style={[styles.contactTitle, { color: theme.textPrimary }]}>{option.title}</Text>
                                <Text style={[styles.contactSubtitle, { color: theme.textSecondary }]}>{option.subtitle}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                {/* FAQ Section */}
                <Text style={[styles.sectionTitle, { color: theme.textPrimary, marginTop: 25 }]}>
                    Frequently Asked Questions
                </Text>

                <View style={styles.faqList}>
                    {filteredFaqs.map((item) => (
                        <View
                            key={item.id}
                            style={[
                                styles.faqItem,
                                { backgroundColor: theme.card, borderColor: theme.border }
                            ]}
                        >
                            <TouchableOpacity
                                style={styles.faqHeader}
                                onPress={() => toggleExpand(item.id)}
                                activeOpacity={0.7}
                            >
                                <Text style={[styles.faqQuestion, { color: theme.textPrimary }]}>{item.question}</Text>
                                <Ionicons
                                    name={expandedId === item.id ? "remove" : "add"}
                                    size={20}
                                    color={theme.primary}
                                />
                            </TouchableOpacity>
                            {expandedId === item.id && (
                                <View style={styles.faqAnswerContainer}>
                                    <Text style={[styles.faqAnswer, { color: theme.textSecondary }]}>{item.answer}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                    {filteredFaqs.length === 0 && (
                        <Text style={[styles.noResultText, { color: theme.textSecondary }]}>
                            No results found for "{searchQuery}"
                        </Text>
                    )}
                </View>

                {/* Report Area */}
                <View style={[styles.reportContainer, { backgroundColor: theme.card }]}>
                    <Text style={[styles.reportTitle, { color: theme.textPrimary }]}>Still need help?</Text>
                    <Text style={[styles.reportText, { color: theme.textSecondary }]}>
                        If you cannot find the answer to your question in our FAQ, you can always contact us. We will answer to you shortly!
                    </Text>
                    <TouchableOpacity
                        style={[styles.reportButton, { backgroundColor: theme.primary }]}
                        onPress={() => Linking.openURL('mailto:support@driivera.com?subject=Report%20Issue')}
                    >
                        <Text style={styles.reportButtonText}>Report an Issue</Text>
                    </TouchableOpacity>
                </View>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 15,
        justifyContent: 'center',
    },
    backButton: {
        position: 'absolute',
        left: SIZES.padding,
        zIndex: 1,
        padding: 5,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    scrollContent: {
        padding: SIZES.padding,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 15,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        height: 50,
        borderRadius: 12,
        marginBottom: 25,
    },
    searchInput: {
        flex: 1,
        marginLeft: 10,
        fontSize: 16,
        paddingVertical: 10,
    },
    contactSection: {
        gap: 15,
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        borderRadius: 16,
        borderWidth: 1,
    },
    iconContainer: {
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    contactInfo: {
        flex: 1,
    },
    contactTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    contactSubtitle: {
        fontSize: 13,
    },
    faqList: {
        gap: 12,
    },
    faqItem: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
    },
    faqHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    faqQuestion: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        paddingRight: 10,
    },
    faqAnswerContainer: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    faqAnswer: {
        fontSize: 14,
        lineHeight: 22,
    },
    noResultText: {
        textAlign: 'center',
        marginTop: 20,
        fontSize: 15,
        fontStyle: 'italic',
    },
    reportContainer: {
        marginTop: 35,
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
    },
    reportTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    reportText: {
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 20,
    },
    reportButton: {
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    reportButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    }
});
