import React, { useState, useEffect, useCallback } from 'react';
import { View } from 'react-native';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import RootNavigator from './navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import AnimatedSplashScreen from './screens/AnimatedSplashScreen';

// Keep the native splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const ThemedStatusBar = () => {
  const { theme, themeName } = useTheme();
  return <StatusBar style={themeName === 'dark' ? 'light' : 'dark'} backgroundColor={theme.background} />;
};
export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  useEffect(() => {
    async function prepare() {
      try {
        // Pre-load fonts, make any API calls you need to do here
        await new Promise(resolve => setTimeout(resolve, 1500)); // Minimum showing time for native splash
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the native splash screen to hide immediately!
      // We do this as soon as the app layout is processed.
      await SplashScreen.hideAsync();

      // Now start a timer for our custom splash animation
      setTimeout(() => {
        setShowCustomSplash(false);
      }, 2000); // Show custom animated splash for 2 more seconds
    }
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <ThemeProvider>
          <ToastProvider>
            <AuthProvider>
              <ThemedStatusBar />
              {showCustomSplash ? (
                <AnimatedSplashScreen />
              ) : (
                <RootNavigator />
              )}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </View>
    </SafeAreaProvider>
  );
}