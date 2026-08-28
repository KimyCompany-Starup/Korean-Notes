import React, { useEffect } from 'react';
import { Alert, Linking, useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';

const GITHUB_USER = "KimyCompany-Starup"; 
const GITHUB_REPO = "Korean-Notes";          
const UPDATE_URL = `https://api.github.com/repos/${GITHUB_USER}/${GITHUB_REPO}/releases/latest`;
const IGNORED_VERSION_KEY = '@ignored_update_version_korean_notes';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    SplashScreen.hideAsync();
    const timer = setTimeout(() => {
      checkUpdates();
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const checkUpdates = async () => {
    try {
      const response = await fetch(UPDATE_URL, { 
        headers: { 'Cache-Control': 'no-cache' } 
      });
      const data = await response.json();
      if (!data || !data.tag_name) return;

      const latestVersion = data.tag_name.replace('v', '').trim(); 
      const currentVersion = (Constants.expoConfig?.version || Constants.nativeAppVersion || "0.0.0").trim();

      // Si la versión de GitHub es diferente a la instalada
      if (latestVersion !== currentVersion) {
        
        // Verificamos si el usuario ya decidió ignorar esta versión específica previamente
        const ignoredVersion = await AsyncStorage.getItem(IGNORED_VERSION_KEY);
        if (ignoredVersion === latestVersion) {
          return;
        }

        Alert.alert(
          "🚀 Actualización Disponible",
          `Hay una nueva versión (${latestVersion}) de Korean Notes lista para descargar.`,
          [
            { 
              text: "Más tarde", 
              style: "cancel",
              onPress: async () => {
                await AsyncStorage.setItem(IGNORED_VERSION_KEY, latestVersion);
              }
            },
            { 
              text: "Descargar", 
              onPress: () => {
                const apkAsset = data.assets?.find((asset: any) => asset.name.endsWith('.apk'));
                Linking.openURL(apkAsset ? apkAsset.browser_download_url : data.html_url);
              } 
            }
          ]
        );
      }
    } catch (error) {
      console.error("Error al verificar actualización:", error);
    }
  };

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}