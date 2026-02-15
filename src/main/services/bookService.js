const { getDb } = require('../database/db');
const { bookSchema, parseSchema } = require('./validators');

function listQueryBase() {
  return `
    SELECT
      b.*,
      GROUP_CONCAT(a.name, ', ') AS authors,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM loans l
          WHERE l.book_id = b.id AND l.status IN ('active', 'overdue')
        ) THEN 1
        ELSE 0
      END AS is_loaned,
      (
        SELECT l.status
        FROM loans l
        WHERE l.book_id = b.id AND l.status IN ('active', 'overdue')
        ORDER BY l.loan_date DESC, l.id DESC
        LIMIT 1
      ) AS loan_status,
      (
        SELECT u.name
        FROM loans l
        JOIN users u ON u.id = l.user_id
        WHERE l.book_id = b.id AND l.status IN ('active', 'overdue')
        ORDER BY l.loan_date DESC, l.id DESC
        LIMIT 1
      ) AS loaned_to
    FROM books b
    LEFT JOIN book_authors ba ON ba.book_id = b.id
    LEFT JOIN authors a ON a.id = ba.author_id
  `;
}

function buildFilters(filters = {}) {
  const where = [];
  const params = {};

  if (filters.search) {
    where.push('(b.title LIKE @search OR b.subtitle LIKE @search OR b.genre LIKE @search OR a.name LIKE @search)');
    params.search = `%${filters.search.trim()}%`;
  }
  if (filters.read_status) {
    where.push('b.read_status = @read_status');
    params.read_status = filters.read_status;
  }
  if (filters.genre) {
    where.push('b.genre = @genre');
    params.genre = filters.genre;
  }
  if (filters.favorite !== undefined && filters.favorite !== null) {
    where.push('b.favorite = @favorite');
    params.favorite = filters.favorite ? 1 : 0;
  }
  if (filters.loanable !== undefined && filters.loanable !== null) {
    where.push('b.loanable = @loanable');
    params.loanable = filters.loanable ? 1 : 0;
  }
  if (filters.label_printed !== undefined && filters.label_printed !== null) {
    where.push('b.label_printed = @label_printed');
    params.label_printed = filters.label_printed ? 1 : 0;
  }
  if (filters.collection_id !== undefined && filters.collection_id !== null && filters.collection_id !== '') {
    where.push(
      `EXISTS (
        SELECT 1 FROM book_collections bc
        WHERE bc.book_id = b.id AND bc.collection_id = @collection_id
      )`
    );
    params.collection_id = Number(filters.collection_id);
  }

  return {
    whereClause: where.length ? `WHERE ${where.join(' AND ')}` : '',
    params,
  };
}

function getAll(filters = {}) {
  const { whereClause, params } = buildFilters(filters);
  const sql = `
    ${listQueryBase()}
    ${whereClause}
    GROUP BY b.id
    ORDER BY b.updated_at DESC
  `;
  return getDb().prepare(sql).all(params);
}

function getById(id) {
  const book = getDb()
    .prepare(
      `SELECT
        b.*,
        CASE
          WHEN EXISTS (
            SELECT 1 FROM loans l
            WHERE l.book_id = b.id AND l.status IN ('active', 'overdue')
          ) THEN 1
          ELSE 0
        END AS is_loaned,
        (
          SELECT l.status
          FROM loans l
          WHERE l.book_id = b.id AND l.status IN ('active', 'overdue')
          ORDER BY l.loan_date DESC, l.id DESC
          LIMIT 1
        ) AS loan_status,
        (
          SELECT u.name
          FROM loans l
          JOIN users u ON u.id = l.user_id
          WHERE l.book_id = b.id AND l.status IN ('active', 'overdue')
          ORDER BY l.loan_date DESC, l.id DESC
          LIMIT 1
        ) AS loaned_to
      FROM books b
      WHERE b.id = ?`
    )
    .get(id);
  if (!book) return null;

  const bookAuthors = getDb()
    .prepare(
      `SELECT ba.author_id, ba.author_order, ba.role, a.name
       FROM book_authors ba
       JOIN authors a ON a.id = ba.author_id
       WHERE ba.book_id = ?
       ORDER BY ba.author_order ASC, a.name COLLATE NOCASE`
    )
    .all(id);

  return { ...book, bookAuthors };
}

function search(query) {
  return getAll({ search: query });
}

function upsertAuthors(tx, bookId, authors) {
  tx.prepare('DELETE FROM book_authors WHERE book_id = ?').run(bookId);
  if (!authors || authors.length === 0) return;

  const insert = tx.prepare(
    `INSERT INTO book_authors (book_id, author_id, author_order, role)
     VALUES (?, ?, ?, ?)`
  );

  authors.forEach((a, idx) => {
    insert.run(bookId, a.id, a.author_order || idx + 1, a.role || 'author');
  });
}

function create(input) {
  const data = parseSchema(bookSchema, input);
  const { authors, ...bookData } = data;
  const db = getDb();

  const tx = db.transaction(() => {
    const result = db
      .prepare(
        `INSERT INTO books (
          isbn, title, subtitle, publisher, publication_date, edition, language, pages,
          format, genre, tags, description, cover_url, cdu, signature, location, condition,
          acquisition_date, acquisition_source, purchase_price, current_value,
          notes, rating, read_status, favorite, loanable, label_printed
        ) VALUES (
          @isbn, @title, @subtitle, @publisher, @publication_date, @edition, @language, @pages,
          @format, @genre, @tags, @description, @cover_url, @cdu, @signature, @location, @condition,
          @acquisition_date, @acquisition_source, @purchase_price, @current_value,
          @notes, @rating, @read_status, @favorite, @loanable, @label_printed
        )`
      )
      .run(bookData);

    const bookId = Number(result.lastInsertRowid);
    upsertAuthors(db, bookId, authors);
    return bookId;
  });

  const id = tx();
  return getById(id);
}

function update(id, input) {
  const existing = getById(id);
  if (!existing) {
    throw new Error('Libro no encontrado');
  }

  const data = parseSchema(bookSchema, {
    ...existing,
    ...input,
    favorite: input.favorite ?? existing.favorite,
    loanable: input.loanable ?? existing.loanable,
    label_printed: input.label_printed ?? existing.label_printed,
    authors: input.authors ?? existing.bookAuthors?.map((a) => ({
      id: a.author_id,
      role: a.role,
      author_order: a.author_order,
    })),
  });

  const { authors, ...bookData } = data;
  const db = getDb();

  const tx = db.transaction(() => {
    db
      .prepare(
        `UPDATE books SET
          isbn=@isbn, title=@title, subtitle=@subtitle, publisher=@publisher,
          publication_date=@publication_date, edition=@edition, language=@language,
          pages=@pages, format=@format, genre=@genre, tags=@tags, description=@description,
          cover_url=@cover_url, cdu=@cdu, signature=@signature, location=@location, condition=@condition,
          acquisition_date=@acquisition_date, acquisition_source=@acquisition_source,
          purchase_price=@purchase_price, current_value=@current_value, notes=@notes,
          rating=@rating, read_status=@read_status, favorite=@favorite, loanable=@loanable,
          label_printed=@label_printed,
          updated_at=CURRENT_TIMESTAMP
        WHERE id=@id`
      )
      .run({ ...bookData, id });

    upsertAuthors(db, id, authors);
  });

  tx();
  return getById(id);
}

function remove(id) {
  const existing = getById(id);
  if (!existing) {
    throw new Error('Libro no encontrado');
  }

  getDb().prepare('DELETE FROM books WHERE id = ?').run(id);
  return true;
}

module.exports = { getAll, getById, create, update, remove, search };
