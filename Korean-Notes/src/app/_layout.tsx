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

  const customDarkTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: '#000000',
      card: '#121212',
    },
  };

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

      // Normalizamos la versión de GitHub (ej: "V1.0" o "v1.0.0" -> "1.0" o "1.0.0")
      const latestVersion = data.tag_name.toLowerCase().replace('v', '').trim(); 
      
      // Normalizamos la versión actual de la app configurada en el app.json
      const currentVersion = (Constants.expoConfig?.version || Constants.nativeAppVersion || "0.0.0").toLowerCase().trim();

      console.log(`Versión actual: "${currentVersion}" | Versión en GitHub: "${latestVersion}"`);

      // SOLO si son diferentes, procedemos a validar y mostrar la alerta
      if (latestVersion !== currentVersion) {
        
        // Verificamos si el usuario ya decidió ignorar esta versión específica
        const ignoredVersion = await AsyncStorage.getItem(IGNORED_VERSION_KEY);
        if (ignoredVersion === latestVersion) {
          return;
        }

        Alert.alert(
          "🚀 Actualización Disponible",
          `Hay una nueva versión (${data.tag_name}) de Korean Notes lista para descargar.`,
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
    <ThemeProvider value={customDarkTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}