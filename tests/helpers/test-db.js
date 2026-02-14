const fs = require('fs');
const path = require('path');
const { Database } = require('bun:sqlite');

function buildCompatDb() {
  const raw = new Database(':memory:');

  function normalizeSql(sql) {
    return sql.replace(/@([a-zA-Z_][a-zA-Z0-9_]*)/g, '$$$1');
  }

  function normalizeArgs(args) {
    if (args.length === 1 && args[0] && typeof args[0] === 'object' && !Array.isArray(args[0])) {
      const out = {};
      for (const [key, value] of Object.entries(args[0])) {
        out[key.startsWith('$') ? key : `$${key}`] = value;
      }
      return [out];
    }
    return args;
  }

  return {
    pragma(sql) {
      raw.exec(`PRAGMA ${sql}`);
    },
    exec(sql) {
      raw.exec(sql);
    },
    prepare(sql) {
      const stmt = raw.prepare(normalizeSql(sql));
      return {
        run(...args) {
          const result = stmt.run(...normalizeArgs(args));
          return {
            changes: result?.changes ?? 0,
            lastInsertRowid: result?.lastInsertRowid ?? result?.lastInsertRowid ?? 0,
          };
        },
        get(...args) {
          return stmt.get(...normalizeArgs(args));
        },
        all(...args) {
          return stmt.all(...normalizeArgs(args));
        },
      };
    },
    transaction(fn) {
      return (...args) => {
        raw.exec('BEGIN');
        try {
          const out = fn(...args);
          raw.exec('COMMIT');
          return out;
        } catch (error) {
          raw.exec('ROLLBACK');
          throw error;
        }
      };
    },
    close() {
      raw.close();
    },
  };
}

function createInMemoryDb() {
  const db = buildCompatDb();
  const schemaPath = path.resolve(__dirname, '../../src/main/database/schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');

  db.pragma('foreign_keys = ON');
  db.exec(schema);
  return db;
}

function loadServiceWithDb(serviceRelativePathFromRoot, db) {
  const root = path.resolve(__dirname, '../..');
  const dbModulePath = path.resolve(root, 'src/main/database/db.js');
  const servicePath = path.resolve(root, serviceRelativePathFromRoot);

  delete require.cache[servicePath];
  delete require.cache[dbModulePath];

  require.cache[dbModulePath] = {
    id: dbModulePath,
    filename: dbModulePath,
    loaded: true,
    exports: {
      getDb: () => db,
      initialize: () => db,
      close: () => db.close(),
    },
  };

  return require(servicePath);
}

module.exports = {
  createInMemoryDb,
  loadServiceWithDb,
};
