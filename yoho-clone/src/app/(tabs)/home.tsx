/**
 * S05 Home — room discovery (recon S05, design spec: Room card, Tabs,
 * Banner carousel, Header).
 * Hot / Related tabs (dot under the selected tab), a promo banner, and a
 * 2-column grid of live room cards. Tapping a card joins the room (S07).
 * Empty state: no live rooms yet (the clone starts empty) with a
 * "Create a room" action. Loading state: skeletons (not spinners).
 * All labels are the clone's own words.
 */
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { subscribeRooms, type Room } from '../../lib/rooms';
import { RoomCard } from '../../components/RoomCard';
import { Button } from '../../components/Button';
import { tokens } from '../../theme/tokens';

type Tab = 'hot' | 'related';

export default function Home() {
  const [tab, setTab] = useState<Tab>('hot');
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const unsub = subscribeRooms((next) => {
      setRooms(next);
      setLoading(false);
      setRefreshing(false);
    });
    return unsub;
  }, []);

  const openRoom = (room: Room) => {
    router.push({ pathname: '/room/[id]', params: { id: room.id } });
  };

  const visibleRooms =
    tab === 'hot'
      ? [...rooms].sort((a, b) => b.onlineCount - a.onlineCount)
      : rooms;

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live rooms</Text>
        <Pressable
          onPress={() => router.push('/(tabs)/create')}
          accessibilityRole="button"
          accessibilityLabel="Create a room"
          style={styles.createIcon}
        >
          <Text style={styles.createIconText}>＋</Text>
        </Pressable>
      </View>

      <View style={styles.tabs} accessibilityRole="tablist">
        {(['hot', 'related'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            style={styles.tab}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextSelected]}>
              {t === 'hot' ? 'Hot' : 'Related'}
            </Text>
            {tab === t ? <View style={styles.tabDot} /> : null}
          </Pressable>
        ))}
      </View>

      <View style={styles.banner}>
        <Text style={styles.bannerTitle}>Find your voice</Text>
        <Text style={styles.bannerText}>
          Join a live room, take a mic seat, and talk with people.
        </Text>
      </View>

      {loading ? (
        <View style={styles.skeletonGrid}>
          {[0, 1, 2, 3].map((i) => (
            <View key={i} style={styles.skeletonCard} />
          ))}
        </View>
      ) : visibleRooms.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No live rooms yet</Text>
          <Text style={styles.emptyText}>
            Be the first to start one — create a room and invite people in.
          </Text>
          <Button
            label="Create a room"
            onPress={() => router.push('/(tabs)/create')}
            variant="primary"
            size="lg"
          />
        </View>
      ) : (
        <FlatList
          data={visibleRooms}
          keyExtractor={(r) => r.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => setRefreshing(true)}
              tintColor={tokens.color.accent}
            />
          }
          renderItem={({ item }) => <RoomCard room={item} onPress={openRoom} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  header: {
    height: tokens.layout.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tokens.space[4],
  },
  headerTitle: {
    fontSize: tokens.type.lg.size,
    fontWeight: '600',
    color: tokens.color.text,
  },
  createIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createIconText: { fontSize: 28, color: tokens.color.accent },
  tabs: {
    flexDirection: 'row',
    gap: tokens.space[5],
    paddingHorizontal: tokens.space[4],
    paddingBottom: tokens.space[2],
  },
  tab: { alignItems: 'center', paddingVertical: tokens.space[1] },
  tabText: { fontSize: tokens.type.base.size, fontWeight: '600', color: tokens.color.textMuted },
  tabTextSelected: { color: tokens.color.text },
  tabDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: tokens.color.accent,
    marginTop: 2,
  },
  banner: {
    marginHorizontal: tokens.space[4],
    marginBottom: tokens.space[3],
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.accentSoft,
    padding: tokens.space[4],
  },
  bannerTitle: {
    fontSize: tokens.type.lg.size,
    fontWeight: '700',
    color: tokens.color.text,
  },
  bannerText: {
    fontSize: tokens.type.sm.size,
    color: tokens.color.textMuted,
    marginTop: 2,
  },
  list: { paddingHorizontal: tokens.space[4], paddingBottom: tokens.space[4] },
  columnWrapper: { gap: tokens.space[2], marginBottom: tokens.space[2] },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.space[2],
    paddingHorizontal: tokens.space[4],
  },
  skeletonCard: {
    flex: 1,
    minWidth: '47%',
    aspectRatio: 3 / 4,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.surface2,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: tokens.space[4],
    gap: tokens.space[2],
  },
  emptyTitle: {
    fontSize: tokens.type.lg.size,
    fontWeight: '700',
    color: tokens.color.text,
  },
  emptyText: {
    fontSize: tokens.type.base.size,
    color: tokens.color.textMuted,
    textAlign: 'center',
  },
});
