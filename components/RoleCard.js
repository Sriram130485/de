import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SIZES } from '../constants/theme';

const RoleCard = ({ title, description, iconName, onPress, imageSource }) => {
    const { theme, themeName } = useTheme();

    // Dynamic Styling based on theme mode
    const isDark = themeName === 'dark';

    const cardBackgroundColor = isDark ? 'rgba(255,255,255,0.05)' : '#F9F9F9';
    const borderColor = isDark ? 'rgba(255,255,255,0.1)' : theme.border;
    const titleColor = isDark ? theme.textPrimary : '#0B1A0E'; // Dark Forest Green or Black
    const descriptionColor = theme.textSecondary;
    const faintIconColor = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: cardBackgroundColor,
                    borderColor: borderColor
                }
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            {/* Left Image/Icon Area */}
            <View style={styles.imageContainer}>
                {imageSource ? (
                    <Image source={imageSource} style={styles.image} resizeMode="contain" />
                ) : (
                    <View style={[styles.iconPlaceholder, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <Ionicons name={iconName || "person"} size={32} color={theme.primary} />
                    </View>
                )}
            </View>

            {/* Middle Text Area */}
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: titleColor }]}>{title}</Text>
                <Text style={[styles.description, { color: descriptionColor }]}>{description}</Text>
            </View>

            {/* Right Chevron & Faint Icon */}
            <View style={styles.rightContainer}>
                <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
                {/* Faint Background Icon */}
                <View style={[styles.faintIcon, { opacity: isDark ? 1 : 0.5 }]}>
                    <Ionicons name={iconName || "ellipse"} size={60} color={faintIconColor} />
                </View>
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SIZES.padding,
        borderRadius: 16,
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
        height: 100,
    },
    imageContainer: {
        marginRight: 16,
    },
    image: {
        width: 50,
        height: 50,
    },
    iconPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
    },
    rightContainer: {
        justifyContent: 'center',
        alignItems: 'flex-end',
    },
    faintIcon: {
        position: 'absolute',
        right: -10,
        bottom: -20,
        zIndex: -1,
    }
});

export default RoleCard;
