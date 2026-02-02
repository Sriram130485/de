export const THEMES = {
    light: {
        primary: '#e87523ff',
        secondary: '#F5F5F5', // surface
        background: '#FFFFFF',
        textPrimary: '#1A1A1A',
        textSecondary: '#666666',
        textLight: '#E5E7EB',
        border: '#E0E0E0',
        danger: '#EF4444',
        accent: '#3B82F6',
        success: '#10B981',
        card: 'rgba(0, 0, 0, 0.05)', // Glassmorphism Light
        gradient: ['#FFFFFF', '#F0F2F5'],
        buttonGradient: ['#FF7E5F', '#FEB47B'],
        statusBar: 'dark',
    },
    dark: {
        primary: '#e87523ff',
        secondary: '#252B3B', // surface
        background: '#0F2027',
        textPrimary: '#FFFFFF',
        textSecondary: '#A0AEC0',
        textLight: '#E5E7EB',
        border: 'rgba(255, 255, 255, 0.2)',
        danger: '#EF4444',
        accent: '#3B82F6',
        success: '#10B981',
        card: 'rgba(255, 255, 255, 0.1)', // Glassmorphism Dark
        gradient: ['#0F2027', '#203A43', '#2C5364'],
        buttonGradient: ['#FF7E5F', '#FEB47B'],
        statusBar: 'light',
    }
};

// Deprecated: Backwards compatibility until full refactor, aliases to Dark theme by default just in case
export const COLORS = {
    primary: '#e87523ff',
    secondary: '#252B3B',
    background: '#0F2027',
    white: '#FFFFFF',
    textPrimary: '#FFFFFF',
    textSecondary: '#A0AEC0',
    textLight: '#E5E7EB',
    danger: '#EF4444',
    accent: '#3B82F6',
    success: '#10B981',
};

export const SIZES = {
    radius: 12,
    padding: 16,
};
