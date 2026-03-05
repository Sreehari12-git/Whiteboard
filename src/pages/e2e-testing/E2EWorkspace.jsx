import React, { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
} from "reactflow";
import "reactflow/dist/style.css";
import { v4 as uuidv4 } from "uuid";
import { getFlowById, upsertFlow } from "../../e2eTesting/e2eStorage";
import { getApis } from "../../apiTesting/apiTestingStorage";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const flattenKeys = (obj, prefix = "") => {
  if (obj === null || obj === undefined) return [];
  if (Array.isArray(obj)) {
    return obj.length > 0 ? flattenKeys(obj[0], prefix) : [];
  }
  if (typeof obj === "object") {
    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      return [fullKey, ...flattenKeys(value, fullKey)];
    });
  }
  return [];
};

function safeJsonParse(text) {
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// MappingEdge
// ─────────────────────────────────────────────────────────────────────────────

const MappingEdge = ({
  id,
  source,
  target,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}) => {
  const sourceNode = data?.nodesRef?.current?.find((n) => n.id === source);
  const targetNode = data?.nodesRef?.current?.find((n) => n.id === target);

  const sourceApi = sourceNode?.data?.api;
  const targetApi = targetNode?.data?.api;

  const sourceResponseDto = safeJsonParse(sourceApi?.payloads?.[0]?.lastResponseSample || "{}");
  const targetRequestDto = safeJsonParse(targetApi?.payloads?.[0]?.bodyJson || "{}");

  const responseKeys = flattenKeys(sourceResponseDto);
  const requestKeys = flattenKeys(targetRequestDto);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const mappingRows = data?.mappingRows || [{ id: uuidv4(), sourceKey: "", targetKey: "" }];

  return (
    <>
      <BaseEdge id={id} path={edgePath} style={{ stroke: "rgba(99, 102, 241, 0.6)", strokeWidth: 2 }} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: "rgba(15, 23, 42, 0.95)",
            padding: "10px",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: "10px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            pointerEvents: "all",
            zIndex: 1000,
            fontSize: "11px",
            minWidth: "280px",
            color: "#fff",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ fontWeight: 800, marginBottom: 8, textAlign: "center", fontSize: 12 }}>Data Mapping</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 20px 1fr 24px", gap: "6px", alignItems: "center" }}>
            <div className="muted" style={{ fontSize: 9, textTransform: "uppercase" }}>Source Response</div>
            <div />
            <div className="muted" style={{ fontSize: 9, textTransform: "uppercase" }}>Target Request</div>
            <div />

            {mappingRows.map((row) => (
              <React.Fragment key={row.id}>
                <select
                  className="select"
                  style={{ padding: "4px", fontSize: "11px" }}
                  value={row.sourceKey}
                  onChange={(e) => data?.onMappingChange(id, row.id, "sourceKey", e.target.value)}
                >
                  <option value="">Select key</option>
                  {responseKeys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.4)" }}>→</div>
                <select
                  className="select"
                  style={{ padding: "4px", fontSize: "11px" }}
                  value={row.targetKey}
                  onChange={(e) => data?.onMappingChange(id, row.id, "targetKey", e.target.value)}
                >
                  <option value="">Select key</option>
                  {requestKeys.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
                <button
                  className="btn"
                  style={{ padding: "2px 6px", fontSize: "12px" }}
                  onClick={() => data?.onRemoveRow(id, row.id)}
                >
                  ✕
                </button>
              </React.Fragment>
            ))}
          </div>
          <button
            className="btn"
            style={{ marginTop: "8px", width: "100%", fontSize: "11px", padding: "4px" }}
            onClick={() => data?.onAddRow(id)}
          >
            + Add mapping
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const edgeTypes = { mappingEdge: MappingEdge };

// ─────────────────────────────────────────────────────────────────────────────
// E2EWorkspace
// ─────────────────────────────────────────────────────────────────────────────

export default function E2EWorkspace() {
  const { flowId } = useParams();
  const navigate = useNavigate();

  const [flow, setFlow] = useState(null);
  const [apis, setApis] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [toast, setToast] = useState("");

  const nodesRef = useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    async function load() {
      const loadedFlow = await getFlowById(flowId);
      if (loadedFlow) {
        setFlow(loadedFlow);
        setNodes(loadedFlow.nodes || []);
        setEdges(loadedFlow.edges || []);
      }
      const loadedApis = await getApis();
      setApis(loadedApis);
    }
    load();
  }, [flowId, setNodes, setEdges]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 1400);
    return () => clearTimeout(t);
  }, [toast]);

  const onMappingChange = useCallback((edgeId, rowId, field, value) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== edgeId) return e;
        const mappingRows = (e.data?.mappingRows || []).map((row) =>
          row.id === rowId ? { ...row, [field]: value } : row
        );
        return { ...e, data: { ...e.data, mappingRows } };
      })
    );
  }, [setEdges]);

  const onAddRow = useCallback((edgeId) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== edgeId) return e;
        return {
          ...e,
          data: {
            ...e.data,
            mappingRows: [...(e.data?.mappingRows || []), { id: uuidv4(), sourceKey: "", targetKey: "" }],
          },
        };
      })
    );
  }, [setEdges]);

  const onRemoveRow = useCallback((edgeId, rowId) => {
    setEdges((eds) =>
      eds.map((e) => {
        if (e.id !== edgeId) return e;
        const mappingRows = (e.data?.mappingRows || []).filter((r) => r.id !== rowId);
        return { ...e, data: { ...e.data, mappingRows: mappingRows.length ? mappingRows : [{ id: uuidv4(), sourceKey: "", targetKey: "" }] } };
      })
    );
  }, [setEdges]);

  const enrichedEdges = useMemo(() => edges.map((e) => ({
    ...e,
    data: { ...e.data, nodesRef, onMappingChange, onAddRow, onRemoveRow },
  })), [edges, onMappingChange, onAddRow, onRemoveRow]);

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge({
      ...params,
      type: "mappingEdge",
      data: { mappingRows: [{ id: uuidv4(), sourceKey: "", targetKey: "" }] }
    }, eds));
  }, [setEdges]);

  const handleSave = async () => {
    if (!flow) return;
    const updated = { ...flow, nodes, edges };
    await upsertFlow(updated);
    setFlow(updated);
    setToast("Flow saved");
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event) => {
    event.preventDefault();
    const apiData = JSON.parse(event.dataTransfer.getData("application/reactflow-api"));
    if (!apiData) return;

    const position = { x: event.clientX - 400, y: event.clientY - 100 };
    const newNode = {
      id: uuidv4(),
      type: "default",
      position,
      data: {
        label: (
          <div style={{ textAlign: "left" }}>
            <div style={{ fontWeight: 800, fontSize: "12px" }}>{apiData.name}</div>
            <div className="muted" style={{ fontSize: "10px", marginTop: "2px" }}>{apiData.method} {apiData.url}</div>
          </div>
        ),
        api: apiData,
      },
      style: {
        background: "rgba(30, 41, 59, 0.9)",
        color: "#fff",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: "12px",
        padding: "10px",
        width: 200,
      }
    };

    setNodes((nds) => [...nds, newNode]);
  };

  if (!flow) return <div className="muted" style={{ padding: 20 }}>Loading flow...</div>;

  return (
    <div style={{ display: "grid", gridTemplateRows: "auto 1fr", height: "100%", gap: 12 }}>
      <div className="panel" style={{ padding: 14, display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 900, color: "#fff", fontSize: 14 }}>{flow.name}</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 12 }}>E2E Flow Workspace</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {toast ? <div className="muted" style={{ fontSize: 12 }}>{toast}</div> : null}
          <button className="btn" onClick={() => navigate("/e2e-testing")}>Back</button>
          <button className="btn" onClick={handleSave}>Save</button>
          <button className="btn btn-primary" onClick={() => navigate(`/e2e-testing/${flow.id}/report`)}>Run & Report</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 12, height: "100%", minHeight: 0 }}>
        <div className="panel" style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
          <div style={{ fontWeight: 800, color: "#fff", fontSize: 13 }}>APIs</div>
          <div className="muted" style={{ fontSize: 11 }}>Drag APIs onto the canvas to build your flow.</div>
          <div style={{ display: "grid", gap: 8, marginTop: 4 }}>
            {apis.map((api) => (
              <div
                key={api.id}
                draggable
                onDragStart={(e) => e.dataTransfer.setData("application/reactflow-api", JSON.stringify(api))}
                style={{
                  padding: "10px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  cursor: "grab",
                }}
              >
                <div style={{ fontWeight: 750, color: "#fff", fontSize: 12 }}>{api.name}</div>
                <div className="muted" style={{ fontSize: 10, marginTop: 2 }}>{api.method}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel" style={{ position: "relative", overflow: "hidden" }}>
          <ReactFlow
            nodes={nodes}
            edges={enrichedEdges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            edgeTypes={edgeTypes}
            fitView
          >
            <Background variant="dots" gap={20} size={1} color="rgba(255,255,255,0.1)" />
            <Controls />
          </ReactFlow>
        </div>
      </div>
    </div>
  );
}
