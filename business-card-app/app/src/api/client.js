import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ─── Cards ────────────────────────────────────────────────────────────────────

/**
 * Fetch all cards, optionally filtered by search query and/or tag.
 * @param {string} [search] - Full-text search query
 * @param {string} [tag] - Tag name to filter by
 * @returns {Promise<Array>}
 */
export async function getCards(search, tag) {
  const params = {};
  if (search && search.trim()) params.search = search.trim();
  if (tag && tag.trim()) params.tag = tag.trim();
  const response = await apiClient.get('/cards', { params });
  return response.data;
}

/**
 * Fetch a single card by ID.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function getCard(id) {
  const response = await apiClient.get(`/cards/${id}`);
  return response.data;
}

/**
 * Create a new business card.
 * @param {Object} data - Card fields
 * @returns {Promise<Object>}
 */
export async function createCard(data) {
  const response = await apiClient.post('/cards', data);
  return response.data;
}

/**
 * Update an existing business card.
 * @param {number|string} id
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateCard(id, data) {
  const response = await apiClient.put(`/cards/${id}`, data);
  return response.data;
}

/**
 * Delete a business card.
 * @param {number|string} id
 * @returns {Promise<Object>}
 */
export async function deleteCard(id) {
  const response = await apiClient.delete(`/cards/${id}`);
  return response.data;
}

// ─── Tags ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all unique tags across all cards.
 * @returns {Promise<string[]>}
 */
export async function getTags() {
  const response = await apiClient.get('/tags');
  return response.data;
}

// ─── Export ───────────────────────────────────────────────────────────────────

/**
 * Returns the full URL for CSV export.
 * @returns {string}
 */
export function exportCSV() {
  return `${API_BASE_URL}/export/csv`;
}

/**
 * Returns the full URL for vCard export.
 * @returns {string}
 */
export function exportVCard() {
  return `${API_BASE_URL}/export/vcard`;
}
