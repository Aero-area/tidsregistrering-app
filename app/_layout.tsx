import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppStoreProvider, useAppStore } from "@/hooks/useAppStore";
import LoginScreen from "@/components/LoginScreen";
import { View, ActivityIndicator, AppState, Text, Platform } from "react-native";
import { OfflineQueue } from "@/lib/offlineQueue";
import { SupabaseService } from "@/services/supabaseService";
import { AppErrorBoundary } from "@/components/AppErrorBoundary";
import { envOk } from "@/lib/supabase";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isLoading, isAuthenticated, login, signUp } = useAppStore();

  useEffect(() => {
    let networkUnsubscribe: (() => void) | null = null;
    let appStateSubscription: any = null;

    if (isAuthenticated) {
      // Start network listener for offline queue
      networkUnsubscribe = OfflineQueue.startNetworkListener();
      
      // Listen for app state changes to trigger auto-backup
      const handleAppStateChange = (nextAppState: string) => {
        if (nextAppState === 'active') {
          // App came to foreground, check for auto-backup
          SupabaseService.checkAndPerformAutoBackup();
          // Also process any queued operations
          OfflineQueue.processQueue();
        }
      };
      
      appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
      
      // Initial auto-backup check
      SupabaseService.checkAndPerformAutoBackup();
    }

    return () => {
      if (networkUnsubscribe) {
        networkUnsubscribe();
      }
      if (appStateSubscription) {
        appStateSubscription.remove();
      }
    };
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#018d36' }}>
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLogin={login} onSignUp={signUp} />;
  }

  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: "modal" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  if (!envOk) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', textAlign: 'center', paddingHorizontal: 24 }}>
          Supabase environment variables are not set. Please configure them to continue.
        </Text>
      </View>
    );
  }

  return (
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppStoreProvider>
          <GestureHandlerRootView style={{ flex: 1, minHeight: Platform.OS === 'web' ? '100vh' : 'auto' }} testID="ts-root">
            <RootLayoutNav />
          </GestureHandlerRootView>
        </AppStoreProvider>
      </QueryClientProvider>
    </AppErrorBoundary>
  );
}