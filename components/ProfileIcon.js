import React from 'react';
import { View, Image, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../constants/theme';

const ProfileIcon = ({ uri, size = 44, onPress }) => {
    return (
        <Pressable onPress={onPress} style={({ pressed }) => [
            styles.container,
            { width: size, height: size, borderRadius: size / 2 },
            pressed && styles.pressed
        ]}>
            <View style={[styles.borderContainer, { borderRadius: size / 2 }]}>
                <Image
                    source={{ uri: uri || 'https://randomuser.me/api/portraits/men/32.jpg' }}
                    style={styles.image}
                    resizeMode="cover"
                />
            </View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    borderContainer: {
        flex: 1,
        borderWidth: 2,
        borderColor: COLORS.white,
        backgroundColor: COLORS.secondary, // Fallback color
        overflow: 'hidden',
    },
    image: {
        width: '100%',
        height: '100%',
    },
    pressed: {
        opacity: 0.8,
    }
});

export default ProfileIcon;
