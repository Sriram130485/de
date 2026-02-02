import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SIZES } from '../constants/theme';
import ProfileIcon from './ProfileIcon';
import { AuthContext } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Navbar = ({ onMenuPress, onProfilePress }) => {
    const { user } = useContext(AuthContext);
    const { theme, themeName } = useTheme();

    return (
        <SafeAreaView edges={['top']} style={styles.safeArea}>
            <View style={styles.container}>
                {/* Left Slot: Menu / Logo */}
                <TouchableOpacity
                    style={[
                        styles.iconButton,
                        { backgroundColor: themeName === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.8)' }
                    ]}
                    onPress={onMenuPress}
                >
                    <Ionicons name="menu" size={28} color={theme.textPrimary} />
                </TouchableOpacity>

                {/* Right Slot: Profile */}
                <ProfileIcon
                    onPress={onProfilePress}
                    uri={user?.profileImage || user?.profilePicture} // Pass dynamic uri
                />
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: 'transparent',
    },
    container: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SIZES.padding,
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
    iconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        // Shadow for better visibility on map
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
});

export default Navbar;
