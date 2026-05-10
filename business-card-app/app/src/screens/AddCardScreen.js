import React, { useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { createCard, updateCard } from '../api/client';

const ACCENT = '#4F46E5';

const FIELDS = [
  { key: 'name',      label: 'Name',      placeholder: 'Full name',           required: true,  multiline: false, icon: 'person-outline' },
  { key: 'company',   label: 'Company',   placeholder: 'Company name',        required: false, multiline: false, icon: 'business-outline' },
  { key: 'job_title', label: 'Job Title', placeholder: 'e.g. Software Engineer', required: false, multiline: false, icon: 'briefcase-outline' },
  { key: 'email',     label: 'Email',     placeholder: 'email@example.com',   required: false, multiline: false, icon: 'mail-outline', keyboardType: 'email-address', autoCapitalize: 'none' },
  { key: 'phone',     label: 'Phone',     placeholder: '+1 (555) 000-0000',   required: false, multiline: false, icon: 'call-outline', keyboardType: 'phone-pad' },
  { key: 'website',   label: 'Website',   placeholder: 'https://example.com', required: false, multiline: false, icon: 'globe-outline', keyboardType: 'url', autoCapitalize: 'none' },
  { key: 'address',   label: 'Address',   placeholder: '123 Main St, City, State', required: false, multiline: true,  icon: 'location-outline' },
  { key: 'notes',     label: 'Notes',     placeholder: 'Any additional notes…', required: false, multiline: true,  icon: 'document-text-outline' },
];

export default function AddCardScreen({ route, navigation }) {
  const existingCard = route.params?.card || null;
  const isEditing = Boolean(existingCard);

  const [form, setForm] = useState({
    name:      existingCard?.name      || '',
    company:   existingCard?.company   || '',
    job_title: existingCard?.job_title || '',
    email:     existingCard?.email     || '',
    phone:     existingCard?.phone     || '',
    website:   existingCard?.website   || '',
    address:   existingCard?.address   || '',
    notes:     existingCard?.notes     || '',
  });

  const [tags, setTags] = useState(
    Array.isArray(existingCard?.tags) ? [...existingCard.tags] : []
  );
  const [tagInput, setTagInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({
      title: isEditing ? 'Edit Card' : 'Add Card',
    });
  }, [isEditing, navigation]);

  function handleFieldChange(key, value) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (key === 'name' && value.trim()) {
      setNameError('');
    }
  }

  function handleAddTag() {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (tags.includes(trimmed)) {
      setTagInput('');
      return;
    }
    setTags(prev => [...prev, trimmed]);
    setTagInput('');
  }

  function handleRemoveTag(tag) {
    setTags(prev => prev.filter(t => t !== tag));
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setNameError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name:      form.name.trim(),
        company:   form.company.trim()   || null,
        job_title: form.job_title.trim() || null,
        email:     form.email.trim()     || null,
        phone:     form.phone.trim()     || null,
        website:   form.website.trim()   || null,
        address:   form.address.trim()   || null,
        notes:     form.notes.trim()     || null,
        tags,
      };

      if (isEditing) {
        await updateCard(existingCard.id, payload);
      } else {
        await createCard(payload);
      }

      navigation.goBack();
    } catch (err) {
      console.error('Save card error:', err);
      Alert.alert('Error', 'Failed to save card. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {FIELDS.map(({ key, label, placeholder, required, multiline, icon, keyboardType, autoCapitalize }) => (
          <View key={key} style={styles.fieldGroup}>
            <View style={styles.labelRow}>
              <Ionicons name={icon} size={16} color={ACCENT} style={styles.fieldIcon} />
              <Text style={styles.label}>
                {label}
                {required ? <Text style={styles.required}> *</Text> : null}
              </Text>
            </View>
            <TextInput
              style={[
                styles.input,
                multiline && styles.inputMultiline,
                key === 'name' && nameError ? styles.inputError : null,
              ]}
              placeholder={placeholder}
              placeholderTextColor="#9CA3AF"
              value={form[key]}
              onChangeText={val => handleFieldChange(key, val)}
              multiline={multiline}
              numberOfLines={multiline ? 3 : 1}
              textAlignVertical={multiline ? 'top' : 'center'}
              keyboardType={keyboardType || 'default'}
              autoCapitalize={autoCapitalize || 'words'}
              autoCorrect={key !== 'email' && key !== 'website'}
            />
            {key === 'name' && nameError ? (
              <Text style={styles.errorText}>{nameError}</Text>
            ) : null}
          </View>
        ))}

        {/* Tags section */}
        <View style={styles.fieldGroup}>
          <View style={styles.labelRow}>
            <Ionicons name="pricetag-outline" size={16} color={ACCENT} style={styles.fieldIcon} />
            <Text style={styles.label}>Tags</Text>
          </View>

          {/* Existing tags */}
          {tags.length > 0 ? (
            <View style={styles.tagsContainer}>
              {tags.map((tag, idx) => (
                <View key={idx} style={styles.tagChip}>
                  <Text style={styles.tagChipText}>{tag}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveTag(tag)}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                    style={styles.tagRemoveBtn}
                  >
                    <Ionicons name="close" size={14} color={ACCENT} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}

          {/* Tag input row */}
          <View style={styles.tagInputRow}>
            <TextInput
              style={styles.tagInput}
              placeholder="Add a tag…"
              placeholderTextColor="#9CA3AF"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              autoCapitalize="none"
              returnKeyType="done"
            />
            <TouchableOpacity
              style={[styles.tagAddBtn, !tagInput.trim() && styles.tagAddBtnDisabled]}
              onPress={handleAddTag}
              disabled={!tagInput.trim()}
            >
              <Text style={styles.tagAddBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.8}
        >
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name={isEditing ? 'checkmark-circle-outline' : 'add-circle-outline'} size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.saveButtonText}>
                {isEditing ? 'Save Changes' : 'Add Card'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldIcon: {
    marginRight: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  inputMultiline: {
    minHeight: 80,
    paddingTop: 11,
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 10,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    gap: 4,
  },
  tagChipText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '600',
  },
  tagRemoveBtn: {
    padding: 2,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
  },
  tagAddBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  tagAddBtnDisabled: {
    backgroundColor: '#C7D2FE',
  },
  tagAddBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: ACCENT,
    borderRadius: 12,
    paddingVertical: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
