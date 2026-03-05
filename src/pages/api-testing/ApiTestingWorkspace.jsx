import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiById, upsertApi } from "../../apiTesting/apiTestingStorage";
import { v4 as uuidv4 } from "uuid";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function safeJsonParse(text) {
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

function formatDuration(ms) {
  if (typeof ms !== "number") return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

async function readResponseBody(res) {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();
  if (contentType.includes("application/json")) {
    const parsed = safeJsonParse(text);
    if (parsed.ok) return { kind: "json", value: parsed.value };
  }
  return { kind: "text", value: text };
}

function buildUrlWithQuery(url, queryObj) {
  try {
    const u = new URL(url);
    Object.entries(queryObj || {}).forEach(([k, v]) => {
      if (v === undefined || v === null) return;
      u.searchParams.set(k, typeof v === "string" ? v : JSON.stringify(v));
    });
    return u.toString();
  } catch {
    return url;
  }
}

export default function ApiTestingWorkspace() {
  const { apiId } = useParams();
  const navigate = useNavigate();

  const [api, setApi] = React.useState(() => (apiId ? getApiById(apiId) : null));
  const [selectedPayloadId, setSelectedPayloadId] = React.useState(null);
  const [toast, setToast] = React.useState("");

  React.useEffect(() => {
    if (!apiId) return;
    const loaded = getApiById(apiId);
    setApi(loaded);
    setSelectedPayloadId(loaded?.payloads?.[0]?.id ?? null);
  }, [apiId]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1400);
    return () => clearTimeout(t);
  }, [toast]);

  const selectedPayload = React.useMemo(() => {
    if (!api) return null;
    return api.payloads.find((p) => p.id === selectedPayloadId) || api.payloads[0] || null;
  }, [api, selectedPayloadId]);

  const persist = React.useCallback(
    (next) => {
      const saved = upsertApi(next);
      setApi(saved);
      return saved;
    },
    [setApi]
  );

  const updateApiField = (field, value) => {
    if (!api) return;
    setApi({ ...api, [field]: value });
  };

  const saveApi = () => {
    if (!api) return;
    persist(api);
    setToast("Saved");
  };

  const addPayload = () => {
    if (!api) return;
    const now = new Date().toISOString();
    const payload = {
      id: uuidv4(),
      name: `Payload ${api.payloads.length + 1}`,
      bodyJson: "{\n  \n}",
      createdAt: now,
      updatedAt: now,
    };
    const next = { ...api, payloads: [...api.payloads, payload] };
    const saved = persist(next);
    setSelectedPayloadId(saved.payloads[saved.payloads.length - 1]?.id ?? null);
  };

  const deletePayload = (payloadId) => {
    if (!api) return;
    const ok = window.confirm("Delete this payload?");
    if (!ok) return;
    const nextPayloads = api.payloads.filter((p) => p.id !== payloadId);
    const nextResults = { ...(api.lastResultsByPayloadId || {}) };
    delete nextResults[payloadId];
    const next = { ...api, payloads: nextPayloads, lastResultsByPayloadId: nextResults };
    const saved = persist(next);
    setSelectedPayloadId(saved.payloads[0]?.id ?? null);
  };

  const updatePayload = (payloadId, patch) => {
    if (!api) return;
    const nextPayloads = api.payloads.map((p) =>
      p.id === payloadId ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p
    );
    setApi({ ...api, payloads: nextPayloads });
  };

  const runPayload = async (payload) => {
    if (!api) return;
    if (!api.url) {
      window.alert("Please set the API URL first.");
      return;
    }

    const headersParsed = safeJsonParse(api.headersJson || "{}");
    if (!headersParsed.ok) {
      window.alert(`Headers JSON is invalid: ${headersParsed.error}`);
      return;
    }

    const bodyParsed = safeJsonParse(payload.bodyJson || "{}");
    if (!bodyParsed.ok) {
      window.alert(`Payload JSON is invalid: ${bodyParsed.error}`);
      return;
    }

    const method = (api.method || "POST").toUpperCase();
    const startedAt = performance.now();

    const headers = {
      ...(headersParsed.value || {}),
    };

    let requestUrl = api.url;
    const init = { method, headers };

    const canHaveBody = !["GET", "DELETE"].includes(method);
    if (canHaveBody) {
      init.body = JSON.stringify(bodyParsed.value ?? {});
      if (!("Content-Type" in headers) && !("content-type" in headers)) {
        headers["Content-Type"] = "application/json";
      }
    } else {
      if (bodyParsed.value && typeof bodyParsed.value === "object" && !Array.isArray(bodyParsed.value)) {
        requestUrl = buildUrlWithQuery(requestUrl, bodyParsed.value);
      }
    }

    let result;
    try {
      const res = await fetch(requestUrl, init);
      const responseBody = await readResponseBody(res);
      const durationMs = performance.now() - startedAt;
      result = {
        payloadId: payload.id,
        ok: res.ok,
        status: res.status,
        statusText: res.statusText,
        durationMs,
        receivedAt: new Date().toISOString(),
        responseBody,
        error: null,
      };
    } catch (e) {
      const durationMs = performance.now() - startedAt;
      result = {
        payloadId: payload.id,
        ok: false,
        status: 0,
        statusText: "",
        durationMs,
        receivedAt: new Date().toISOString(),
        responseBody: null,
        error: e instanceof Error ? e.message : "Request failed",
      };
    }

    const next = {
      ...api,
      lastRunAt: new Date().toISOString(),
      lastResultsByPayloadId: {
        ...(api.lastResultsByPayloadId || {}),
        [payload.id]: result,
      },
    };
    persist(next);
  };

  const runAll = async () => {
    if (!api) return;
    for (const p of api.payloads) {
      // eslint-disable-next-line no-await-in-loop
      await runPayload(p);
    }
  };

  if (!api) {
    return (
      <div className="panel" style={{ padding: 18 }}>
        <div style={{ fontWeight: 800, color: "#fff" }}>API not found</div>
        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          It may have been deleted. Go back to the API list.
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn" onClick={() => navigate("/api-testing")}>
            ← Back
          </button>
        </div>
      </div>
    );
  }

  const selectedResult = selectedPayload ? api.lastResultsByPayloadId?.[selectedPayload.id] : null;
  const hasResults = Object.keys(api.lastResultsByPayloadId || {}).length > 0;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="panel" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: "#fff", fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {api.name}
          </div>
          <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
            {api.method} · {api.url || "(no URL)"} {api.lastRunAt ? `· Last run: ${new Date(api.lastRunAt).toLocaleString()}` : ""}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {toast ? <div className="muted" style={{ fontSize: 12 }}>{toast}</div> : null}
          <button className="btn" onClick={() => navigate("/api-testing")}>
            Back
          </button>
          <button className="btn" onClick={saveApi}>
            Save
          </button>
          <button className="btn btn-primary" disabled={!hasResults} onClick={() => navigate(`/api-testing/${api.id}/report`)}>
            Generate report
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr 420px", gap: 12, alignItems: "start" }}>
        {/* Left: payload list + editor */}
        <div className="panel" style={{ padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 13 }}>Payloads</div>
            <button className="btn" onClick={addPayload}>
              + Add
            </button>
          </div>

          <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
            {api.payloads.map((p) => {
              const r = api.lastResultsByPayloadId?.[p.id];
              const active = p.id === (selectedPayload?.id ?? null);
              const badgeBg = r ? (r.ok ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)") : "rgba(255,255,255,0.08)";
              const badgeColor = r ? (r.ok ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.78)";
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedPayloadId(p.id)}
                  style={{
                    padding: "9px 10px",
                    borderRadius: 12,
                    border: active ? "1px solid rgba(99,102,241,0.55)" : "1px solid rgba(255,255,255,0.10)",
                    background: active ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
                    cursor: "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#fff", fontWeight: 750, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {p.name}
                    </div>
                    {r ? (
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                        {r.status ? `HTTP ${r.status}` : "Error"} · {formatDuration(r.durationMs)}
                      </div>
                    ) : (
                      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Not run</div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ padding: "4px 8px", borderRadius: 999, background: badgeBg, color: badgeColor, fontWeight: 800, fontSize: 11 }}>
                      {r ? (r.ok ? "PASS" : "FAIL") : "—"}
                    </div>
                    <button className="btn" onClick={(e) => { e.stopPropagation(); deletePayload(p.id); }}>
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedPayload ? (
            <div style={{ marginTop: 12, borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 12 }}>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Payload name
              </div>
              <input
                className="input"
                value={selectedPayload.name}
                onChange={(e) => updatePayload(selectedPayload.id, { name: e.target.value })}
              />

              <div className="muted" style={{ fontSize: 12, marginTop: 10, marginBottom: 6 }}>
                JSON body / params
              </div>
              <textarea
                className="textarea"
                value={selectedPayload.bodyJson}
                onChange={(e) => updatePayload(selectedPayload.id, { bodyJson: e.target.value })}
                spellCheck={false}
              />

              <div style={{ marginTop: 10, display: "flex", gap: 10 }}>
                <button className="btn btn-primary" onClick={() => runPayload(selectedPayload)}>
                  Run payload
                </button>
                <button className="btn" onClick={runAll}>
                  Run all
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Middle: API config */}
        <div className="panel" style={{ padding: 12 }}>
          <div style={{ fontWeight: 900, color: "#fff", fontSize: 13 }}>API</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
            Configure method, URL, and headers (saved when you click Save).
          </div>

          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Method
                </div>
                <select className="select" value={api.method} onChange={(e) => updateApiField("method", e.target.value)}>
                  {METHODS.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  URL
                </div>
                <input className="input" value={api.url} onChange={(e) => updateApiField("url", e.target.value)} placeholder="https://..." />
              </div>
            </div>

            <div>
              <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                Headers (JSON)
              </div>
              <textarea
                className="textarea"
                value={api.headersJson || "{}"}
                onChange={(e) => updateApiField("headersJson", e.target.value)}
                spellCheck={false}
                style={{ minHeight: 160 }}
              />
              <div className="muted" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.45 }}>
                Tip: for auth you can add <span style={{ color: "#fff" }}>"Authorization": "Bearer ..."</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: response */}
        <div className="panel" style={{ padding: 12 }}>
          <div style={{ fontWeight: 900, color: "#fff", fontSize: 13 }}>Response</div>
          {!selectedPayload ? (
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
              Select a payload to see its response.
            </div>
          ) : !selectedResult ? (
            <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
              No response yet. Run this payload.
            </div>
          ) : (
            <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{selectedPayload.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {selectedResult.status ? `HTTP ${selectedResult.status} ${selectedResult.statusText || ""}` : "Error"} ·{" "}
                  {formatDuration(selectedResult.durationMs)}
                </div>
              </div>

              {selectedResult.error ? (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 12,
                    border: "1px solid rgba(239,68,68,0.35)",
                    background: "rgba(239,68,68,0.10)",
                    color: "rgba(255,255,255,0.92)",
                    fontSize: 13,
                    lineHeight: 1.45,
                    wordBreak: "break-word",
                  }}
                >
                  {selectedResult.error}
                </div>
              ) : null}

              {selectedResult.responseBody ? (
                <pre
                  style={{
                    margin: 0,
                    padding: 12,
                    borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(0,0,0,0.25)",
                    color: "rgba(255,255,255,0.92)",
                    overflow: "auto",
                    maxHeight: 520,
                    fontSize: 12,
                    lineHeight: 1.4,
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                >
                  {selectedResult.responseBody.kind === "json"
                    ? JSON.stringify(selectedResult.responseBody.value, null, 2)
                    : String(selectedResult.responseBody.value || "")}
                </pre>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

