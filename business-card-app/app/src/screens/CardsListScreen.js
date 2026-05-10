import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { getCards, getTags } from '../api/client';

const ACCENT = '#4F46E5';

export default function CardsListScreen({ navigation }) {
  const [cards, setCards] = useState([]);
  const [tags, setTags] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchCards = useCallback(
    async (query = searchQuery, tag = selectedTag) => {
      try {
        const data = await getCards(query, tag);
        setCards(data);
      } catch (err) {
        console.error('Failed to fetch cards:', err);
        Alert.alert('Error', 'Failed to load cards. Is the backend running?');
      }
    },
    [searchQuery, selectedTag]
  );

  const fetchTags = useCallback(async () => {
    try {
      const data = await getTags();
      setTags(data);
    } catch (err) {
      console.error('Failed to fetch tags:', err);
    }
  }, []);

  const loadAll = useCallback(
    async (query = searchQuery, tag = selectedTag) => {
      setLoading(true);
      await Promise.all([fetchCards(query, tag), fetchTags()]);
      setLoading(false);
    },
    [searchQuery, selectedTag, fetchCards, fetchTags]
  );

  // Reload when the screen comes into focus (e.g., after add/edit)
  useFocusEffect(
    useCallback(() => {
      loadAll(searchQuery, selectedTag);
    }, [searchQuery, selectedTag])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchCards(searchQuery, selectedTag), fetchTags()]);
    setRefreshing(false);
  }, [searchQuery, selectedTag, fetchCards, fetchTags]);

  const handleSearchChange = (text) => {
    setSearchQuery(text);
    if (searchTimeout) clearTimeout(searchTimeout);
    const t = setTimeout(() => {
      fetchCards(text, selectedTag);
    }, 400);
    setSearchTimeout(t);
  };

  const handleTagSelect = (tag) => {
    const next = tag === selectedTag ? null : tag;
    setSelectedTag(next);
    fetchCards(searchQuery, next);
  };

  const renderCardItem = ({ item }) => (
    <TouchableOpacity
      style={styles.cardItem}
      onPress={() => navigation.navigate('CardDetail', { cardId: item.id })}
      activeOpacity={0.75}
    >
      <View style={styles.cardAvatar}>
        <Text style={styles.cardAvatarText}>
          {(item.name || '?')[0].toUpperCase()}
        </Text>
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>
        {(item.job_title || item.company) ? (
          <Text style={styles.cardSubtitle} numberOfLines={1}>
            {[item.job_title, item.company].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
        <View style={styles.cardContact}>
          {item.email ? (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={12} color="#9CA3AF" />
              <Text style={styles.contactText} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          ) : null}
          {item.phone ? (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={12} color="#9CA3AF" />
              <Text style={styles.contactText} numberOfLines={1}>
                {item.phone}
              </Text>
            </View>
          ) : null}
        </View>
        {Array.isArray(item.tags) && item.tags.length > 0 ? (
          <View style={styles.tagRow}>
            {item.tags.slice(0, 3).map((tag, idx) => (
              <View key={idx} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {item.tags.length > 3 ? (
              <Text style={styles.tagMore}>+{item.tags.length - 3}</Text>
            ) : null}
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color="#D1D5DB" style={styles.chevron} />
    </TouchableOpacity>
  );

  const renderTagFilter = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.tagFilterContainer}
      contentContainerStyle={styles.tagFilterContent}
    >
      <TouchableOpacity
        style={[styles.tagFilter, !selectedTag && styles.tagFilterActive]}
        onPress={() => handleTagSelect(null)}
      >
        <Text style={[styles.tagFilterText, !selectedTag && styles.tagFilterTextActive]}>
          All
        </Text>
      </TouchableOpacity>
      {tags.map((tag) => (
        <TouchableOpacity
          key={tag}
          style={[styles.tagFilter, selectedTag === tag && styles.tagFilterActive]}
          onPress={() => handleTagSelect(tag)}
        >
          <Text
            style={[
              styles.tagFilterText,
              selectedTag === tag && styles.tagFilterTextActive,
            ]}
          >
            {tag}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="card-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyTitle}>No business cards</Text>
      <Text style={styles.emptySubtitle}>
        {searchQuery || selectedTag
          ? 'Try a different search or clear the filter.'
          : 'Tap the + button to add your first card.'}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search cards…"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={handleSearchChange}
          clearButtonMode="while-editing"
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              fetchCards('', selectedTag);
            }}
          >
            <Ionicons name="close-circle" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tag filter row */}
      {tags.length > 0 ? renderTagFilter() : null}

      {/* Cards list */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={ACCENT} />
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderCardItem}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={cards.length === 0 ? styles.listEmpty : styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={ACCENT} />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddCard', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    padding: 0,
  },
  tagFilterContainer: {
    maxHeight: 48,
    marginBottom: 4,
  },
  tagFilterContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagFilter: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#E5E7EB',
    marginRight: 8,
  },
  tagFilterActive: {
    backgroundColor: ACCENT,
  },
  tagFilterText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
  },
  tagFilterTextActive: {
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100,
    paddingTop: 4,
  },
  listEmpty: {
    flex: 1,
    paddingHorizontal: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginLeft: 76,
  },
  cardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  cardContact: {
    gap: 2,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  contactText: {
    fontSize: 12,
    color: '#9CA3AF',
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
    gap: 4,
  },
  tag: {
    backgroundColor: '#EEF2FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 11,
    color: ACCENT,
    fontWeight: '600',
  },
  tagMore: {
    fontSize: 11,
    color: '#9CA3AF',
    alignSelf: 'center',
  },
  chevron: {
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
});
