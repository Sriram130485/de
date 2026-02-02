import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { THEMES } from '../constants/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [themeName, setThemeName] = useState('dark');
    const [theme, setTheme] = useState(THEMES.dark);

    useEffect(() => {
        const loadTheme = async () => {
            try {
                const savedTheme = await AsyncStorage.getItem('theme');
                if (savedTheme) {
                    setThemeName(savedTheme);
                    setTheme(THEMES[savedTheme]);
                }
            } catch (error) {
                console.log("Failed to load theme:", error);
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        try {
            const newThemeName = themeName === 'light' ? 'dark' : 'light';
            setThemeName(newThemeName);
            setTheme(THEMES[newThemeName]);
            await AsyncStorage.setItem('theme', newThemeName);
        } catch (error) {
            console.log("Failed to save theme:", error);
        }
    };

    return (
        <ThemeContext.Provider value={{ theme, themeName, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);
