import { createContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { deleteAccount as deleteAccountService } from '../services/api';


export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);


    const loadUser = async () => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                setLoading(false);
                return;
            }

            const res = await api.get('/auth/me');
            if (res.data.success) {
                setUser(res.data.user);
            } else {
                setUser(null);
            }
        } catch (error) {
            console.log("Load user error:", error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };


    const logout = async () => {
        await AsyncStorage.removeItem('token');
        setUser(null);
    };

    const updateUserProfile = async (data) => {
        try {
            const res = await api.put('/auth/update-profile', data);

            if (res.data?.user) {
                setUser(res.data.user); // important
            }

            return { success: true };
        } catch (error) {
            console.log("Update profile error:", error);
            return { success: false };
        }
    };

    const deleteAccount = async () => {
        try {
            const res = await deleteAccountService();
            if (res) {
                await logout();
                return { success: true };
            }
        } catch (error) {
            console.log("Delete account error:", error);
            return { success: false, error: error };
        }
    };


    useEffect(() => {
        loadUser();
    }, []);


    return (
        <AuthContext.Provider value={{ user, setUser, logout, loading, loadUser, updateUserProfile, deleteAccount }}>
            {children}
        </AuthContext.Provider>
    );
};