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

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function toSecureImageUrl(url) {
  if (!url) return null;
  const raw = String(url).trim();
  if (!raw) return null;
  if (raw.startsWith('https://')) return raw;
  if (raw.startsWith('http://')) return `https://${raw.slice('http://'.length)}`;
  return raw;
}

function cleanIsbn(value) {
  return String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

function pickIsbn(candidates = []) {
  if (!Array.isArray(candidates) || candidates.length === 0) return null;
  const cleaned = candidates.map(cleanIsbn).filter(Boolean);

  const isbn13 = cleaned.find((i) => i.length === 13);
  if (isbn13) return isbn13;

  const isbn10 = cleaned.find((i) => i.length === 10);
  return isbn10 || cleaned[0] || null;
}

function quoteTerm(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return /\s/.test(text) ? `"${text}"` : text;
}

async function fetchJson(url) {
  console.log(`[externalBookService] GET ${url}`);
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'MiBiblioteca/1.0 (desktop app)',
    },
  });
  console.log(`[externalBookService] ${res.status} ${res.statusText} <- ${url}`);

  if (!res.ok) {
    throw new Error(`Error consultando catálogo externo (${res.status})`);
  }

  return res.json();
}

function buildOpenLibraryUrl(query, options = {}, limit = 100) {
  const mode = options.mode || 'general';
  const q = String(query || '').trim();
  const params = new URLSearchParams({
    limit: String(limit),
  });

  if (mode === 'isbn') {
    const isbn = cleanIsbn(q);
    if (isbn) {
      params.set('isbn', isbn);
    } else {
      params.set('q', q);
    }
  } else if (mode === 'title') {
    params.set('title', q);
  } else if (mode === 'author') {
    params.set('author', q);
  } else {
    params.set('q', q);
  }

  if (mode !== 'author' && options.author) {
    params.set('author', String(options.author).trim());
  }

  const qParts = [];
  if (mode === 'publisher') {
    qParts.push(`publisher:${quoteTerm(q)}`);
  }
  if (mode !== 'publisher' && options.publisher) {
    qParts.push(`publisher:${quoteTerm(options.publisher)}`);
  }
  if (options.year) {
    qParts.push(`first_publish_year:${String(options.year).trim()}`);
  }
  if (options.language) {
    qParts.push(`language:${String(options.language).trim()}`);
  }

  if (qParts.length > 0) {
    const baseQ = params.get('q');
    params.set('q', [baseQ, ...qParts].filter(Boolean).join(' '));
  }

  return `${OPEN_LIBRARY_SEARCH_BASE}?${params.toString()}`;
}

function buildGoogleQuery(query, options = {}) {
  const mode = options.mode || 'general';
  const q = String(query || '').trim();
  const parts = [];

  if (mode === 'isbn') {
    parts.push(`isbn:${cleanIsbn(q) || quoteTerm(q)}`);
  } else if (mode === 'title') {
    parts.push(`intitle:${quoteTerm(q)}`);
  } else if (mode === 'author') {
    parts.push(`inauthor:${quoteTerm(q)}`);
  } else if (mode === 'publisher') {
    parts.push(`inpublisher:${quoteTerm(q)}`);
  } else {
    parts.push(q);
  }

  if (mode !== 'author' && options.author) {
    parts.push(`inauthor:${quoteTerm(options.author)}`);
  }
  if (mode !== 'publisher' && options.publisher) {
    parts.push(`inpublisher:${quoteTerm(options.publisher)}`);
  }
  if (options.year) {
    parts.push(String(options.year).trim());
  }

  return parts.filter(Boolean).join(' ');
}

async function searchOpenLibrary(query, options = {}, limit = 100) {
  const url = buildOpenLibraryUrl(query, options, limit);
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

async function searchGoogleBooks(query, options = {}, limit = 40) {
  const key = process.env.GOOGLE_BOOKS_API_KEY;
  const params = new URLSearchParams({
    q: buildGoogleQuery(query, options),
    maxResults: String(Math.min(limit, 40)),
    printType: 'books',
    projection: 'lite',
  });

  if (options.language && options.language !== 'other') {
    params.set('langRestrict', options.language);
  }

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

    const cover = toSecureImageUrl(info.imageLinks?.thumbnail || info.imageLinks?.smallThumbnail || null);

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

function postFilterResults(items, query, options = {}) {
  const mode = options.mode || 'general';
  const q = String(query || '').trim();
  const qNorm = normalizeText(q);

  return items.filter((item) => {
    if (options.year) {
      const year = String(options.year).trim();
      if (!(item.publication_date || '').startsWith(year)) {
        return false;
      }
    }

    if (options.language) {
      if (item.language !== options.language) {
        return false;
      }
    }

    if (options.publisher) {
      const pubNorm = normalizeText(options.publisher);
      if (!normalizeText(item.publisher).includes(pubNorm)) {
        return false;
      }
    }

    if (!options.exact) {
      return true;
    }

    if (mode === 'isbn') {
      return cleanIsbn(item.isbn) === cleanIsbn(q);
    }

    if (mode === 'title') {
      return normalizeText(item.title) === qNorm;
    }

    if (mode === 'author') {
      return (item.authors || []).some((name) => normalizeText(name) === qNorm);
    }

    if (mode === 'publisher') {
      return normalizeText(item.publisher) === qNorm;
    }

    return normalizeText(item.title).includes(qNorm) || cleanIsbn(item.isbn) === cleanIsbn(q);
  });
}

async function searchBooks(query, options = {}) {
  const q = String(query || '').trim();
  const mode = options.mode || 'general';
  const minLength = mode === 'isbn' ? 3 : 2;

  if (q.length < minLength) {
    return [];
  }

  const settled = await Promise.allSettled([
    searchOpenLibrary(q, options, 100),
    searchGoogleBooks(q, options, 40),
  ]);

  const merged = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      merged.push(...result.value);
    }
  }

  const filtered = postFilterResults(merged, q, options);
  if (options.includeVariants) {
    return filtered;
  }

  return dedupeResults(filtered);
}

module.exports = {
  searchBooks,
};
