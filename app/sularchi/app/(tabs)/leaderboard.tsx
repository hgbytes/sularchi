import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  SafeAreaView,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getLeaderboard,
  getUserProfile,
  updateUserName,
  type LeaderboardEntry,
  type UserProfile,
} from '@/services/complaint-store';

export default function LeaderboardScreen() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const loadData = useCallback(async () => {
    const [lb, p] = await Promise.all([getLeaderboard(), getUserProfile()]);
    setEntries(lb);
    setProfile(p);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert('Invalid', 'Please enter a name');
      return;
    }
    const updated = await updateUserName(trimmed);
    setProfile(updated);
    setEditingName(false);
    await loadData(); // refresh leaderboard with new name
  };

  const currentUserEntry = entries.find((e) => e.isCurrentUser);

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return '#FFD700';
      case 2: return '#C0C0C0';
      case 3: return '#CD7F32';
      default: return '#e0e0e0';
    }
  };

  const renderHeader = () => (
    <View>
      {/* User Profile Card */}
      {profile && currentUserEntry && (
        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {profile.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              {editingName ? (
                <View style={styles.nameEditRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={nameInput}
                    onChangeText={setNameInput}
                    placeholder="Enter name"
                    autoFocus
                    maxLength={20}
                  />
                  <Pressable style={styles.nameSaveBtn} onPress={handleSaveName}>
                    <Text style={styles.nameSaveBtnText}>Save</Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={() => {
                    setNameInput(profile.name);
                    setEditingName(true);
                  }}
                >
                  <Text style={styles.profileName}>{profile.name} ✏️</Text>
                </Pressable>
              )}
              <Text style={styles.profileRank}>
                Rank {getRankEmoji(currentUserEntry.rank)} of {entries.length}
              </Text>
            </View>
          </View>

          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{profile.totalPoints}</Text>
              <Text style={styles.profileStatLabel}>Points</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{profile.totalReports}</Text>
              <Text style={styles.profileStatLabel}>Reports</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>🔥 {profile.streak}</Text>
              <Text style={styles.profileStatLabel}>Streak</Text>
            </View>
          </View>
        </View>
      )}

      {/* Leaderboard Title */}
      <View style={styles.leaderboardHeader}>
        <Text style={styles.leaderboardTitle}>🏆 Community Ranking</Text>
      </View>
    </View>
  );

  const renderEntry = ({ item }: { item: LeaderboardEntry }) => (
    <View
      style={[
        styles.entryCard,
        item.isCurrentUser && styles.entryCardHighlight,
        item.rank <= 3 && styles.entryCardTop,
      ]}
    >
      {/* Rank */}
      <View
        style={[
          styles.rankBadge,
          { backgroundColor: item.rank <= 3 ? getRankColor(item.rank) : '#f5f5f5' },
        ]}
      >
        <Text
          style={[
            styles.rankText,
            item.rank <= 3 && styles.rankTextTop,
          ]}
        >
          {item.rank <= 3 ? getRankEmoji(item.rank) : item.rank}
        </Text>
      </View>

      {/* Name & reports */}
      <View style={styles.entryInfo}>
        <Text style={[styles.entryName, item.isCurrentUser && styles.entryNameCurrent]}>
          {item.name} {item.isCurrentUser ? '(You)' : ''}
        </Text>
        <Text style={styles.entryReports}>{item.totalReports} reports</Text>
      </View>

      {/* Points */}
      <View style={styles.entryPoints}>
        <Text style={[styles.entryPointsValue, item.rank <= 3 && styles.entryPointsTop]}>
          {item.totalPoints}
        </Text>
        <Text style={styles.entryPointsLabel}>pts</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard</Text>
      </View>
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id}
        renderItem={renderEntry}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2E7D32" />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // Profile card
  profileCard: {
    backgroundColor: '#1B5E20',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  profileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileAvatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  profileRank: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  nameEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nameInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 16,
    color: '#1a1a1a',
  },
  nameSaveBtn: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  nameSaveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  profileStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 12,
  },
  profileStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  profileStatLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  profileStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 4,
  },

  // Leaderboard
  leaderboardHeader: {
    marginBottom: 12,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  // Entry cards
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  entryCardHighlight: {
    borderWidth: 2,
    borderColor: '#2E7D32',
    backgroundColor: '#E8F5E9',
  },
  entryCardTop: {
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  rankBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  rankText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  rankTextTop: {
    fontSize: 20,
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  entryNameCurrent: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  entryReports: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  entryPoints: {
    alignItems: 'flex-end',
  },
  entryPointsValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  entryPointsTop: {
    color: '#2E7D32',
  },
  entryPointsLabel: {
    fontSize: 11,
    color: '#999',
  },
});
