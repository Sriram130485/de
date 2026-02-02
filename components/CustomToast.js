import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/theme';

const { width } = Dimensions.get('window');

// Toast Types Configuration
const TOAST_TYPES = {
    success: {
        backgroundColor: '#fff', // bright green
        icon: 'checkmark-circle',
        color: '#065F46' // dark green text
    },
    error: {
        backgroundColor: '#fff', // bright red
        icon: 'alert-circle',
        color: '#991B1B' // dark red text
    },
    info: {
        backgroundColor: '#fff', // bright blue
        icon: 'information-circle',
        color: '#1E3A8A' // dark blue text
    },
    warning: {
        backgroundColor: '#fff', // amber
        icon: 'warning',
        color: '#92400E' // dark amber text
    }
};

const CustomToast = ({ visible, message, type = 'info', onHide }) => {
    const insets = useSafeAreaInsets();
    const translateY = useRef(new Animated.Value(-150)).current;

    const config = TOAST_TYPES[type] || TOAST_TYPES.info;

    useEffect(() => {
        if (visible) {
            // Animate In: Slide down to top + insets
            Animated.spring(translateY, {
                toValue: insets.top + 10,
                useNativeDriver: true,
                friction: 8,
                tension: 40
            }).start();

            // Auto Hide after 3 seconds
            const timer = setTimeout(() => {
                hideToast();
            }, 3000);

            return () => clearTimeout(timer);
        } else {
            hideToast();
        }
    }, [visible]);

    const hideToast = () => {
        Animated.timing(translateY, {
            toValue: -150,
            duration: 300,
            useNativeDriver: true
        }).start(() => {
            if (visible && onHide) onHide();
        });
    };

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY }],
                    backgroundColor: config.backgroundColor,
                }
            ]}
        >
            <View style={styles.content}>
                <Ionicons name={config.icon} size={24} color={config.color} />
                <Text style={[styles.message, { color: config.color }]}>{message}</Text>
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 20,
        right: 20,
        borderRadius: 50, // Pill shape
        paddingVertical: 12,
        paddingHorizontal: 20,
        zIndex: 9999,
        // Shadow
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 4,
        },
        shadowOpacity: 0.15,
        shadowRadius: 10,
        elevation: 10,
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center', // Center content if message is short
        gap: 10
    },
    message: {
        fontSize: 15,
        fontWeight: '600',
        flexShrink: 1, // Allow text wrapping
    }
});

export default CustomToast;
