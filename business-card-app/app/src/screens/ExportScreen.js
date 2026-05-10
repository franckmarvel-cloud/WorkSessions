import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCards, exportCSV, exportVCard } from '../api/client';

const ACCENT = '#4F46E5';

export default function ExportScreen() {
  const [cardCount, setCardCount] = useState(null);
  const [loadingCount, setLoadingCount] = useState(true);
  const [exportingCSV, setExportingCSV] = useState(false);
  const [exportingVCard, setExportingVCard] = useState(false);

  useEffect(() => {
    loadCount();
  }, []);

  async function loadCount() {
    try {
      setLoadingCount(true);
      const cards = await getCards();
      setCardCount(cards.length);
    } catch (err) {
      console.error('Failed to load card count:', err);
      setCardCount(0);
    } finally {
      setLoadingCount(false);
    }
  }

  async function handleExportCSV() {
    setExportingCSV(true);
    try {
      const url = exportCSV();
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Export CSV',
          `To download the CSV file, open this URL in your browser:\n\n${url}`,
          [
            { text: 'Copy URL', onPress: () => showCopyHint(url) },
            { text: 'OK' },
          ]
        );
      }
    } catch (err) {
      console.error('CSV export error:', err);
      Alert.alert(
        'Export CSV',
        `Open the following URL in your browser to download the CSV file:\n\nhttp://localhost:3001/api/export/csv`
      );
    } finally {
      setExportingCSV(false);
    }
  }

  async function handleExportVCard() {
    setExportingVCard(true);
    try {
      const url = exportVCard();
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          'Export vCard',
          `To download the .vcf file, open this URL in your browser:\n\n${url}`,
          [
            { text: 'Copy URL', onPress: () => showCopyHint(url) },
            { text: 'OK' },
          ]
        );
      }
    } catch (err) {
      console.error('vCard export error:', err);
      Alert.alert(
        'Export vCard',
        `Open the following URL in your browser to download the vCard file:\n\nhttp://localhost:3001/api/export/vcard`
      );
    } finally {
      setExportingVCard(false);
    }
  }

  function showCopyHint(url) {
    Alert.alert('URL', url);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Ionicons name="download-outline" size={40} color={ACCENT} />
        </View>
        <Text style={styles.title}>Export Cards</Text>
        <Text style={styles.subtitle}>
          {loadingCount
            ? 'Loading…'
            : cardCount === 1
            ? '1 business card'
            : `${cardCount ?? 0} business cards`}{' '}
          ready to export
        </Text>
      </View>

      <View style={styles.buttonsContainer}>
        {/* CSV Export */}
        <TouchableOpacity
          style={[styles.exportBtn, exportingCSV && styles.exportBtnDisabled]}
          onPress={handleExportCSV}
          disabled={exportingCSV || loadingCount}
          activeOpacity={0.8}
        >
          <View style={styles.exportBtnIcon}>
            {exportingCSV ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="document-text-outline" size={32} color="#fff" />
            )}
          </View>
          <View style={styles.exportBtnText}>
            <Text style={styles.exportBtnTitle}>Export as CSV</Text>
            <Text style={styles.exportBtnDescription}>
              Comma-separated values — open in Excel, Numbers, or Google Sheets
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* vCard Export */}
        <TouchableOpacity
          style={[styles.exportBtn, styles.exportBtnVCard, exportingVCard && styles.exportBtnDisabled]}
          onPress={handleExportVCard}
          disabled={exportingVCard || loadingCount}
          activeOpacity={0.8}
        >
          <View style={[styles.exportBtnIcon, styles.exportBtnIconVCard]}>
            {exportingVCard ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Ionicons name="people-outline" size={32} color="#fff" />
            )}
          </View>
          <View style={styles.exportBtnText}>
            <Text style={styles.exportBtnTitle}>Export as vCard (.vcf)</Text>
            <Text style={styles.exportBtnDescription}>
              Standard vCard format — import into Contacts, Outlook, or Gmail
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>

      <View style={styles.infoBox}>
        <Ionicons name="information-circle-outline" size={18} color="#6B7280" style={{ marginRight: 8, marginTop: 1 }} />
        <Text style={styles.infoText}>
          Export opens the download URL in your browser. Make sure the backend server is running on port 3001.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 36,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
  },
  buttonsContainer: {
    gap: 14,
    marginBottom: 24,
  },
  exportBtn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  exportBtnVCard: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
  },
  exportBtnDisabled: {
    opacity: 0.65,
  },
  exportBtnIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  exportBtnIconVCard: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  exportBtnText: {
    flex: 1,
  },
  exportBtnTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  exportBtnDescription: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 16,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});
