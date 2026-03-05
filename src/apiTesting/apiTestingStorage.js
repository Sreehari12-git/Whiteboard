import { v4 as uuidv4 } from "uuid";
import { apiDb } from "../services/db.js";

export async function getApis() {
  return apiDb.getAll();
}

export async function getApiById(apiId) {
  return apiDb.getById(apiId);
}

export async function createApi({ name, method, url }) {
  const api = {
    id: uuidv4(),
    name: name?.trim() || "Untitled API",
    method: (method || "POST").toUpperCase(),
    url: url?.trim() || "",
    headersJson: '{\n  "Content-Type": "application/json"\n}',
    payloads: [
      {
        id: uuidv4(),
        name: "Payload 1",
        bodyJson: "{\n  \n}",
      },
    ],
    lastResultsByPayloadId: {},
    lastRunAt: null,
  };

  return apiDb.save(api);
}

export async function upsertApi(updatedApi) {
  return apiDb.save(updatedApi);
}

export async function deleteApi(apiId) {
  return apiDb.delete(apiId);
}
