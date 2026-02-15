const BNE_SRU_BASE = 'https://catalogo.bne.es/view/sru/34BNE_INST';

function normalizeDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (/^\d{4}$/.test(str)) return `${str}-01-01`;
  if (/^\d{4}-\d{2}$/.test(str)) return `${str}-01`;
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const yearMatch = str.match(/(\d{4})/);
  return yearMatch ? `${yearMatch[1]}-01-01` : null;
}

function normalizeLanguage(lang) {
  if (!lang) return 'es';
  const normalized = String(lang).toLowerCase().slice(0, 2);
  if (['es', 'en', 'fr', 'pt', 'de', 'it'].includes(normalized)) {
    return normalized;
  }
  return 'other';
}

function cleanIsbn(value) {
  return String(value || '').replace(/[^0-9Xx]/g, '').toUpperCase();
}

function decodeXmlEntities(input) {
  return String(input || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function stripXml(value) {
  return decodeXmlEntities(String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function getTagValues(xml, tag) {
  const values = [];
  const pattern = new RegExp(`<(?:\\w+:)?${tag}[^>]*>([\\s\\S]*?)<\\/(?:\\w+:)?${tag}>`, 'gi');
  let match;
  while ((match = pattern.exec(xml)) !== null) {
    const value = stripXml(match[1]);
    if (value) values.push(value);
  }
  return values;
}

function getFirst(xml, tag) {
  const values = getTagValues(xml, tag);
  return values.length > 0 ? values[0] : null;
}

function parseRecordData(xml) {
  const records = [];
  const recordPattern = /<recordData[^>]*>([\s\S]*?)<\/recordData>/gi;
  let recordMatch;

  while ((recordMatch = recordPattern.exec(xml)) !== null) {
    const recordXml = decodeXmlEntities(recordMatch[1]);

    const title = getFirst(recordXml, 'title');
    if (!title) continue;

    const date = getFirst(recordXml, 'date');
    const languageRaw = getFirst(recordXml, 'language');
    const publisher = getFirst(recordXml, 'publisher');
    const description = getFirst(recordXml, 'description');
    const creators = getTagValues(recordXml, 'creator');
    const identifiers = getTagValues(recordXml, 'identifier');

    const isbn = identifiers
      .map(cleanIsbn)
      .find((id) => id.length === 10 || id.length === 13) || null;

    records.push({
      source: 'bne',
      external_id: getFirst(recordXml, 'identifier') || null,
      isbn,
      isbns: identifiers.map(cleanIsbn).filter((id) => id.length === 10 || id.length === 13),
      title,
      subtitle: null,
      authors: creators,
      publisher,
      publication_date: normalizeDate(date),
      language: normalizeLanguage(languageRaw),
      pages: null,
      genre: getFirst(recordXml, 'subject'),
      description,
      cover_url: null,
    });
  }

  return records;
}

function quoteTerm(value) {
  const text = String(value || '').trim();
  if (!text) return '';
  return /\s/.test(text) ? `"${text}"` : text;
}

function buildCql(query, options = {}) {
  const mode = options.mode || 'general';
  const q = String(query || '').trim();
  const terms = [];

  if (mode === 'isbn') {
    terms.push(`alma.isbn=${quoteTerm(cleanIsbn(q) || q)}`);
  } else if (mode === 'title') {
    terms.push(`alma.title=${quoteTerm(q)}`);
  } else if (mode === 'author') {
    terms.push(`alma.creator=${quoteTerm(q)}`);
  } else {
    terms.push(`alma.all_for_ui=${quoteTerm(q)}`);
  }

  if (mode === 'publisher') {
    terms.push(`alma.all_for_ui=${quoteTerm(q)}`);
  }

  if (options.author && mode !== 'author') {
    terms.push(`alma.creator=${quoteTerm(options.author)}`);
  }
  if (options.publisher && mode !== 'publisher') {
    terms.push(`alma.all_for_ui=${quoteTerm(options.publisher)}`);
  }
  if (options.year) {
    terms.push(`alma.all_for_ui=${quoteTerm(String(options.year))}`);
  }
  if (options.language) {
    terms.push(`alma.language=${quoteTerm(options.language)}`);
  }

  return terms.join(' and ');
}

async function fetchBne(cql, startRecord, maximumRecords) {
  const params = new URLSearchParams({
    version: '1.2',
    operation: 'searchRetrieve',
    query: cql,
    startRecord: String(startRecord),
    maximumRecords: String(maximumRecords),
    recordSchema: 'dc',
    recordPacking: 'xml',
  });

  const url = `${BNE_SRU_BASE}?${params.toString()}`;
  console.log(`[bneBookService] GET ${url}`);
  const res = await fetch(url, {
    headers: {
      Accept: 'application/xml,text/xml;q=0.9,*/*;q=0.8',
      'User-Agent': 'MiBiblioteca/1.0 (desktop app)',
    },
  });
  console.log(`[bneBookService] ${res.status} ${res.statusText} <- ${url}`);

  if (!res.ok) {
    throw new Error(`Error consultando BNE (${res.status})`);
  }

  return res.text();
}

async function searchBooks(query, options = {}, maxRecords = 100) {
  const cql = buildCql(query, options);
  const xml = await fetchBne(cql, 1, Math.min(maxRecords, 100));
  return parseRecordData(xml);
}

module.exports = {
  searchBooks,
};
