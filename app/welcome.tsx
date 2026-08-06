import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, StatusBar, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTheme } from '@/theme/ThemeContext';
import { gradients } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { WELCOME_VERSES } from '@/data/welcomeVerses';
import { LogoMark } from '@/components/LogoMark';
import { useRouter } from 'expo-router';


const { width } = Dimensions.get('window');
const VERSE_INTERVAL = 6000;
const FADE_DURATION = 800;
const AUTO_NAV_DELAY = 30000;

interface WelcomeScreenProps {
  onComplete?: () => void;
}

export default function WelcomeScreen({ onComplete }: WelcomeScreenProps) {
  const insets = useSafeAreaInsets();
  const setHasSeenWelcome = useSettingsStore((s) => s.setHasSeenWelcome);
  const { isDark } = useTheme();
  const router = useRouter();

  const [verseIndex, setVerseIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const navigating = useRef(false);

  const currentVerse = WELCOME_VERSES[verseIndex % WELCOME_VERSES.length];

  const complete = useCallback(() => {
    if (navigating.current) return;
    navigating.current = true;
    setHasSeenWelcome(true);
    if (onComplete) {
      onComplete();
    } else {
      router.replace('/(tabs)');
    }
  }, [onComplete, setHasSeenWelcome, router]);

  useEffect(() => {
    // Preload background image
    Image.prefetch(Image.resolveAssetSource(require('../assets/images/welcome-bg.png')).uri);
  }, []);

  useEffect(() => {
    const autoTimer = setTimeout(complete, AUTO_NAV_DELAY);
    return () => clearTimeout(autoTimer);
  }, [complete]);

  useEffect(() => {
    const cycle = () => {
      if (navigating.current) return;
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: FADE_DURATION, useNativeDriver: true }),
        Animated.delay(VERSE_INTERVAL - (FADE_DURATION * 2)),
        Animated.timing(fadeAnim, { toValue: 0, duration: FADE_DURATION, useNativeDriver: true }),
      ]).start((result) => {
        if (result.finished && !navigating.current) {
          setVerseIndex((i) => i + 1);
        }
      });
    };

    fadeAnim.setValue(0);
    const timer = setTimeout(cycle, 100);
    return () => clearTimeout(timer);
  }, [verseIndex, fadeAnim]);

  // Brand gradient overlay ensures white text stays readable over bright imagery
  const overlayOpacity = isDark ? 0.6 : 0.5;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fixed Background Image */}
      <Image
        source={require('../assets/images/welcome-bg.png')}
        style={styles.background}
        resizeMode="cover"
      />

      {/* Brand Gradient Overlay */}
      <LinearGradient
        colors={gradients.hero}
        style={[styles.overlay, { opacity: overlayOpacity }]}
      />

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 48, paddingBottom: insets.bottom + 40 }]}>
        
        {/* Top Logo Area */}
        <View style={styles.topSection}>
          <LogoMark size={64} />
        </View>

        {/* Center Scripture Area */}
        <View style={styles.verseSection}>
          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center', width: '100%' }}>
            <Text style={styles.verseText}>
              {currentVerse.text}
            </Text>
            <Text style={styles.referenceText}>
              {currentVerse.reference} (KJV)
            </Text>
          </Animated.View>
        </View>

        {/* Bottom Navigation Hint */}
        <View style={styles.bottomSection}>
          <Text style={styles.tapHint}>
            Tap anywhere to continue
          </Text>
        </View>
      </View>

      {/* Full Screen Tap Area */}
      <View
        style={StyleSheet.absoluteFill}
        onTouchStart={complete}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: width * 0.8,
    alignSelf: 'center',
  },
  verseText: {
    fontFamily: 'NotoSerif_400Regular',
    fontSize: 24,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 38,
    letterSpacing: 0.3,
  },
  referenceText: {
    fontFamily: 'Poppins_500Medium',
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 0.5,
  },
  bottomSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 8,
  },
  tapHint: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#FFFFFF',
    opacity: 0.4,
    textAlign: 'center',
    letterSpacing: 0.8,
  },
});
