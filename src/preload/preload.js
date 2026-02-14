const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Books
  books: {
    getAll: (filters) => ipcRenderer.invoke('books:getAll', filters),
    getById: (id) => ipcRenderer.invoke('books:getById', id),
    create: (data) => ipcRenderer.invoke('books:create', data),
    update: (id, data) => ipcRenderer.invoke('books:update', id, data),
    delete: (id) => ipcRenderer.invoke('books:delete', id),
    search: (query) => ipcRenderer.invoke('books:search', query),
    uploadCover: (filePath) => ipcRenderer.invoke('books:uploadCover', filePath),
  },

  // Authors
  authors: {
    getAll: () => ipcRenderer.invoke('authors:getAll'),
    getById: (id) => ipcRenderer.invoke('authors:getById', id),
    create: (data) => ipcRenderer.invoke('authors:create', data),
    update: (id, data) => ipcRenderer.invoke('authors:update', id, data),
    delete: (id) => ipcRenderer.invoke('authors:delete', id),
    search: (query) => ipcRenderer.invoke('authors:search', query),
  },

  // Loans
  loans: {
    getAll: (filters) => ipcRenderer.invoke('loans:getAll', filters),
    getById: (id) => ipcRenderer.invoke('loans:getById', id),
    create: (data) => ipcRenderer.invoke('loans:create', data),
    return: (id, data) => ipcRenderer.invoke('loans:return', id, data),
    getActive: () => ipcRenderer.invoke('loans:getActive'),
    getOverdue: () => ipcRenderer.invoke('loans:getOverdue'),
    getByUser: (userId) => ipcRenderer.invoke('loans:getByUser', userId),
    getByBook: (bookId) => ipcRenderer.invoke('loans:getByBook', bookId),
  },

  // Users
  users: {
    getAll: () => ipcRenderer.invoke('users:getAll'),
    getById: (id) => ipcRenderer.invoke('users:getById', id),
    create: (data) => ipcRenderer.invoke('users:create', data),
    update: (id, data) => ipcRenderer.invoke('users:update', id, data),
    delete: (id) => ipcRenderer.invoke('users:delete', id),
    search: (query) => ipcRenderer.invoke('users:search', query),
  },

  // Reading
  reading: {
    startReading: (bookId) => ipcRenderer.invoke('reading:start', bookId),
    finishReading: (bookId, data) => ipcRenderer.invoke('reading:finish', bookId, data),
    getHistory: (bookId) => ipcRenderer.invoke('reading:getHistory', bookId),
    getStatistics: () => ipcRenderer.invoke('reading:getStatistics'),
  },

  // Collections
  collections: {
    getAll: () => ipcRenderer.invoke('collections:getAll'),
    getById: (id) => ipcRenderer.invoke('collections:getById', id),
    create: (data) => ipcRenderer.invoke('collections:create', data),
    update: (id, data) => ipcRenderer.invoke('collections:update', id, data),
    delete: (id) => ipcRenderer.invoke('collections:delete', id),
    addBook: (collectionId, bookId) => ipcRenderer.invoke('collections:addBook', collectionId, bookId),
    removeBook: (collectionId, bookId) => ipcRenderer.invoke('collections:removeBook', collectionId, bookId),
    getBooks: (collectionId) => ipcRenderer.invoke('collections:getBooks', collectionId),
  },

  // Reports
  reports: {
    getDashboard: () => ipcRenderer.invoke('reports:getDashboard'),
    getGenreDistribution: () => ipcRenderer.invoke('reports:getGenreDistribution'),
    getReadingTrend: () => ipcRenderer.invoke('reports:getReadingTrend'),
    getTopAuthors: () => ipcRenderer.invoke('reports:getTopAuthors'),
    getLoanStats: () => ipcRenderer.invoke('reports:getLoanStats'),
    exportCSV: (type) => ipcRenderer.invoke('reports:exportCSV', type),
    exportExcel: (type) => ipcRenderer.invoke('reports:exportExcel', type),
    exportPDF: (type) => ipcRenderer.invoke('reports:exportPDF', type),
  },

  // System
  system: {
    getAppVersion: () => ipcRenderer.invoke('system:getAppVersion'),
    selectFile: (options) => ipcRenderer.invoke('system:selectFile', options),
    backup: () => ipcRenderer.invoke('system:backup'),
    restore: (filePath) => ipcRenderer.invoke('system:restore', filePath),
    getConfig: () => ipcRenderer.invoke('system:getConfig'),
    setConfig: (key, value) => ipcRenderer.invoke('system:setConfig', key, value),
    importData: (filePath, format) => ipcRenderer.invoke('system:importData', filePath, format),
  },
});
