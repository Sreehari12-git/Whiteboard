import React from "react";
import { useNavigate } from "react-router-dom";
import { getFlows, createFlow, deleteFlow } from "../e2eTesting/e2eStorage";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return "";
  }
}

export default function E2ETesting() {
  const navigate = useNavigate();
  const [flows, setFlows] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [name, setName] = React.useState("");

  const refresh = React.useCallback(async () => {
    const loaded = await getFlows();
    setFlows(loaded);
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const openCreate = () => {
    setName("");
    setShowModal(true);
  };

  const onCreate = async () => {
    const flow = await createFlow({ name });
    setShowModal(false);
    await refresh();
    navigate(`/e2e-testing/${flow.id}`);
  };

  const onDelete = async (e, flowId) => {
    e.stopPropagation();
    const ok = window.confirm("Delete this flow?");
    if (!ok) return;
    await deleteFlow(flowId);
    await refresh();
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div className="panel" style={{ padding: 18 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>E2E Testing</div>
            <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
              Create end-to-end API flows, map data between steps, and run tests.
            </div>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            + Create Flow
          </button>
        </div>
      </div>

      <div className="panel" style={{ padding: 18 }}>
        {flows.length === 0 ? (
          <div className="muted" style={{ fontSize: 13, lineHeight: 1.5 }}>
            No flows yet. Click <strong style={{ color: "#fff" }}>Create Flow</strong> to start building.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
            {flows.map((flow) => (
              <div
                key={flow.id}
                className="panel"
                style={{
                  padding: 14,
                  cursor: "pointer",
                  background: "rgba(255,255,255,0.05)",
                }}
                onClick={() => navigate(`/e2e-testing/${flow.id}`)}
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
                      {flow.name}
                    </div>
                    <div className="muted" style={{ marginTop: 6, fontSize: 12 }}>
                      {flow.nodes?.length || 0} steps
                    </div>
                    <div className="muted" style={{ marginTop: 8, fontSize: 12 }}>
                      Updated: {formatDate(flow.updatedAt || flow.createdAt)}
                    </div>
                  </div>

                  <button className="btn" onClick={(e) => onDelete(e, flow.id)} title="Delete Flow">
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
          <div className="panel" onClick={(e) => e.stopPropagation()} style={{ width: 420, maxWidth: "100%", padding: 16 }}>
            <div style={{ fontWeight: 900, color: "#fff", fontSize: 14 }}>Create E2E Flow</div>
            <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>
              Give your flow a name. You can add API steps on the next screen.
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 12, marginBottom: 6 }}>
                  Name
                </div>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. User Registration & Login"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && onCreate()}
                />
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
