const express = require('express');
const cors = require('cors');
const { initDb, getDb } = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize the database on startup
initDb();

// ─── Helper: parse tags from DB string ────────────────────────────────────────
function parseCard(card) {
  if (!card) return null;
  return {
    ...card,
    tags: (() => {
      try {
        return JSON.parse(card.tags || '[]');
      } catch {
        return [];
      }
    })(),
  };
}

// ─── GET /api/cards ───────────────────────────────────────────────────────────
app.get('/api/cards', (req, res) => {
  try {
    const db = getDb();
    const { search, tag } = req.query;
    let rows;

    if (search && search.trim()) {
      // Use FTS to find matching IDs, then fetch full records
      const ftsQuery = search.trim().split(/\s+/).map(t => `"${t.replace(/"/g, '')}"`).join(' OR ');
      const matchingIds = db
        .prepare(`SELECT rowid FROM cards_fts WHERE cards_fts MATCH ? ORDER BY rank`)
        .all(ftsQuery)
        .map(r => r.rowid);

      if (matchingIds.length === 0) {
        return res.json([]);
      }

      const placeholders = matchingIds.map(() => '?').join(',');
      rows = db
        .prepare(`SELECT * FROM cards WHERE id IN (${placeholders}) ORDER BY name ASC`)
        .all(...matchingIds);
    } else {
      rows = db.prepare('SELECT * FROM cards ORDER BY name ASC').all();
    }

    let cards = rows.map(parseCard);

    // Optional tag filter (applied after FTS or full scan)
    if (tag && tag.trim()) {
      const filterTag = tag.trim().toLowerCase();
      cards = cards.filter(c =>
        Array.isArray(c.tags) && c.tags.some(t => t.toLowerCase() === filterTag)
      );
    }

    res.json(cards);
  } catch (err) {
    console.error('GET /api/cards error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/cards/:id ───────────────────────────────────────────────────────
app.get('/api/cards/:id', (req, res) => {
  try {
    const db = getDb();
    const card = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }
    res.json(parseCard(card));
  } catch (err) {
    console.error('GET /api/cards/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── POST /api/cards ──────────────────────────────────────────────────────────
app.post('/api/cards', (req, res) => {
  try {
    const db = getDb();
    const { name, company, job_title, email, phone, website, address, notes, tags } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const tagsJson = JSON.stringify(Array.isArray(tags) ? tags : []);
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO cards (name, company, job_title, email, phone, website, address, notes, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      name.trim(),
      company || null,
      job_title || null,
      email || null,
      phone || null,
      website || null,
      address || null,
      notes || null,
      tagsJson,
      now,
      now
    );

    const newCard = db.prepare('SELECT * FROM cards WHERE id = ?').get(result.lastInsertRowid);
    res.status(201).json(parseCard(newCard));
  } catch (err) {
    console.error('POST /api/cards error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── PUT /api/cards/:id ───────────────────────────────────────────────────────
app.put('/api/cards/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Card not found' });
    }

    const { name, company, job_title, email, phone, website, address, notes, tags } = req.body;

    if (name !== undefined && (!name || !name.trim())) {
      return res.status(400).json({ error: 'Name cannot be empty' });
    }

    const now = new Date().toISOString();
    const tagsJson = tags !== undefined
      ? JSON.stringify(Array.isArray(tags) ? tags : [])
      : existing.tags;

    const stmt = db.prepare(`
      UPDATE cards SET
        name = ?,
        company = ?,
        job_title = ?,
        email = ?,
        phone = ?,
        website = ?,
        address = ?,
        notes = ?,
        tags = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      name !== undefined ? name.trim() : existing.name,
      company !== undefined ? (company || null) : existing.company,
      job_title !== undefined ? (job_title || null) : existing.job_title,
      email !== undefined ? (email || null) : existing.email,
      phone !== undefined ? (phone || null) : existing.phone,
      website !== undefined ? (website || null) : existing.website,
      address !== undefined ? (address || null) : existing.address,
      notes !== undefined ? (notes || null) : existing.notes,
      tagsJson,
      now,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    res.json(parseCard(updated));
  } catch (err) {
    console.error('PUT /api/cards/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE /api/cards/:id ────────────────────────────────────────────────────
app.delete('/api/cards/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM cards WHERE id = ?').get(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Card not found' });
    }

    db.prepare('DELETE FROM cards WHERE id = ?').run(req.params.id);
    res.json({ message: 'Card deleted successfully', id: Number(req.params.id) });
  } catch (err) {
    console.error('DELETE /api/cards/:id error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/tags ────────────────────────────────────────────────────────────
app.get('/api/tags', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT tags FROM cards WHERE tags IS NOT NULL AND tags != \'[]\'').all();

    const tagSet = new Set();
    rows.forEach(row => {
      try {
        const tags = JSON.parse(row.tags || '[]');
        if (Array.isArray(tags)) {
          tags.forEach(t => {
            if (t && typeof t === 'string') tagSet.add(t.trim());
          });
        }
      } catch {
        // skip invalid JSON
      }
    });

    res.json(Array.from(tagSet).sort());
  } catch (err) {
    console.error('GET /api/tags error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/export/csv ──────────────────────────────────────────────────────
app.get('/api/export/csv', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM cards ORDER BY name ASC').all();

    const headers = ['id', 'name', 'company', 'job_title', 'email', 'phone', 'website', 'address', 'notes', 'tags', 'created_at', 'updated_at'];

    function escapeCSV(value) {
      if (value === null || value === undefined) return '';
      const str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }

    const csvLines = [
      headers.join(','),
      ...rows.map(row => {
        const card = parseCard(row);
        return headers.map(h => {
          if (h === 'tags') return escapeCSV(card.tags.join(';'));
          return escapeCSV(card[h]);
        }).join(',');
      }),
    ];

    const csvContent = csvLines.join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="business-cards.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error('GET /api/export/csv error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/export/vcard ────────────────────────────────────────────────────
app.get('/api/export/vcard', (req, res) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM cards ORDER BY name ASC').all();

    function escapeVCard(value) {
      if (!value) return '';
      return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;')
        .replace(/\n/g, '\\n');
    }

    const vcards = rows.map(row => {
      const card = parseCard(row);
      const lines = ['BEGIN:VCARD', 'VERSION:3.0'];

      lines.push(`FN:${escapeVCard(card.name)}`);

      // Split name into parts (last, first) if possible
      const nameParts = card.name.trim().split(/\s+/);
      const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
      const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : nameParts[0];
      lines.push(`N:${escapeVCard(lastName)};${escapeVCard(firstName)};;;`);

      if (card.company) lines.push(`ORG:${escapeVCard(card.company)}`);
      if (card.job_title) lines.push(`TITLE:${escapeVCard(card.job_title)}`);
      if (card.email) lines.push(`EMAIL;TYPE=INTERNET:${escapeVCard(card.email)}`);
      if (card.phone) lines.push(`TEL;TYPE=WORK,VOICE:${escapeVCard(card.phone)}`);
      if (card.website) lines.push(`URL:${escapeVCard(card.website)}`);
      if (card.address) lines.push(`ADR;TYPE=WORK:;;${escapeVCard(card.address)};;;;`);
      if (card.notes) lines.push(`NOTE:${escapeVCard(card.notes)}`);

      if (Array.isArray(card.tags) && card.tags.length > 0) {
        lines.push(`CATEGORIES:${card.tags.map(escapeVCard).join(',')}`);
      }

      if (card.created_at) {
        const ts = card.created_at.replace(/[-:]/g, '').replace(' ', 'T').split('.')[0] + 'Z';
        lines.push(`REV:${ts}`);
      }

      lines.push('END:VCARD');
      return lines.join('\r\n');
    });

    const vcfContent = vcards.join('\r\n\r\n');

    res.setHeader('Content-Type', 'text/vcard');
    res.setHeader('Content-Disposition', 'attachment; filename="business-cards.vcf"');
    res.send(vcfContent);
  } catch (err) {
    console.error('GET /api/export/vcard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Business Card API running on http://localhost:${PORT}`);
});

module.exports = app;
