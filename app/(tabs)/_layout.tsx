import { Tabs } from 'expo-router';
import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Home, Music, BookOpen, Heart, User } from 'lucide-react-native';
import { useTheme } from '@/theme/ThemeContext';
import { space, radius, fonts, tabBar } from '@/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { palette } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const bottomPadding = Math.max(insets.bottom, tabBar.minBottomInset);
  const containerMargin = space.screenPadding;
  const tabWidth = (width - containerMargin * 2) / state.routes.length;

  const indicatorPosition = useSharedValue(state.index * tabWidth);

  useEffect(() => {
    indicatorPosition.value = withSpring(state.index * tabWidth, {
      damping: 18,
      stiffness: 150,
    });
  }, [state.index, tabWidth, indicatorPosition]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }],
    width: tabWidth,
  }));

  return (
    <View style={[
      styles.floatingBar,
      {
        backgroundColor: palette.surface,
        shadowColor: palette.border,
        bottom: bottomPadding + tabBar.bottomGap,
      }
    ]}>
      <View style={styles.tabContainer}>
        <Animated.View style={[
          styles.activePill,
          { backgroundColor: palette.surfaceAlt },
          indicatorStyle
        ]} />

        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const IconComponent = options.tabBarIcon;

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={0.8}
            >
              {IconComponent && IconComponent({
                isFocused,
                color: palette.textSecondary,
                activeColor: palette.accent,
              })}
              <Text style={[
                styles.tabLabel,
                { color: isFocused ? palette.accent : palette.textSecondary },
                isFocused && { fontWeight: '700' },
              ]}>
                {options.title}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function TabBarIcon({ isFocused, icon: Icon, color, activeColor }: any) {
  const scale = useSharedValue(isFocused ? 1.1 : 1);
  const translateY = useSharedValue(isFocused ? -2 : 0);

  useEffect(() => {
    translateY.value = withSpring(isFocused ? -3 : 0, { damping: 12 });
    scale.value = withSpring(isFocused ? 1.15 : 1, { damping: 12 });
  }, [isFocused, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value }
    ]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Icon size={22} color={isFocused ? activeColor : color} strokeWidth={isFocused ? 2.5 : 1.5} />
    </Animated.View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: (props) => <TabBarIcon {...props} icon={Home} />,
        }}
      />
      <Tabs.Screen
        name="bible"
        options={{
          title: 'Bible',
          tabBarIcon: (props) => <TabBarIcon {...props} icon={BookOpen} />,
        }}
      />
      <Tabs.Screen
        name="hymns"
        options={{
          title: 'Hymns',
          tabBarIcon: (props) => <TabBarIcon {...props} icon={Music} />,
        }}
      />
      <Tabs.Screen
        name="devotions"
        options={{
          title: 'Devotions',
          tabBarIcon: (props) => <TabBarIcon {...props} icon={Heart} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: (props) => <TabBarIcon {...props} icon={User} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  floatingBar: {
    position: 'absolute',
    left: space.screenPadding,
    right: space.screenPadding,
    borderRadius: radius.r4,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
    padding: tabBar.padding,
  },
  tabContainer: {
    flexDirection: 'row',
    height: tabBar.contentHeight,
    position: 'relative',
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
    height: '100%',
    gap: 2,
  },
  tabLabel: {
    fontSize: 9.5,
    fontFamily: fonts.sansMedium,
    marginTop: 1,
  },
  activePill: {
    position: 'absolute',
    height: '100%',
    borderRadius: radius.r3,
    top: 0,
    zIndex: 0,
  }
});
