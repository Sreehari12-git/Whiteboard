import React from "react";
import { useNavigate } from "react-router-dom";
import { createApi, deleteApi, getApis } from "../../apiTesting/apiTestingStorage";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"];

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

export default function ApiTestingDashboard() {
  const navigate = useNavigate();
  const [apis, setApis] = React.useState([]);

  const [showModal, setShowModal] = React.useState(false);
  const [name, setName] = React.useState("");
  const [method, setMethod] = React.useState("POST");
  const [url, setUrl] = React.useState("");

  const refresh = React.useCallback(async () => {
    const loaded = await getApis();
    setApis(loaded);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setName("");
    setMethod("POST");
    setUrl("");
    setShowModal(true);
  };

  const onCreate = async () => {
    const api = await createApi({ name, method, url });
    setShowModal(false);
    await refresh();
    navigate(`/api-testing/${api.id}`);
  };

  const onDelete = async (e, apiId) => {
    e.stopPropagation();
    const ok = window.confirm("Delete this API?");
    if (!ok) return;
    await deleteApi(apiId);
    await refresh();
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="panel" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>API Testing</div>
            <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
              Create APIs, test multiple payloads, generate pass/fail reports.
            </div>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            + Create API
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 18 }}>
        {apis.length === 0 ? (
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
            No APIs yet. Click <strong style={{ color: "#fff" }}>Create API</strong> to start testing.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {apis.map((api) => (
              <div
                key={api.id}
                className="panel"
                style={{
                  padding: 14,
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.05)",
                }}
                onClick={() => navigate(`/api-testing/${api.id}`)}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 800,
                        color: "#fff",
                        fontSize: 14,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {api.name}
                    </div>
                    <div className="muted" style={{ marginTop: 6, fontSize: 12, lineHeight: 1.35 }}>
                      <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 800 }}>{api.method}</span>{" "}
                      <span style={{ wordBreak: "break-all" }}>{api.url || "(no URL yet)"}</span>
                    </div>
                    <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                      Updated: {formatDate(api.updatedAt || api.createdAt)}
                    </div>
                  </div>

                  <button className="btn" onClick={(e) => onDelete(e, api.id)} title="Delete API">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal ? (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 18,
            zIndex: 2000,
          }}
        >
          <div className="panel" onClick={(e) => e.stopPropagation()} style={{ width: 520, maxWidth: "100%", padding: 16 }}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 14 }}>Create API</div>
            <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
              Give it a name, method, and URL. You can add payloads after creating.
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Name
                </div>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Create User" />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "140px 1fr", gap: 10 }}>
                <div>
                  <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                    Method
                  </div>
                  <select className="select" value={method} onChange={(e) => setMethod(e.target.value)}>
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
                  <input
                    className="input"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://api.example.com/v1/users"
                  />
                </div>
              </div>
            </div>

            <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button className="btn" onClick={() => setShowModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={onCreate}>
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
