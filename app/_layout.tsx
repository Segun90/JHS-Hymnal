import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StatusBar, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts as useInter, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { useFonts as useNoto, NotoSerif_400Regular, NotoSerif_400Regular_Italic, NotoSerif_600SemiBold, NotoSerif_700Bold } from '@expo-google-fonts/noto-serif';
import { useFonts as usePoppins, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { ThemeProvider } from '@/theme/ThemeContext';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useLibraryStore } from '@/stores/useLibraryStore';
import { useDevotionsStore } from '@/stores/useDevotionsStore';
import { initDatabases } from '@/db/database';
import { syncRemindersFromStore, scheduleSnooze, sendTestNotification, ACTION_READ_NOW, ACTION_REMIND_15, ACTION_REMIND_30 } from '@/services/notifications';
import { useKeepAwakeSetting } from '@/hooks/useKeepAwakeSetting';
import { light, gradients } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { LogoMark } from '@/components/LogoMark';
import { DailyInspirationScreen } from '@/components/DailyInspirationScreen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const handledNotificationRef = useRef<string | null>(null);
  const [interLoaded] = useInter({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [notoLoaded] = useNoto({ NotoSerif_400Regular, NotoSerif_400Regular_Italic, NotoSerif_600SemiBold, NotoSerif_700Bold });
  const [poppinsLoaded] = usePoppins({ Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold });
  const [dbReady, setDbReady] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [inspirationDone, setInspirationDone] = useState(false);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateLibrary = useLibraryStore((s) => s.hydrate);
  const hydrateDevotions = useDevotionsStore((s) => s.hydrate);
  const themeMode = useSettingsStore((s) => s.themeMode);

  const lastNotificationResponse = Notifications.useLastNotificationResponse();
  useKeepAwakeSetting();

  useEffect(() => {
    (globalThis as any).__sendTestNotification = sendTestNotification;
    const timer = setTimeout(() => { sendTestNotification().catch(() => {}); }, 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!dbReady || !lastNotificationResponse) return;
    const response = lastNotificationResponse;
    const requestId = response.notification.request.identifier;
    const key = `${requestId}:${response.actionIdentifier}`;
    if (handledNotificationRef.current === key) return;
    handledNotificationRef.current = key;
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    const action = response.actionIdentifier;
    if (action === ACTION_REMIND_15) {
      scheduleSnooze(15).catch(() => {});
      return;
    }
    if (action === ACTION_REMIND_30) {
      scheduleSnooze(30).catch(() => {});
      return;
    }
    if (action === Notifications.DEFAULT_ACTION_IDENTIFIER || action === ACTION_READ_NOW) {
      const screen = data?.screen;
      if (typeof screen === 'string' && screen) {
        router.push(screen);
      }
    }
  }, [lastNotificationResponse, dbReady]);

  useEffect(() => {
    (async () => {
      setDbError(false);
      try {
        await initDatabases();
        await Promise.all([hydrateSettings(), hydrateLibrary(), hydrateDevotions()]);
        await Notifications.cancelAllScheduledNotificationsAsync();
        await syncRemindersFromStore().catch(() => {});
      } catch (e) {
        console.error('Init error:', e);
        setDbError(true);
        setDbReady(false);
        return;
      } finally {
        await SplashScreen.hideAsync();
      }
      setDbReady(true);
    })();
  }, [retryKey]);

  if (dbError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: light.background, padding: 32 }}>
        <LogoMark size={96} />
        <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 17, color: light.text, marginTop: 20 }}>
          Something went wrong
        </Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: light.textSecondary, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
          We couldn't load the Bible data. This can happen when storage is full or the app was interrupted during setup.
        </Text>
        <TouchableOpacity
          onPress={() => setRetryKey((k) => k + 1)}
          style={{ marginTop: 24, backgroundColor: light.primary, borderRadius: 12, paddingHorizontal: 28, paddingVertical: 12 }}
        >
          <Text style={{ fontFamily: 'Poppins_600SemiBold', fontSize: 14, color: light.onPrimary }}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fontsLoaded = interLoaded && notoLoaded && poppinsLoaded;
  const showLoading = !fontsLoaded || !dbReady;
  const showInspiration = !showLoading && !inspirationDone;

  if (showLoading) {
    return (
      <LinearGradient colors={gradients.hero} style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <LogoMark size={120} />
        <Text style={{ fontFamily: 'NotoSerif_700Bold', fontSize: 30, color: '#FFFFFF', marginTop: 12 }}>
          J.H.S
        </Text>
        <Text style={{ fontFamily: 'Poppins_400Regular', fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', maxWidth: 220, marginTop: 12, lineHeight: 20 }}>
          Joint Heirs of Salvation{'\n'}International Crusade Ministry
        </Text>
      </LinearGradient>
    );
  }

  if (showInspiration) {
    return (
      <DailyInspirationScreen onComplete={() => setInspirationDone(true)} />
    );
  }

  return (
    <ThemeProvider>
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade_from_bottom' }}>
        <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
        <Stack.Screen name="bible/[bookId]" />
        <Stack.Screen name="bible/[bookId]/[chapter]" />
        <Stack.Screen name="hymns/section/[sectionId]" />
        <Stack.Screen name="hymns/[number]" />
        <Stack.Screen name="hymns/indexes" />
        <Stack.Screen name="search" />
        <Stack.Screen name="library" />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="reminders" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="upcoming/[id]" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="about" />
        <Stack.Screen name="devotional/welcome" />
        <Stack.Screen name="devotional/[day]" />
        <Stack.Screen name="devotional/calendar" />
        <Stack.Screen name="devotional/complete" />
      </Stack>
    </ThemeProvider>
  );
}
