// Storage adapter — uses backend API at http://localhost:3000/api
const BASE_URL = (typeof process !== "undefined" && process.env && process.env.TEST_API_BASE) || "http://localhost:3000/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

// --- API Testing domain ---
export const apiDb = {
  _toFrontendApi(doc) {
    if (!doc) return null;
    const id = doc._id || doc.id;
    return {
      id,
      name: doc.name || "Untitled API",
      method: (doc.method || "POST").toUpperCase(),
      url: doc.url || "",
      headersJson: JSON.stringify(doc.requestHeaders || {}, null, 2),
      payloads: [
        {
          id: `${id}-p1`,
          name: "Payload 1",
          bodyJson: JSON.stringify(doc.requestBody || {}, null, 2),
        },
      ],
      lastResultsByPayloadId: doc.lastResultsByPayloadId || {},
      lastRunAt: doc.runAt || doc.lastRunAt || doc.updatedAt || null,
      requestDto: doc.requestDto ? JSON.stringify(doc.requestDto, null, 2) : doc.requestDto || "",
      responseDto: doc.responseDto ? JSON.stringify(doc.responseDto, null, 2) : doc.responseDto || "",
      payloadDto: doc.payloadDto ? JSON.stringify(doc.payloadDto, null, 2) : doc.payloadDto || "",
      _raw: doc,
    };
  },

  async getAll() {
    const data = await request("/tests");
    const items = data.items || [];
    return items.map((it) => this._toFrontendApi(it));
  },

  async getById(id) {
    const item = await request(`/tests/${id}`);
    return this._toFrontendApi(item);
  },

  async save(api) {
    const payload = {
      name: api.name,
      method: api.method,
      url: api.url,
      requestHeaders: typeof api.headersJson === "string" ? JSON.parse(api.headersJson || "{}") : api.headersJson,
      requestBody: api.payloads?.[0]?.bodyJson ? JSON.parse(api.payloads[0].bodyJson) : {},
      requestDto: api.requestDto ? (typeof api.requestDto === "string" ? JSON.parse(api.requestDto) : api.requestDto) : undefined,
      responseDto: api.responseDto ? (typeof api.responseDto === "string" ? JSON.parse(api.responseDto) : api.responseDto) : undefined,
      payloadDto: api.payloadDto ? (typeof api.payloadDto === "string" ? JSON.parse(api.payloadDto) : api.payloadDto) : undefined,
    };

    const maybeId = api?._raw?._id || api.id;
    const isMongoId = typeof maybeId === "string" && /^[a-fA-F0-9]{24}$/.test(maybeId);
    if (isMongoId) {
      const result = await request(`/tests/${maybeId}`, { method: "PUT", body: JSON.stringify(payload) });
      const saved = this._toFrontendApi(result || { ...api, _id: maybeId });
      if (api.payloads && api.payloads.length) saved.payloads = api.payloads;
      if (api.headersJson) saved.headersJson = api.headersJson;
      if (api.requestDto) saved.requestDto = api.requestDto;
      if (api.responseDto) saved.responseDto = api.responseDto;
      saved._raw = result || saved._raw;
      return saved;
    }

    const result = await request("/tests", { method: "POST", body: JSON.stringify(payload) });
    const saved = this._toFrontendApi(result || { ...api, _id: result._id || api.id });
    if (api.payloads && api.payloads.length) saved.payloads = api.payloads;
    if (api.headersJson) saved.headersJson = api.headersJson;
    if (api.requestDto) saved.requestDto = api.requestDto;
    if (api.responseDto) saved.responseDto = api.responseDto;
    saved._raw = result || saved._raw;
    return saved;
  },

  async delete(id) {
    try {
      await request(`/tests/${id}`, { method: "DELETE" });
      return true;
    } catch (e) {
      console.warn("Delete api failed", e);
      return false;
    }
  },
};

// --- E2E / Flow domain ---
export const flowDb = {
  _toFrontendFlow(doc) {
    if (!doc) return null;
    const id = doc._id || doc.id;
    const steps = doc.steps || [];
    const nodes = steps.map((s, idx) => ({
      id: `${id}-n${idx}`,
      type: "default",
      position: { x: idx * 220 + 40, y: 80 },
      data: {
        label: `${s.apiName} (${s.method})`,
        api: { name: s.apiName, method: s.method, url: s.url },
        staticInputs: s.requestPayload || {},
      },
      style: {
        background: "rgba(30, 41, 59, 0.9)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        padding: "10px",
        width: 200,
      },
    }));

    return {
      id,
      name: doc.name || "Untitled Flow",
      nodes,
      edges: doc.edges || [],
      lastResults: doc.lastResults || null,
      lastRunAt: doc.updatedAt || doc.lastRunAt || doc.createdAt || null,
      _raw: doc,
    };
  },

  async getAll() {
    const data = await request("/flows");
    const items = data.items || [];
    return items.map((it) => this._toFrontendFlow(it));
  },

  async getById(id) {
    const item = await request(`/flows/${id}`);
    return this._toFrontendFlow(item);
  },

  async save(flow) {
    const payload = {
      name: flow.name,
      description: flow.description || "",
      steps: (flow.nodes || []).map((node, index) => ({
        order: index + 1,
        apiName: node.data?.api?.name || node.data?.label || "Step",
        method: node.data?.api?.method || "GET",
        url: node.data?.api?.url || "",
        requestPayload: node.data?.staticInputs || {},
      })),
    };

    const maybeId = flow?._raw?._id || flow.id;
    const isMongoId = typeof maybeId === "string" && /^[a-fA-F0-9]{24}$/.test(maybeId);
    if (isMongoId) {
      const result = await request(`/flows/${maybeId}`, { method: "PUT", body: JSON.stringify(payload) });
      const saved = this._toFrontendFlow(result || { ...flow, _id: maybeId });
      // preserve nodes/edges created in frontend to keep IDs stable in the UI\n      if (flow.nodes) saved.nodes = flow.nodes;\n      if (flow.edges) saved.edges = flow.edges;\n+      saved._raw = result || saved._raw;
      return saved;
    }

    const result = await request("/flows", { method: "POST", body: JSON.stringify(payload) });
    const saved = this._toFrontendFlow(result || { ...flow, _id: result._id || flow.id });
    if (flow.nodes) saved.nodes = flow.nodes;
    if (flow.edges) saved.edges = flow.edges;
    saved._raw = result || saved._raw;
    return saved;
  },

  async delete(id) {
    try {
      await request(`/flows/${id}`, { method: "DELETE" });
      return true;
    } catch (e) {
      console.warn("Flow delete failed", e);
      return false;
    }
  },
};

