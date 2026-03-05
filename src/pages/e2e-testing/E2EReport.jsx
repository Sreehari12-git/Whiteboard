import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFlowById, upsertFlow } from "../../e2eTesting/e2eStorage";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split(".").reduce((acc, part) => acc && acc[part], obj);
}

function setNestedValue(obj, path, value) {
  const parts = path.split(".");
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) {
      current[part] = {};
    }
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
  return obj;
}

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function formatDuration(ms) {
  if (typeof ms !== "number") return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// ─────────────────────────────────────────────────────────────────────────────
// E2EReport
// ─────────────────────────────────────────────────────────────────────────────

export default function E2EReport() {
  const { flowId } = useParams();
  const navigate = useNavigate();

  const [flow, setFlow] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);

  useEffect(() => {
    async function load() {
      const loaded = await getFlowById(flowId);
      setFlow(loaded);
    }
    load();
  }, [flowId]);

  const runFlow = async () => {
    if (!flow || isRunning) return;
    setIsRunning(true);
    setCurrentStepIndex(0);

    const nodes = [...(flow.nodes || [])].sort((a, b) => a.position.x - b.position.x);
    const edges = flow.edges || [];
    const results = [];
    const nodeResponses = {}; // Store responses by nodeId for mapping

    for (let i = 0; i < nodes.length; i++) {
      setCurrentStepIndex(i);
      const node = nodes[i];
      const api = node.data.api;

      // 1. Prepare payload
      // Start with static inputs from the node data
      let payload = { ...(node.data.staticInputs || {}) };
      
      // If no static inputs, try fallback to first payload body if it exists
      if (Object.keys(payload).length === 0 && api.payloads?.[0]?.bodyJson) {
        payload = safeJsonParse(api.payloads[0].bodyJson);
      }

      // 2. Apply mappings from previous steps
      const incomingEdges = edges.filter((e) => e.target === node.id);
      for (const edge of incomingEdges) {
        const sourceResponse = nodeResponses[edge.source];
        if (sourceResponse && edge.data?.mappingRows) {
          for (const row of edge.data.mappingRows) {
            if (row.sourceKey && row.targetKey) {
              const val = getNestedValue(sourceResponse, row.sourceKey);
              if (val !== undefined) {
                setNestedValue(payload, row.targetKey, val);
              }
            }
          }
        }
      }

      // 3. Execute API
      const startedAt = performance.now();
      const method = (api.method || "POST").toUpperCase();
      const headers = safeJsonParse(api.headersJson || '{"Content-Type":"application/json"}');
      
      let stepResult;
      try {
        const init = {
          method,
          headers,
        };
        if (!["GET", "DELETE"].includes(method)) {
          init.body = JSON.stringify(payload);
        }

        const res = await fetch(api.url, init);
        const resText = await res.text();
        let resData = resText;
        try {
          resData = JSON.parse(resText);
        } catch {
          // not json
        }

        const durationMs = performance.now() - startedAt;
        stepResult = {
          nodeId: node.id,
          apiName: api.name,
          ok: res.ok,
          status: res.status,
          durationMs,
          payloadSent: payload,
          responseReceived: resData,
        };
        nodeResponses[node.id] = resData;
      } catch (e) {
        const durationMs = performance.now() - startedAt;
        stepResult = {
          nodeId: node.id,
          apiName: api.name,
          ok: false,
          status: 0,
          durationMs,
          payloadSent: payload,
          error: e instanceof Error ? e.message : "Request failed",
        };
      }

      results.push(stepResult);
      if (!stepResult.ok) {
        // Stop flow on failure? For now, yes.
        break;
      }
      
      // Small delay between steps
      await new Promise(r => setTimeout(r, 300));
    }

    const updatedFlow = {
      ...flow,
      lastResults: results,
      lastRunAt: new Date().toISOString(),
    };
    await upsertFlow(updatedFlow);
    setFlow(updatedFlow);
    setIsRunning(false);
    setCurrentStepIndex(-1);
  };

  if (!flow) return <div className="muted" style={{ padding: 20 }}>Loading report...</div>;

  const results = flow.lastResults || [];
  const allPass = results.length > 0 && results.every((r) => r.ok);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="panel" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div>
          <div style={{ fontWeight: 900, color: "#fff", fontSize: 14 }}>{flow.name} · Report</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
            {flow.lastRunAt ? `Last run: ${new Date(flow.lastRunAt).toLocaleString()}` : "Never run"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => navigate(`/e2e-testing/${flow.id}`)}>Edit Flow</button>
          <button className="btn btn-primary" onClick={runFlow} disabled={isRunning}>
            {isRunning ? "Running..." : "Run Flow"}
          </button>
        </div>
      </div>

      {isRunning && (
        <div className="panel" style={{ padding: 14, background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>
            Running step {currentStepIndex + 1}...
          </div>
        </div>
      )}

      {!isRunning && results.length > 0 && (
        <div style={{ display: "grid", gap: 12 }}>
          <div className="panel" style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ 
              padding: "6px 12px", 
              borderRadius: 999, 
              background: allPass ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
              color: allPass ? "#10b981" : "#ef4444",
              fontWeight: 900,
              fontSize: 12
            }}>
              {allPass ? "FLOW PASSED" : "FLOW FAILED"}
            </div>
            <div className="muted" style={{ fontSize: 13 }}>
              {results.length} steps executed.
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {results.map((res, idx) => (
              <div key={res.nodeId} className="panel" style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: 999, 
                      background: "rgba(255,255,255,0.1)", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 800, color: "#fff"
                    }}>
                      {idx + 1}
                    </div>
                    <div style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{res.apiName}</div>
                  </div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div className="muted" style={{ fontSize: 12 }}>{formatDuration(res.durationMs)}</div>
                    <div style={{ 
                      padding: "4px 10px", borderRadius: 8, 
                      background: res.ok ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                      color: res.ok ? "#10b981" : "#ef4444",
                      fontWeight: 800, fontSize: 11
                    }}>
                      {res.ok ? `HTTP ${res.status}` : (res.status ? `HTTP ${res.status}` : "ERROR")}
                    </div>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div className="muted" style={{ fontSize: 11, marginBottom: 6, textTransform: "uppercase", fontWeight: 800 }}>Payload Sent</div>
                    <pre style={{ 
                      margin: 0, padding: 10, borderRadius: 10, background: "rgba(0,0,0,0.2)", 
                      fontSize: 11, color: "rgba(255,255,255,0.8)", overflow: "auto", maxHeight: 200 
                    }}>
                      {JSON.stringify(res.payloadSent, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <div className="muted" style={{ fontSize: 11, marginBottom: 6, textTransform: "uppercase", fontWeight: 800 }}>Response Received</div>
                    <pre style={{ 
                      margin: 0, padding: 10, borderRadius: 10, background: "rgba(0,0,0,0.2)", 
                      fontSize: 11, color: "rgba(255,255,255,0.8)", overflow: "auto", maxHeight: 200 
                    }}>
                      {res.error ? res.error : JSON.stringify(res.responseReceived, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isRunning && results.length === 0 && (
        <div className="panel" style={{ padding: 40, textAlign: "center" }}>
          <div className="muted">This flow hasn't been run yet. Click "Run Flow" to start testing.</div>
        </div>
      )}
    </div>
  );
}
