/**
 * Store reactivo simple basado en Proxy
 */
const Store = (() => {
  const state = {
    books: [],
    authors: [],
    users: [],
    loans: [],
    collections: [],
    currentView: 'dashboard',
    theme: localStorage.getItem('theme') || 'light',
    viewMode: localStorage.getItem('viewMode') || 'grid',
    filters: {},
    searchQuery: '',
  };

  const listeners = new Map();

  function subscribe(key, callback) {
    if (!listeners.has(key)) {
      listeners.set(key, new Set());
    }
    listeners.get(key).add(callback);
    return () => listeners.get(key).delete(callback);
  }

  function notify(key, value) {
    if (listeners.has(key)) {
      listeners.get(key).forEach((cb) => cb(value));
    }
  }

  function get(key) {
    return state[key];
  }

  function set(key, value) {
    state[key] = value;
    notify(key, value);
  }

  function update(key, updater) {
    const newValue = updater(state[key]);
    set(key, newValue);
  }

  return { subscribe, get, set, update };
})();
