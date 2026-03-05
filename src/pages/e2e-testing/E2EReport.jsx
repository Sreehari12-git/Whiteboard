import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFlowById, upsertFlow } from "../../e2eTesting/e2eStorage";

function formatDuration(ms) {
  if (typeof ms !== "number") return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

function getNestedValue(obj, path) {
  if (!path) return undefined;
  return path.split('.').reduce((acc, part) => acc && acc[path.includes('[') ? part.replace(/\[(\d+)\]/g, '.$1').split('.')[0] : part], obj);
}

function setNestedValue(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current)) current[part] = {};
    current = current[part];
  }
  current[parts[parts.length - 1]] = value;
}

export default function E2EReport() {
  const { flowId } = useParams();
  const navigate = useNavigate();
  const [flow, setFlow] = useState(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);

  useEffect(() => {
    async function load() {
      const loaded = await getFlowById(flowId);
      if (loaded) {
        setFlow(loaded);
        if (loaded.lastResults) {
          setResults(loaded.lastResults);
        }
      }
    }
    load();
  }, [flowId]);

  const sortedNodes = useMemo(() => {
    if (!flow) return [];
    return [...flow.nodes];
  }, [flow]);

  const runFlow = async () => {
    if (!flow || running) return;
    setRunning(true);
    setResults([]);
    setCurrentStepIdx(0);

    const stepResults = [];

    for (let i = 0; i < sortedNodes.length; i++) {
      setCurrentStepIdx(i);
      const node = sortedNodes[i];
      const api = node.data.api;

      const basePayload = JSON.parse(api.payloads[0]?.bodyJson || "{}");
      
      const incomingEdges = flow.edges.filter(e => e.target === node.id);
      incomingEdges.forEach(edge => {
        const sourceResult = stepResults.find(r => r.nodeId === edge.source);
        if (sourceResult && sourceResult.ok && sourceResult.responseBody?.value) {
          const mappings = edge.data?.mappingRows || [];
          mappings.forEach(m => {
            if (m.sourceKey && m.targetKey) {
              const val = getNestedValue(sourceResult.responseBody.value, m.sourceKey);
              if (val !== undefined) {
                setNestedValue(basePayload, m.targetKey, val);
              }
            }
          });
        }
      });

      const startedAt = performance.now();
      let result;
      try {
        const headers = JSON.parse(api.headersJson || "{}");
        const res = await fetch(api.url, {
          method: api.method,
          headers: { "Content-Type": "application/json", ...headers },
          body: ["GET", "DELETE"].includes(api.method) ? undefined : JSON.stringify(basePayload),
        });
        
        const text = await res.text();
        let responseBody = { kind: "text", value: text };
        try {
          if (res.headers.get("content-type")?.includes("application/json")) {
            responseBody = { kind: "json", value: JSON.parse(text) };
          }
        } catch { /* ignore */ }

        result = {
          nodeId: node.id,
          name: api.name,
          ok: res.ok,
          status: res.status,
          durationMs: performance.now() - startedAt,
          responseBody,
          payloadUsed: basePayload,
        };
      } catch (e) {
        result = {
          nodeId: node.id,
          name: api.name,
          ok: false,
          status: 0,
          durationMs: performance.now() - startedAt,
          error: e.message,
          payloadUsed: basePayload,
        };
      }

      stepResults.push(result);
      setResults([...stepResults]);
    }

    const finalFlow = {
      ...flow,
      lastResults: stepResults,
      lastRunAt: new Date().toISOString(),
    };
    await upsertFlow(finalFlow);
    setFlow(finalFlow);
    setRunning(false);
    setCurrentStepIdx(-1);
  };

  if (!flow) return <div className="muted" style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="panel" style={{ padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>E2E Report: {flow.name}</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            {flow.lastRunAt ? `Last run: ${new Date(flow.lastRunAt).toLocaleString()}` : "Not run yet"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" onClick={() => navigate(`/e2e-testing/${flow.id}`)}>Back to Workspace</button>
          <button className="btn btn-primary" onClick={runFlow} disabled={running}>
            {running ? "Running..." : "Run Flow"}
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 18 }}>
        <div style={{ display: "grid", gap: 12 }}>
          {sortedNodes.map((node, idx) => {
            const result = results.find(r => r.nodeId === node.id);
            const isCurrent = idx === currentStepIdx;
            const statusColor = result ? (result.ok ? "#10b981" : "#ef4444") : (isCurrent ? "#6366f1" : "rgba(255,255,255,0.2)");
            
            return (
              <details
                key={node.id}
                className="panel"
                style={{
                  borderLeft: `4px solid ${statusColor}`,
                  background: isCurrent ? "rgba(99, 102, 241, 0.05)" : "rgba(255,255,255,0.03)",
                  padding: 12,
                }}
              >
                <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ 
                      width: 24, height: 24, borderRadius: "50%", 
                      background: statusColor, color: "#fff", 
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, fontWeight: 900 
                    }}>
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, color: "#fff", fontSize: 14 }}>{node.data.api.name}</div>
                      <div className="muted" style={{ fontSize: 11 }}>{node.data.api.method} {node.data.api.url}</div>
                    </div>
                  </div>
                  
                  {result && (
                    <div style={{ textAlign: "right" }}>
                      <div style={{ color: statusColor, fontWeight: 900, fontSize: 12 }}>
                        {result.ok ? "PASSED" : "FAILED"}
                      </div>
                      <div className="muted" style={{ fontSize: 11 }}>
                        {result.status ? `HTTP ${result.status}` : "Error"} · {formatDuration(result.durationMs)}
                      </div>
                    </div>
                  )}
                </summary>

                {result && (
                  <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    <div>
                      <div className="muted" style={{ fontSize: 11, marginBottom: 6, textTransform: "uppercase", fontWeight: 800 }}>Payload Sent</div>
                      <pre style={{ 
                        margin: 0, padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.2)", 
                        color: "rgba(255,255,255,0.8)", fontSize: 11, overflow: "auto", maxHeight: 200 
                      }}>
                        {JSON.stringify(result.payloadUsed, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <div className="muted" style={{ fontSize: 11, marginBottom: 6, textTransform: "uppercase", fontWeight: 800 }}>Response Received</div>
                      {result.error ? (
                        <div style={{ color: "#ef4444", fontSize: 12 }}>{result.error}</div>
                      ) : (
                        <pre style={{ 
                          margin: 0, padding: 10, borderRadius: 8, background: "rgba(0,0,0,0.2)", 
                          color: "rgba(255,255,255,0.8)", fontSize: 11, overflow: "auto", maxHeight: 200 
                        }}>
                          {result.responseBody?.kind === "json" 
                            ? JSON.stringify(result.responseBody.value, null, 2) 
                            : result.responseBody?.value}
                        </pre>
                      )}
                    </div>
                  </div>
                )}
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
