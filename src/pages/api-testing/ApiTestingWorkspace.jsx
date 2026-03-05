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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ApiTestingWorkspace() {
  const { apiId } = useParams();
  const navigate = useNavigate();

  const [api, setApi] = React.useState(null);
  const [selectedPayloadId, setSelectedPayloadId] = React.useState(null);
  const [toast, setToast] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isRunningAll, setIsRunningAll] = React.useState(false);
  const [runProgress, setRunProgress] = React.useState({ current: 0, total: 0 });

  React.useEffect(() => {
    async function load() {
      if (!apiId) return;
      const loaded = await getApiById(apiId);
      setApi(loaded);
      setSelectedPayloadId(loaded?.payloads?.[0]?.id ?? null);
    }
    load();
  }, [apiId]);

  React.useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const selectedPayload = React.useMemo(() => {
    if (!api) return null;
    return api.payloads.find((p) => p.id === selectedPayloadId) || api.payloads[0] || null;
  }, [api, selectedPayloadId]);

  const persist = React.useCallback(
    async (next) => {
      const saved = await upsertApi(next);
      setApi(saved);
      return saved;
    },
    [setApi]
  );

  const updateApiField = (field, value) => {
    if (!api) return;
    setApi({ ...api, [field]: value });
  };

  const saveApi = async () => {
    if (!api) return;
    await persist(api);
    setToast("Saved");
  };

  const addPayload = async () => {
    if (!api) return;
    const payload = {
      id: uuidv4(),
      name: `Payload ${api.payloads.length + 1}`,
      bodyJson: "{\n  \n}",
    };
    const next = { ...api, payloads: [...api.payloads, payload] };
    const saved = await persist(next);
    setSelectedPayloadId(saved.payloads[saved.payloads.length - 1]?.id ?? null);
  };

  const deletePayload = async (payloadId) => {
    if (!api) return;
    const ok = window.confirm("Delete this payload?");
    if (!ok) return;
    const nextPayloads = api.payloads.filter((p) => p.id !== payloadId);
    const nextResults = { ...(api.lastResultsByPayloadId || {}) };
    delete nextResults[payloadId];
    const next = { ...api, payloads: nextPayloads, lastResultsByPayloadId: nextResults };
    const saved = await persist(next);
    setSelectedPayloadId(saved.payloads[0]?.id ?? null);
  };

  const updatePayload = (payloadId, patch) => {
    if (!api) return;
    const nextPayloads = api.payloads.map((p) =>
      p.id === payloadId ? { ...p, ...patch } : p
    );
    setApi({ ...api, payloads: nextPayloads });
  };

  const runPayload = async (payload, silent = false) => {
    if (!api) return;
    if (!api.url) {
      if (!silent) window.alert("Please set the API URL first.");
      return;
    }

    const headersParsed = safeJsonParse(api.headersJson || "{}");
    if (!headersParsed.ok) {
      if (!silent) window.alert(`Headers JSON is invalid: ${headersParsed.error}`);
      return;
    }

    const bodyParsed = safeJsonParse(payload.bodyJson || "{}");
    if (!bodyParsed.ok) {
      if (!silent) window.alert(`Payload JSON is invalid: ${bodyParsed.error}`);
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

    // We need to get the latest API state because multiple runs might be happening
    const currentApi = await getApiById(api.id);
    const next = {
      ...currentApi,
      lastRunAt: new Date().toISOString(),
      lastResultsByPayloadId: {
        ...(currentApi.lastResultsByPayloadId || {}),
        [payload.id]: result,
      },
    };
    await persist(next);
    return result;
  };

  const runAllWithDelay = async () => {
    if (!api || isRunningAll) return;
    setIsRunningAll(true);
    setRunProgress({ current: 0, total: api.payloads.length });

    for (let i = 0; i < api.payloads.length; i++) {
      setRunProgress({ current: i + 1, total: api.payloads.length });
      await runPayload(api.payloads[i], true);
      if (i < api.payloads.length - 1) {
        await sleep(500); // 500ms delay between requests
      }
    }

    setIsRunningAll(false);
    setToast("Run all completed");
  };

  const generateExamples = async () => {
    if (!api || !api.payloadDto || isGenerating) return;
    
    const dtoParsed = safeJsonParse(api.payloadDto);
    if (!dtoParsed.ok) {
      window.alert(`Payload DTO JSON is invalid: ${dtoParsed.error}`);
      return;
    }

    setIsGenerating(true);
    try {
      const res = await fetch("http://localhost:3000/api/examples", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payloadDto: dtoParsed.value }),
      });

      if (!res.ok) throw new Error(`Generator API returned ${res.status}`);
      
      const data = await res.json();
      if (!data.examples || !Array.isArray(data.examples)) {
        throw new Error("Invalid response from generator API");
      }

      const newPayloads = data.examples.map((ex, idx) => ({
        id: uuidv4(),
        name: `Generated ${idx + 1}`,
        bodyJson: JSON.stringify(ex, null, 2),
      }));

      const next = {
        ...api,
        payloads: [...api.payloads, ...newPayloads],
      };
      await persist(next);
      setToast(`Generated ${newPayloads.length} examples`);
    } catch (e) {
      window.alert(`Generation failed: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!api) {
    return (
      <div className="panel" style={{ padding: 18 }}>
        <div style={{ fontWeight: 800, color: "#fff" }}>Loading API...</div>
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
          {toast ? <div style={{ color: "#10b981", fontSize: 12, fontWeight: 800 }}>{toast}</div> : null}
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

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr 420px", gap: 12, alignItems: "start" }}>
        {/* Left: payload list + editor */}
        <div className="panel" style={{ padding: 12, display: "grid", gap: 12 }}>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
              <div style={{ fontWeight: 900, color: "#fff", fontSize: 13 }}>Payloads</div>
              <button className="btn" onClick={addPayload}>
                + Add
              </button>
            </div>

            <div style={{ marginTop: 10, display: "grid", gap: 8, maxHeight: 300, overflow: "auto" }}>
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
          </div>

          {/* Generator Section */}
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 12 }}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 13 }}>Example Generator</div>
            <div className="muted" style={{ fontSize: 11, marginTop: 4, marginBottom: 8 }}>
              Put your Payload DTO here to generate test examples.
            </div>
            <textarea
              className="textarea"
              style={{ minHeight: 100, fontSize: 11 }}
              placeholder='{ "userId": "uuid", "age": 30 }'
              value={api.payloadDto || ""}
              onChange={(e) => updateApiField("payloadDto", e.target.value)}
              spellCheck={false}
            />
            <button 
              className="btn btn-primary" 
              style={{ marginTop: 10, width: "100%" }}
              onClick={generateExamples}
              disabled={isGenerating || !api.payloadDto}
            >
              {isGenerating ? "Generating..." : "Generate Examples"}
            </button>
          </div>

          {selectedPayload ? (
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.10)", paddingTop: 12 }}>
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

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <button className="btn btn-primary" onClick={() => runPayload(selectedPayload)}>
                  Run payload
                </button>
                <button className="btn" onClick={runAllWithDelay} disabled={isRunningAll}>
                  {isRunningAll ? `Running (${runProgress.current}/${runProgress.total})...` : "Run all with delay"}
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
