import React, { useState, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { getUserProfile, getStats, type UserProfile } from '@/services/complaint-store';

const WASTE_CATEGORIES = [
  { icon: '♻️', label: 'Plastic', color: '#2196F3' },
  { icon: '📄', label: 'Paper', color: '#8D6E63' },
  { icon: '🫙', label: 'Glass', color: '#26A69A' },
  { icon: '🥫', label: 'Metal', color: '#78909C' },
  { icon: '🍂', label: 'Organic', color: '#4CAF50' },
  { icon: '🔌', label: 'E-Waste', color: '#FF9800' },
];

export default function HomeScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState({ totalReports: 0, totalPoints: 0, streak: 0, categoryCounts: {} as Record<string, number> });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [p, s] = await Promise.all([getUserProfile(), getStats()]);
        setProfile(p);
        setStats(s);
      })();
    }, [])
  );

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#2E7D32', dark: '#1B5E20' }}
      headerImage={
        <View style={styles.headerContent}>
          <Text style={styles.headerEmoji}>🌍</Text>
          <Text style={styles.headerTitle}>Sularchi</Text>
          <Text style={styles.headerSubtitle}>Smart Waste Classification</Text>
        </View>
      }>
      {/* User Stats */}
      {profile && stats.totalReports > 0 && (
        <ThemedView style={styles.userStats}>
          <View style={styles.userStatsRow}>
            <View style={styles.userStatBox}>
              <Text style={styles.userStatValue}>{stats.totalPoints}</Text>
              <ThemedText style={styles.userStatLabel}>Points</ThemedText>
            </View>
            <View style={styles.userStatBox}>
              <Text style={styles.userStatValue}>{stats.totalReports}</Text>
              <ThemedText style={styles.userStatLabel}>Reports</ThemedText>
            </View>
            <View style={styles.userStatBox}>
              <Text style={styles.userStatValue}>🔥 {stats.streak}</Text>
              <ThemedText style={styles.userStatLabel}>Streak</ThemedText>
            </View>
          </View>
        </ThemedView>
      )}

      {/* Scan CTA */}
      <ThemedView style={styles.scanCta}>
        <ThemedText type="title">Identify Your Waste</ThemedText>
        <ThemedText style={styles.ctaDescription}>
          Point your camera at any waste item and our AI will instantly classify it and tell you how
          to dispose of it properly.
        </ThemedText>
        <Pressable
          style={({ pressed }) => [
            styles.scanButton,
            pressed && styles.scanButtonPressed,
          ]}
          onPress={() => router.push('/(tabs)/scan')}
        >
          <IconSymbol name="camera.fill" size={24} color="#fff" />
          <Text style={styles.scanButtonText}>Scan Waste Now</Text>
        </Pressable>
      </ThemedView>

      {/* How It Works */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">How It Works</ThemedText>
        <View style={styles.stepsRow}>
          <View style={styles.step}>
            <Text style={styles.stepIcon}>📷</Text>
            <Text style={styles.stepLabel}>Capture</Text>
            <ThemedText style={styles.stepDesc}>Snap a photo of waste</ThemedText>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepIcon}>🤖</Text>
            <Text style={styles.stepLabel}>Classify</Text>
            <ThemedText style={styles.stepDesc}>AI + GPS auto-attached</ThemedText>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepIcon}>📋</Text>
            <Text style={styles.stepLabel}>Report</Text>
            <ThemedText style={styles.stepDesc}>File complaint & earn pts</ThemedText>
          </View>
        </View>
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Quick Actions</ThemedText>
        <View style={styles.quickActions}>
          <Pressable
            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/reports')}
          >
            <Text style={styles.quickActionIcon}>📋</Text>
            <Text style={styles.quickActionLabel}>My Reports</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/(tabs)/leaderboard')}
          >
            <Text style={styles.quickActionIcon}>🏆</Text>
            <Text style={styles.quickActionLabel}>Leaderboard</Text>
          </Pressable>
        </View>
      </ThemedView>

      {/* Waste Categories */}
      <ThemedView style={styles.section}>
        <ThemedText type="subtitle">Waste Categories</ThemedText>
        <ThemedText style={styles.sectionDesc}>
          Our AI can identify these types of waste:
        </ThemedText>
        <View style={styles.categoriesGrid}>
          {WASTE_CATEGORIES.map((cat) => (
            <View key={cat.label} style={[styles.categoryChip, { backgroundColor: cat.color + '18' }]}>
              <Text style={styles.categoryIcon}>{cat.icon}</Text>
              <Text style={[styles.categoryLabel, { color: cat.color }]}>{cat.label}</Text>
            </View>
          ))}
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
  },
  userStats: {
    marginBottom: 8,
  },
  userStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(46,125,50,0.08)',
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  userStatBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  userStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2E7D32',
  },
  userStatLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  scanCta: {
    gap: 12,
    marginBottom: 8,
  },
  ctaDescription: {
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.7,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 10,
    marginTop: 4,
  },
  scanButtonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  section: {
    gap: 10,
    marginTop: 16,
  },
  sectionDesc: {
    fontSize: 14,
    opacity: 0.6,
  },
  stepsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  step: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(46,125,50,0.06)',
    borderRadius: 16,
    padding: 16,
    gap: 6,
  },
  stepIcon: {
    fontSize: 32,
  },
  stepLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  stepDesc: {
    fontSize: 12,
    textAlign: 'center',
    opacity: 0.6,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  categoryIcon: {
    fontSize: 20,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickAction: {
    flex: 1,
    backgroundColor: 'rgba(46,125,50,0.06)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    fontSize: 32,
  },
  quickActionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2E7D32',
  },
});
