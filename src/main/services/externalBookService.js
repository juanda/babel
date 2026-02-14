const GOOGLE_BOOKS_API_BASE = 'https://www.googleapis.com/books/v1/volumes';
const OPEN_LIBRARY_SEARCH_BASE = 'https://openlibrary.org/search.json';

function normalizeDate(value) {
  if (!value) return null;
  const str = String(value).trim();

  if (/^\d{4}$/.test(str)) return `${str}-01-01`;
  if (/^\d{4}-\d{2}$/.test(str)) return `${str}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

  return null;
}

function normalizeLanguage(lang) {
  if (!lang) return 'es';
  const normalized = String(lang).toLowerCase().slice(0, 2);
  if (['es', 'en', 'fr', 'pt', 'de', 'it'].includes(normalized)) {
    return normalized;
  }
  return 'other';
}

function pickIsbn(candidates = []) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const cleaned = candidates
    .map((v) => String(v || '').replace(/[^0-9Xx]/g, ''))
    .filter(Boolean);

  const isbn13 = cleaned.find((i) => i.length === 13);
  if (isbn13) return isbn13;

  const isbn10 = cleaned.find((i) => i.length === 10);
  return isbn10 || cleaned[0] || null;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MiBiblioteca/1.0 (desktop app)',
    },
  });

  if (!res.ok) {
    throw new Error(`Error consultando catálogo externo (${res.status})`);
  }

  return res.json();
}

async function searchOpenLibrary(query, limit = 8) {
  const url = `${OPEN_LIBRARY_SEARCH_BASE}?q=${encodeURIComponent(query)}&limit=${limit}`;
  const payload = await fetchJson(url);
  const docs = Array.isArray(payload?.docs) ? payload.docs : [];

  return docs.map((doc) => {
    const isbn = pickIsbn(doc.isbn || []);
    const coverUrl = isbn ? `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg` : null;

    return {
      source: 'openlibrary',
      external_id: doc.key || null,
      isbn,
      title: doc.title || null,
      subtitle: doc.subtitle || null,
      authors: Array.isArray(doc.author_name) ? doc.author_name.filter(Boolean) : [],
      publisher: Array.isArray(doc.publisher) && doc.publisher[0] ? doc.publisher[0] : null,
      publication_date: normalizeDate(doc.first_publish_year),
      language: normalizeLanguage(Array.isArray(doc.language) ? doc.language[0] : null),
      pages: Number.isFinite(doc.number_of_pages_median) ? Number(doc.number_of_pages_median) : null,
      genre: Array.isArray(doc.subject) && doc.subject[0] ? doc.subject[0] : null,
      description: null,
      cover_url: coverUrl,
    };
  }).filter((item) => item.title);
}

async function searchGoogleBooks(query, limit = 8) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const params = new URLSearchParams({
    q: query,
    maxResults: String(limit),
    printType: 'books',
    projection: 'lite',
  });
  if (key) {
    params.set('key', key);
  }

  const url = `${GOOGLE_BOOKS_API_BASE}?${params.toString()}`;
  const payload = await fetchJson(url);
  const items = Array.isArray(payload?.items) ? payload.items : [];

  return items.map((item) => {
    const info = item.volumeInfo || {};
    const identifiers = Array.isArray(info.industryIdentifiers)
      ? info.industryIdentifiers.map((i) => i.identifier)
      : [];

    const cover = info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null;

    return {
      source: 'googlebooks',
      external_id: item.id || null,
      isbn: pickIsbn(identifiers),
      title: info.title || null,
      subtitle: info.subtitle || null,
      authors: Array.isArray(info.authors) ? info.authors.filter(Boolean) : [],
      publisher: info.publisher || null,
      publication_date: normalizeDate(info.publishedDate),
      language: normalizeLanguage(info.language),
      pages: Number.isFinite(info.pageCount) ? Number(info.pageCount) : null,
      genre: Array.isArray(info.categories) && info.categories[0] ? info.categories[0] : null,
      description: info.description || null,
      cover_url: cover,
    };
  }).filter((item) => item.title);
}

function dedupeResults(items) {
  const seen = new Set();
  const out = [];

  for (const item of items) {
    const key = (item.isbn || `${item.title}|${(item.authors || []).join(',')}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }

  return out;
}

async function searchBooks(query) {
  const q = String(query || '').trim();
  if (q.length < 2) {
    return [];
  }

  const settled = await Promise.allSettled([
    searchOpenLibrary(q, 8),
    searchGoogleBooks(q, 8),
  ]);

  const merged = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      merged.push(...result.value);
    }
  }

  return dedupeResults(merged).slice(0, 12);
}

module.exports = {
  searchBooks,
};
