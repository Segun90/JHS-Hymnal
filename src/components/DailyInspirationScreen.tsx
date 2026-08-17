import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, Animated, StyleSheet, Dimensions, StatusBar, Image, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { gradients } from '@/theme/tokens';
import { LinearGradient } from 'expo-linear-gradient';
import { getVerse, getBook } from '@/db/bible';

const { width } = Dimensions.get('window');
const VERSE_INTERVAL = 6000;
const FADE_DURATION = 800;
const SLIDE_DURATION = 800;

interface DailyInspirationScreenProps {
  onComplete: () => void;
}

const INSPIRATIONAL_VERSES = [
  { bookId: 19, chapter: 150, verse: 6, encouragement: 'Take a moment to praise Him today.' },
  { bookId: 19, chapter: 100, verse: 2, encouragement: 'Find joy in serving the Lord.' },
  { bookId: 19, chapter: 96, verse: 1, encouragement: 'Sing a new song of praise.' },
  { bookId: 43, chapter: 4, verse: 24, encouragement: 'Worship in spirit and in truth.' },
  { bookId: 19, chapter: 34, verse: 1, encouragement: 'Let His praise be continually in your mouth.' },
  { bookId: 49, chapter: 5, verse: 19, encouragement: 'Make melody in your heart.' },
  { bookId: 51, chapter: 3, verse: 16, encouragement: 'Let His word dwell in you richly.' },
  { bookId: 45, chapter: 12, verse: 1, encouragement: 'Offer your life as a living sacrifice.' },
  { bookId: 19, chapter: 63, verse: 3, encouragement: 'His lovingkindness is better than life.' },
  { bookId: 19, chapter: 103, verse: 1, encouragement: 'Bless the Lord with all your soul.' },
  { bookId: 58, chapter: 13, verse: 15, encouragement: 'Offer the sacrifice of praise continually.' },
];

export function DailyInspirationScreen({ onComplete }: DailyInspirationScreenProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  const fadeBgAnim = useRef(new Animated.Value(0)).current;
  const slideButtonAnim = useRef(new Animated.Value(50)).current;
  const fadeButtonAnim = useRef(new Animated.Value(0)).current;
  const textFadeAnim = useRef(new Animated.Value(0)).current;
  
  const navigating = useRef(false);
  const [verseIndex, setVerseIndex] = useState(0);
  const [loadedVerses, setLoadedVerses] = useState<{ text: string, reference: string, encouragement: string }[]>([]);

  useEffect(() => {
    try {
      // Load all verses at once synchronously from local SQLite
      const verses = INSPIRATIONAL_VERSES.map(info => {
        const verseData = getVerse(info.bookId, info.chapter, info.verse);
        const bookData = getBook(info.bookId);
        if (verseData && bookData) {
          return {
            text: verseData.text,
            reference: `${bookData.name} ${info.chapter}:${info.verse}`,
            encouragement: info.encouragement,
          };
        }
        return null;
      }).filter((v): v is NonNullable<typeof v> => v !== null);

      // Shuffle array to make it dynamic
      for (let i = verses.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [verses[i], verses[j]] = [verses[j], verses[i]];
      }

      setLoadedVerses(verses);
    } catch (e) {
      console.error('Failed to load inspiration verses', e);
    }
  }, []);

  // Screen entrance animation
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeBgAnim, { toValue: 1, duration: FADE_DURATION, useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(slideButtonAnim, { toValue: 0, duration: SLIDE_DURATION, useNativeDriver: true }),
        Animated.timing(fadeButtonAnim, { toValue: 1, duration: SLIDE_DURATION, useNativeDriver: true }),
      ])
    ]).start();
  }, [fadeBgAnim, slideButtonAnim, fadeButtonAnim]);

  // Verse cycling animation
  useEffect(() => {
    if (loadedVerses.length === 0) return;
    
    const cycle = () => {
      if (navigating.current) return;
      Animated.sequence([
        Animated.timing(textFadeAnim, { toValue: 1, duration: FADE_DURATION, useNativeDriver: true }),
        Animated.delay(VERSE_INTERVAL - (FADE_DURATION * 2)),
        Animated.timing(textFadeAnim, { toValue: 0, duration: FADE_DURATION, useNativeDriver: true }),
      ]).start((result) => {
        if (result.finished && !navigating.current) {
          setVerseIndex((i) => (i + 1) % loadedVerses.length);
        }
      });
    };

    textFadeAnim.setValue(0);
    const timer = setTimeout(cycle, 100);
    return () => clearTimeout(timer);
  }, [verseIndex, textFadeAnim, loadedVerses.length]);

  const handleComplete = () => {
    navigating.current = true;
    onComplete();
  };

  const overlayOpacity = isDark ? 0.6 : 0.5;
  const currentData = loadedVerses.length > 0 ? loadedVerses[verseIndex] : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Fixed Background Image with fade-in */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fadeBgAnim }]}>
        <Image
          source={require('../../assets/images/welcome-bg.png')}
          style={styles.background}
          resizeMode="cover"
        />
        {/* Brand Gradient Overlay */}
        <LinearGradient
          colors={gradients.hero}
          style={[styles.overlay, { opacity: overlayOpacity }]}
        />
      </Animated.View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 40 }]}>
        
        {/* Lower Scripture Area to avoid background logo */}
        <View style={styles.verseSection}>
          <Animated.View style={{ opacity: textFadeAnim, alignItems: 'center', width: '100%' }}>
            {currentData ? (
              <>
                <Text style={styles.verseText}>
                  {currentData.text}
                </Text>
                <Text style={styles.referenceText}>
                  {currentData.reference} (KJV)
                </Text>
                {currentData.encouragement && (
                  <Text style={styles.encouragementText}>
                    {currentData.encouragement}
                  </Text>
                )}
              </>
            ) : null}
          </Animated.View>
        </View>

        {/* Bottom Navigation Button */}
        <View style={styles.bottomSection}>
          <Animated.View style={{ 
            opacity: fadeButtonAnim, 
            transform: [{ translateY: slideButtonAnim }] 
          }}>
            <TouchableOpacity
              onPress={handleComplete}
              style={styles.continueButton}
              activeOpacity={0.8}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    position: 'absolute', top: -320, left: 0, right: 0,
    width: '100%', height: '140%'
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verseSection: {
    flex: 1,
    justifyContent: 'flex-end', // Push text down to avoid centered/top background logo
    alignItems: 'center',
    width: width * 0.85,
    alignSelf: 'center',
    paddingBottom: 40, // Space between text and bottom button
  },
  verseText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 34,
    letterSpacing: 0.3,
  },
  referenceText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    color: '#FFFFFF',
    textAlign: 'center',
    marginTop: 24,
    letterSpacing: 0.5,
  },
  encouragementText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 16,
    letterSpacing: 0.2,
  },
  bottomSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 20,
    paddingBottom: 8,
    width: '100%',
  },
  continueButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  continueButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
});
