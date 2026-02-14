const { z } = require('zod');

const nullableTrimmed = () =>
  z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (typeof v === 'string' ? v.trim() : v))
    .transform((v) => (v === '' ? null : v));

const dateString = z
  .union([z.string(), z.null(), z.undefined()])
  .refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Fecha inválida (YYYY-MM-DD)')
  .transform((v) => v || null);

const urlString = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((v) => (typeof v === 'string' ? v.trim() : v))
  .refine((v) => !v || /^https?:\/\//i.test(v), 'URL inválida')
  .transform((v) => v || null);

const authorSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  biography: nullableTrimmed(),
  birth_date: dateString,
  death_date: dateString,
  nationality: nullableTrimmed(),
  photo_url: urlString,
  website: urlString,
  notes: nullableTrimmed(),
});

const bookAuthorSchema = z.object({
  id: z.number().int().positive(),
  role: z.enum(['author', 'editor', 'translator', 'illustrator']).optional().default('author'),
  author_order: z.number().int().min(1).optional(),
});

const bookSchema = z.object({
  isbn: nullableTrimmed(),
  title: z.string().trim().min(1, 'El título es obligatorio'),
  subtitle: nullableTrimmed(),
  publisher: nullableTrimmed(),
  publication_date: dateString,
  edition: nullableTrimmed(),
  language: z.string().trim().min(1).default('es'),
  pages: z.number().int().positive().nullable().optional().transform((v) => v ?? null),
  format: z.enum(['hardcover', 'paperback', 'ebook']).nullable().optional().transform((v) => v ?? null),
  genre: nullableTrimmed(),
  tags: z.union([z.string(), z.null(), z.undefined()]).transform((v) => v || null),
  description: nullableTrimmed(),
  cover_url: urlString,
  location: nullableTrimmed(),
  condition: z.enum(['excellent', 'good', 'fair', 'poor']).nullable().optional().transform((v) => v ?? null),
  acquisition_date: dateString,
  acquisition_source: z.enum(['purchase', 'gift', 'exchange']).nullable().optional().transform((v) => v ?? null),
  purchase_price: z.number().nonnegative().nullable().optional().transform((v) => v ?? null),
  current_value: z.number().nonnegative().nullable().optional().transform((v) => v ?? null),
  notes: nullableTrimmed(),
  rating: z.number().int().min(1).max(5).nullable().optional().transform((v) => v ?? null),
  read_status: z.enum(['unread', 'reading', 'completed']).default('unread'),
  favorite: z.union([z.boolean(), z.number()]).optional().transform((v) => (v ? 1 : 0)),
  loanable: z.union([z.boolean(), z.number()]).optional().transform((v) => (v === undefined ? 1 : v ? 1 : 0)),
  authors: z.array(bookAuthorSchema).optional().default([]),
});

const userSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es obligatorio'),
  email: z
    .union([z.string(), z.null(), z.undefined()])
    .transform((v) => (typeof v === 'string' ? v.trim() : v))
    .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Email inválido')
    .transform((v) => v || null),
  phone: nullableTrimmed(),
  address: nullableTrimmed(),
  notes: nullableTrimmed(),
  trust_level: z.number().int().min(1).max(5).optional().default(3),
  active: z.union([z.boolean(), z.number()]).optional().transform((v) => (v === undefined ? 1 : v ? 1 : 0)),
});

const loanSchema = z.object({
  book_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  loan_date: dateString.refine((v) => !!v, 'loan_date es obligatorio'),
  due_date: dateString.refine((v) => !!v, 'due_date es obligatorio'),
  condition_on_loan: z.enum(['excellent', 'good', 'fair', 'poor']).nullable().optional().transform((v) => v ?? null),
  notes: nullableTrimmed(),
});

const finishReadingSchema = z.object({
  finish_date: dateString.optional(),
  rating: z.number().int().min(1).max(5).nullable().optional().transform((v) => v ?? null),
  review: nullableTrimmed(),
});

function parseSchema(schema, input) {
  const result = schema.safeParse(input);
  if (!result.success) {
    const error = result.error.issues.map((i) => i.message).join(', ');
    const e = new Error(error || 'Datos inválidos');
    e.details = result.error.issues;
    throw e;
  }
  return result.data;
}

module.exports = {
  authorSchema,
  bookSchema,
  userSchema,
  loanSchema,
  finishReadingSchema,
  parseSchema,
};
