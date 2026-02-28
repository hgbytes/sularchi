import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect } from '@react-navigation/native';
import {
  getComplaints,
  getStats,
  type Complaint,
} from '@/services/complaint-store';
import { formatCoordinates } from '@/services/location-service';

export default function ReportsScreen() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({
    totalReports: 0,
    totalPoints: 0,
    streak: 0,
    categoryCounts: {} as Record<string, number>,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const [c, s] = await Promise.all([getComplaints(), getStats()]);
    setComplaints(c);
    setStats(s);
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

  const statusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return '#4CAF50';
      case 'in-progress':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'Resolved';
      case 'in-progress':
        return 'In Progress';
      default:
        return 'Pending';
    }
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderStatsBar = () => (
    <View style={styles.statsBar}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.totalReports}</Text>
        <Text style={styles.statLabel}>Reports</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{stats.totalPoints}</Text>
        <Text style={styles.statLabel}>Points</Text>
      </View>
      <View style={styles.statDivider} />
      <View style={styles.statItem}>
        <Text style={styles.statValue}>🔥 {stats.streak}</Text>
        <Text style={styles.statLabel}>Streak</Text>
      </View>
    </View>
  );

  const renderComplaintItem = ({ item }: { item: Complaint }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imageUri }} style={styles.cardImage} contentFit="cover" />
      <View style={styles.cardContent}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardCategory}>
            {getCategoryIcon(item.wasteCategory)} {item.wasteLabel}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: statusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: statusColor(item.status) }]}>
              {statusLabel(item.status)}
            </Text>
          </View>
        </View>

        <Text style={styles.cardDescription} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaText}>
            📍 {item.location.address || formatCoordinates(item.location.latitude, item.location.longitude)}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <Text style={styles.cardDate}>{formatDate(item.createdAt)}</Text>
          <Text style={styles.cardPoints}>+{item.pointsAwarded} pts</Text>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No Reports Yet</Text>
      <Text style={styles.emptySubtitle}>
        Scan waste items to file complaints and earn points!
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Reports</Text>
      </View>
      {renderStatsBar()}
      <FlatList
        data={complaints}
        keyExtractor={(item) => item.id}
        renderItem={renderComplaintItem}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={complaints.length === 0 ? styles.emptyList : styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2E7D32" />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    plastic: '♻️',
    paper: '📄',
    glass: '🫙',
    metal: '🥫',
    organic: '🍂',
    'e-waste': '🔌',
    textile: '👕',
    hazardous: '☢️',
    unknown: '❓',
  };
  return icons[category] || '❓';
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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1a1a1a',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 4,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyList: {
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 160,
  },
  cardContent: {
    padding: 16,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  cardMeta: {
    marginBottom: 8,
  },
  cardMetaText: {
    fontSize: 12,
    color: '#888',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  cardDate: {
    fontSize: 12,
    color: '#999',
  },
  cardPoints: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2E7D32',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
    lineHeight: 22,
  },
});
