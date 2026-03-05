// Storage interface to allow easy switching between sessionStorage, localStorage, or a real DB.
// Current implementation uses sessionStorage.

const API_STORAGE_KEY = "apiTesting.apis.v1";
const FLOW_STORAGE_KEY = "e2eTesting.flows.v1";

const storage = {
  getItem: (key) => {
    const val = sessionStorage.getItem(key);
    try {
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    sessionStorage.setItem(key, JSON.stringify(value));
  }
};

// --- Generic DB-like Interface ---

async function getAll(key) {
  return storage.getItem(key) || [];
}

async function getById(key, id) {
  const items = await getAll(key);
  return items.find(item => item.id === id) || null;
}

async function save(key, item) {
  const items = await getAll(key);
  const idx = items.findIndex(i => i.id === item.id);
  let updatedItems;
  
  const now = new Date().toISOString();
  const itemWithMeta = {
    ...item,
    updatedAt: now,
    createdAt: item.createdAt || now
  };

  if (idx === -1) {
    updatedItems = [itemWithMeta, ...items];
  } else {
    updatedItems = [...items];
    updatedItems[idx] = itemWithMeta;
  }
  
  storage.setItem(key, updatedItems);
  return itemWithMeta;
}

async function remove(key, id) {
  const items = await getAll(key);
  const filtered = items.filter(i => i.id !== id);
  storage.setItem(key, filtered);
}

// --- API Testing Domain ---

export const apiDb = {
  getAll: () => getAll(API_STORAGE_KEY),
  getById: (id) => getById(API_STORAGE_KEY, id),
  save: (api) => save(API_STORAGE_KEY, api),
  delete: (id) => remove(API_STORAGE_KEY, id)
};

// --- E2E Testing Domain ---

export const flowDb = {
  getAll: () => getAll(FLOW_STORAGE_KEY),
  getById: (id) => getById(FLOW_STORAGE_KEY, id),
  save: (flow) => save(FLOW_STORAGE_KEY, flow),
  delete: (id) => remove(FLOW_STORAGE_KEY, id)
};
