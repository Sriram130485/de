import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function AnimatedSplashScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.8)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true,
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
            })
        ]).start();
    }, [fadeAnim, scaleAnim]);

    return (
        <LinearGradient
            colors={['#0F2027', '#203A43', '#2C5364']}
            style={styles.container}
        >
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    <Animated.View style={[
                        styles.logoPlaceholder,
                        {
                            opacity: fadeAnim,
                            transform: [{ scale: scaleAnim }]
                        }
                    ]}>
                        <Text style={styles.logoText}>D</Text>
                    </Animated.View>

                    <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
                        DriivEra
                    </Animated.Text>

                    <View style={styles.footer}>
                        <Text style={styles.loadingText}>Initializing secure connection...</Text>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000', // Fallback
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 25,
        backgroundColor: '#1A1A1A',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#333',
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 10,
    },
    logoText: {
        color: '#D4AF37',
        fontSize: 48,
        fontWeight: '300',
        fontFamily: Platform.OS === 'ios' ? 'Didot' : 'serif',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 10,
        letterSpacing: 2,
    },
    footer: {
        position: 'absolute',
        bottom: 50,
    },
    loadingText: {
        color: '#A0AEC0',
        fontSize: 14,
        letterSpacing: 1,
    }
});
