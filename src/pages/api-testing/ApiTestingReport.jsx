import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getApiById } from "../../apiTesting/apiTestingStorage";

function formatDuration(ms) {
  if (typeof ms !== "number") return "";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export default function ApiTestingReport() {
  const { apiId } = useParams();
  const navigate = useNavigate();
  const [api, setApi] = React.useState(() => (apiId ? getApiById(apiId) : null));

  React.useEffect(() => {
    if (!apiId) return;
    setApi(getApiById(apiId));
  }, [apiId]);

  if (!api) {
    return (
      <div className="panel" style={{ padding: 18 }}>
        <div style={{ fontWeight: 800, color: "#fff" }}>Report not found</div>
        <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
          API is missing or deleted.
        </div>
        <div style={{ marginTop: 14 }}>
          <button className="btn" onClick={() => navigate("/api-testing")}>
            ← Back to APIs
          </button>
        </div>
      </div>
    );
  }

  const resultsById = api.lastResultsByPayloadId || {};
  const rows = (api.payloads || []).map((p) => ({
    payload: p,
    result: resultsById[p.id] || null,
  }));

  const total = rows.length;
  const executed = rows.filter((r) => r.result).length;
  const passed = rows.filter((r) => r.result?.ok).length;
  const failed = rows.filter((r) => r.result && !r.result.ok).length;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div className="panel" style={{ padding: 16, display: "flex", justifyContent: "space-between", gap: 12 }}>
        <div>
          <div style={{ fontWeight: 900, color: "#fff", fontSize: 14 }}>Report · {api.name}</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
            Last run: {api.lastRunAt ? new Date(api.lastRunAt).toLocaleString() : "—"}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" onClick={() => navigate(`/api-testing/${api.id}`)}>
            ← Back
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 800, fontSize: 12 }}>
            Total payloads: {total}
          </div>
          <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.06)", color: "#fff", fontWeight: 800, fontSize: 12 }}>
            Executed: {executed}
          </div>
          <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(16,185,129,0.14)", color: "#10b981", fontWeight: 900, fontSize: 12 }}>
            Passed: {passed}
          </div>
          <div style={{ padding: "8px 10px", borderRadius: 12, background: "rgba(239,68,68,0.14)", color: "#ef4444", fontWeight: 900, fontSize: 12 }}>
            Failed: {failed}
          </div>
        </div>
      </div>

      <div className="panel" style={{ padding: 16 }}>
        <div style={{ fontWeight: 900, color: "#fff", fontSize: 13 }}>Payload results</div>
        <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
          Pass/fail is based on HTTP status \(2xx = pass\). Network errors count as fail.
        </div>

        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {rows.map(({ payload, result }) => {
            const badgeBg = result ? (result.ok ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.18)") : "rgba(255,255,255,0.08)";
            const badgeColor = result ? (result.ok ? "#10b981" : "#ef4444") : "rgba(255,255,255,0.78)";

            return (
              <details
                key={payload.id}
                style={{
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.10)",
                  background: "rgba(255,255,255,0.04)",
                  padding: 10,
                }}
              >
                <summary style={{ cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#fff", fontWeight: 800, fontSize: 13 }}>{payload.name}</div>
                    <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
                      {result
                        ? result.status
                          ? `HTTP ${result.status} ${result.statusText || ""} · ${formatDuration(result.durationMs)}`
                          : `Error · ${formatDuration(result.durationMs)}`
                        : "Not executed"}
                    </div>
                  </div>
                  <div style={{ padding: "4px 10px", borderRadius: 999, background: badgeBg, color: badgeColor, fontWeight: 900, fontSize: 11 }}>
                    {result ? (result.ok ? "PASS" : "FAIL") : "—"}
                  </div>
                </summary>

                {result ? (
                  <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                    {result.error ? (
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
                        {result.error}
                      </div>
                    ) : null}

                    {result.responseBody ? (
                      <pre
                        style={{
                          margin: 0,
                          padding: 12,
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(0,0,0,0.25)",
                          color: "rgba(255,255,255,0.92)",
                          overflow: "auto",
                          maxHeight: 360,
                          fontSize: 12,
                          lineHeight: 1.4,
                          fontFamily:
                            'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        }}
                      >
                        {result.responseBody.kind === "json"
                          ? JSON.stringify(result.responseBody.value, null, 2)
                          : String(result.responseBody.value || "")}
                      </pre>
                    ) : (
                      <div className="muted" style={{ fontSize: 13 }}>
                        No response body.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="muted" style={{ marginTop: 10, fontSize: 13 }}>
                    No result recorded for this payload yet.
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

