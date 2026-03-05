import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "apiTesting.apis.v1";

function safeParse(json) {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getApis() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  const parsed = safeParse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveApis(apis) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(apis));
}

export function getApiById(apiId) {
  return getApis().find((a) => a.id === apiId) || null;
}

export function createApi({ name, method, url }) {
  const now = new Date().toISOString();
  const api = {
    id: uuidv4(),
    name: name?.trim() || "Untitled API",
    method: (method || "POST").toUpperCase(),
    url: url?.trim() || "",
    headersJson: '{\n  "Content-Type": "application/json"\n}',
    createdAt: now,
    updatedAt: now,
    payloads: [
      {
        id: uuidv4(),
        name: "Payload 1",
        bodyJson: "{\n  \n}",
        createdAt: now,
        updatedAt: now,
      },
    ],
    lastResultsByPayloadId: {},
    lastRunAt: null,
  };

  const apis = getApis();
  saveApis([api, ...apis]);
  return api;
}

export function upsertApi(updatedApi) {
  const apis = getApis();
  const idx = apis.findIndex((a) => a.id === updatedApi.id);
  const next = {
    ...updatedApi,
    updatedAt: new Date().toISOString(),
  };

  if (idx === -1) {
    saveApis([next, ...apis]);
  } else {
    const copy = [...apis];
    copy[idx] = next;
    saveApis(copy);
  }
  return next;
}

export function deleteApi(apiId) {
  const apis = getApis().filter((a) => a.id !== apiId);
  saveApis(apis);
}

