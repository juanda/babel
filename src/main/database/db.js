const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { app } = require('electron');

let db = null;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'biblioteca.db');
}

function initialize() {
  const dbPath = getDbPath();
  const dbDir = path.dirname(dbPath);

  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Optimizaciones
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');

  // Ejecutar schema
  const schemaPath = path.join(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  db.exec(schema);

  console.log(`[DB] Base de datos inicializada en: ${dbPath}`);
  return db;
}

function getDb() {
  if (!db) {
    throw new Error('Base de datos no inicializada. Llama a initialize() primero.');
  }
  return db;
}

function close() {
  if (db) {
    db.close();
    db = null;
    console.log('[DB] Conexión cerrada.');
  }
}

module.exports = { initialize, getDb, close, getDbPath };
