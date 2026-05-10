import React, { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCard, deleteCard } from '../api/client';

const ACCENT = '#4F46E5';

const FIELD_CONFIG = [
  { key: 'company',   label: 'Company',   icon: 'business-outline' },
  { key: 'job_title', label: 'Job Title',  icon: 'briefcase-outline' },
  { key: 'email',     label: 'Email',      icon: 'mail-outline' },
  { key: 'phone',     label: 'Phone',      icon: 'call-outline' },
  { key: 'website',   label: 'Website',    icon: 'globe-outline' },
  { key: 'address',   label: 'Address',    icon: 'location-outline' },
  { key: 'notes',     label: 'Notes',      icon: 'document-text-outline' },
];

const TAG_COLORS = [
  { bg: '#EEF2FF', text: '#4F46E5' },
  { bg: '#FDF4FF', text: '#9333EA' },
  { bg: '#ECFDF5', text: '#059669' },
  { bg: '#FFF7ED', text: '#EA580C' },
  { bg: '#EFF6FF', text: '#2563EB' },
  { bg: '#FFF1F2', text: '#E11D48' },
];

function tagColor(index) {
  return TAG_COLORS[index % TAG_COLORS.length];
}

export default function CardDetailScreen({ route, navigation }) {
  const { cardId } = route.params;
  const [card, setCard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadCard();
  }, [cardId]);

  async function loadCard() {
    try {
      setLoading(true);
      const data = await getCard(cardId);
      setCard(data);
    } catch (err) {
      console.error('Failed to load card:', err);
      Alert.alert('Error', 'Failed to load card details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }

  useLayoutEffect(() => {
    if (!card) return;
    navigation.setOptions({
      title: card.name,
      headerRight: () => (
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleEdit}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="create-outline" size={22} color={ACCENT} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerBtn, styles.headerBtnDelete]}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={22} color="#EF4444" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [card, navigation]);

  function handleEdit() {
    navigation.navigate('AddCard', { card });
  }

  function handleDelete() {
    Alert.alert(
      'Delete Card',
      `Are you sure you want to delete "${card.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteCard(cardId);
              navigation.goBack();
            } catch (err) {
              console.error('Failed to delete card:', err);
              Alert.alert('Error', 'Failed to delete card.');
              setDeleting(false);
            }
          },
        },
      ]
    );
  }

  if (loading || deleting) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={ACCENT} />
        {deleting ? <Text style={styles.deletingText}>Deleting…</Text> : null}
      </View>
    );
  }

  if (!card) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header card */}
      <View style={styles.heroCard}>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>
            {(card.name || '?')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.heroName}>{card.name}</Text>
        {(card.job_title || card.company) ? (
          <Text style={styles.heroSubtitle}>
            {[card.job_title, card.company].filter(Boolean).join(' · ')}
          </Text>
        ) : null}
      </View>

      {/* Fields */}
      <View style={styles.section}>
        {FIELD_CONFIG.map(({ key, label, icon }) => {
          const value = card[key];
          if (!value || (typeof value === 'string' && !value.trim())) return null;
          return (
            <View key={key} style={styles.fieldRow}>
              <View style={styles.fieldIconWrap}>
                <Ionicons name={icon} size={20} color={ACCENT} />
              </View>
              <View style={styles.fieldTextWrap}>
                <Text style={styles.fieldLabel}>{label}</Text>
                <Text style={styles.fieldValue} selectable>
                  {value}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Tags */}
      {Array.isArray(card.tags) && card.tags.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Tags</Text>
          <View style={styles.tagsContainer}>
            {card.tags.map((tag, idx) => {
              const color = tagColor(idx);
              return (
                <View key={idx} style={[styles.tagChip, { backgroundColor: color.bg }]}>
                  <Text style={[styles.tagChipText, { color: color.text }]}>{tag}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Metadata */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Created</Text>
        <Text style={styles.metaText}>
          {card.created_at ? new Date(card.created_at).toLocaleString() : '—'}
        </Text>
        {card.updated_at ? (
          <>
            <Text style={[styles.sectionHeader, { marginTop: 12 }]}>Last Updated</Text>
            <Text style={styles.metaText}>
              {new Date(card.updated_at).toLocaleString()}
            </Text>
          </>
        ) : null}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  deletingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 4,
  },
  headerBtn: {
    padding: 6,
  },
  headerBtnDelete: {
    marginLeft: 4,
  },
  heroCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  heroAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  heroAvatarText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '700',
  },
  heroName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fieldIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  fieldTextWrap: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  fieldValue: {
    fontSize: 15,
    color: '#111827',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 13,
    color: '#6B7280',
  },
});
