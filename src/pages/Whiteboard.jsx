import React, { useCallback, useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate, useParams } from "react-router-dom";
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "reactflow";

// ─────────────────────────────────────────────────────────────────────────────
// Recursively flattens all keys from a nested object/array using dot notation.
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

// Returns a map of { "key.path": "string" | "number" | "boolean" | "object" | "array" }
const flattenTypes = (obj, prefix = "") => {
  if (obj === null || obj === undefined) return {};
  if (Array.isArray(obj)) {
    const result = { [prefix]: "array" };
    if (obj.length > 0) Object.assign(result, flattenTypes(obj[0], prefix));
    return result;
  }
  if (typeof obj === "object") {
    const result = prefix ? { [prefix]: "object" } : {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      Object.assign(result, flattenTypes(value, fullKey));
    }
    return result;
  }
  // Primitive — detect type from value or from empty string convention
  const type = obj === "" ? "string" : typeof obj;
  return { [prefix]: type };
};

// Infer type from a value in the DTO (empty string = "string", number = "number", etc.)
const inferType = (obj, keyPath) => {
  const types = flattenTypes(obj);
  return types[keyPath] || "unknown";
};

// ─────────────────────────────────────────────────────────────────────────────
// MappingEdge — MUST be defined OUTSIDE Whiteboard.
// Do NOT put any Whiteboard state or hooks in here.
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

  const requestDto = targetNode?.data?.dtos?.request;
  const responseDto = sourceNode?.data?.dtos?.response;

  const parsedRequest =
    typeof requestDto === "string" ? JSON.parse(requestDto) : requestDto || {};
  const parsedResponse =
    typeof responseDto === "string" ? JSON.parse(responseDto) : responseDto || {};

  const requestKeys = flattenKeys(parsedRequest);
  const responseKeys = flattenKeys(parsedResponse);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const mappingRows = data?.mappingRows || [
    { id: uuidv4(), requestKey: "", responseKey: "" },
  ];

  const handleRowChange = (rowId, field, value) => {
    data?.onMappingChange?.(id, rowId, field, value);
  };

  const handleAddRow = (e) => {
    e.stopPropagation();
    data?.onAddRow?.(id);
  };

  const handleRemoveRow = (e, rowId) => {
    e.stopPropagation();
    data?.onRemoveRow?.(id, rowId);
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            background: "white",
            padding: "10px 14px",
            border: "1px solid #d0d0d0",
            borderRadius: "8px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
            pointerEvents: "all",
            zIndex: 1000,
            fontSize: "12px",
            minWidth: "340px",
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div style={{ textAlign: "center", marginBottom: "6px" }}>
            <h4 style={{ margin: 0, fontSize: "13px", color: "#333" }}>Mapping</h4>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 24px 1fr 28px",
              gap: "6px",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            <span style={{ fontSize: "10px", color: "#888", fontWeight: 700, textTransform: "uppercase", textAlign: "center" }}>
              Target Payload for{" "}
              <span style={{ color: "#3b82f6", textTransform: "none", fontSize: "15px" }}>
                {targetNode?.data?.label || "?"}
              </span>
            </span>
            <span />
            <span style={{ fontSize: "10px", color: "#888", fontWeight: 700, textTransform: "uppercase", textAlign: "center" }}>
              Source Response for{" "}
              <span style={{ color: "#10b981", textTransform: "none", fontSize: "15px" }}>
                {sourceNode?.data?.label || "?"}
              </span>
            </span>
            <span />
          </div>

          {mappingRows.map((row) => (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 24px 1fr 28px",
                gap: "6px",
                alignItems: "center",
                marginBottom: "5px",
                flexWrap: "wrap",
              }}
            >
              {(() => {
                const reqType = row.requestKey ? inferType(parsedRequest, row.requestKey) : null;
                const resType = row.responseKey ? inferType(parsedResponse, row.responseKey) : null;
                const typeMismatch = reqType && resType && reqType !== resType;
                const mismatchStyle = typeMismatch
                  ? { border: "1.5px solid #e55", background: "#fff5f5" }
                  : {};
                return (
                  <>
                    {/* Row: select → select × — always 4 grid columns */}
                    <select
                      value={row.requestKey || ""}
                      onChange={(e) => handleRowChange(row.id, "requestKey", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{ padding: "4px", width: "100%", fontSize: "12px", ...mismatchStyle }}
                      title={typeMismatch ? `Type mismatch: "${reqType}" vs "${resType}"` : reqType || ""}
                    >
                      <option value="">Select key</option>
                      {requestKeys.map((k) => {
                        const usedInOtherRow = mappingRows.some((r) => r.id !== row.id && r.requestKey === k);
                        return (
                          <option key={k} value={k} disabled={usedInOtherRow}>
                            {k}{usedInOtherRow ? " (used)" : ""}
                          </option>
                        );
                      })}
                    </select>

                    <span style={{ textAlign: "center", color: typeMismatch ? "#e55" : "#aaa", fontWeight: typeMismatch ? "bold" : "normal" }}>→</span>

                    <select
                      value={row.responseKey || ""}
                      onChange={(e) => handleRowChange(row.id, "responseKey", e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onMouseDown={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      style={{ padding: "4px", width: "100%", fontSize: "12px", ...mismatchStyle }}
                      title={typeMismatch ? `Type mismatch: "${reqType}" vs "${resType}"` : resType || ""}
                    >
                      <option value="">Select key</option>
                      {responseKeys.map((k) => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>

                    {/* × button is INSIDE the fragment — always column 4 */}
                    {mappingRows.length > 1 ? (
                      <button
                        onClick={(e) => handleRemoveRow(e, row.id)}
                        onMouseDown={(e) => e.stopPropagation()}
                        onPointerDown={(e) => e.stopPropagation()}
                        style={{
                          width: "22px", height: "22px", padding: 0,
                          fontSize: "14px", lineHeight: "20px", textAlign: "center",
                          cursor: "pointer", border: "1px solid #ddd",
                          borderRadius: "4px", background: "#fff", color: "#e55",
                          alignSelf: "center",
                        }}
                        title="Remove row"
                      >
                        ×
                      </button>
                    ) : (
                      <span style={{ width: "22px" }} />
                    )}

                    {/* Warning spans full width BELOW the 4-column row */}
                    {typeMismatch && (
                      <span style={{ gridColumn: "1 / -1", fontSize: "10px", color: "#e55", marginTop: "2px" }}>
                        ⚠ Type mismatch: <b>{reqType}</b> → <b>{resType}</b>
                      </span>
                    )}
                  </>
                );
              })()}
            </div>
          ))}

          {(() => {
            const usedRequestKeys = mappingRows.map((r) => r.requestKey).filter(Boolean);
            const allRequestKeysMapped = requestKeys.length > 0 && usedRequestKeys.length >= requestKeys.length;
            const allKeysUsed = requestKeys.every((k) => usedRequestKeys.includes(k));
            const canAddMore = !allRequestKeysMapped && !allKeysUsed;
            return canAddMore ? (
              <button
                onClick={handleAddRow}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  marginTop: "4px", padding: "3px 10px", fontSize: "12px",
                  cursor: "pointer", border: "1px dashed #bbb", borderRadius: "4px",
                  background: "#fafafa", color: "#555", width: "100%",
                }}
              >
                + Add mapping
              </button>
            ) : requestKeys.length > 0 ? (
              <div style={{ marginTop: "4px", padding: "3px 10px", fontSize: "11px", color: "#aaa", textAlign: "center" }}>
                All request keys mapped
              </div>
            ) : null;
          })()}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// Defined outside — stable reference, ReactFlow never remounts edges
const edgeTypes = { mappingEdge: MappingEdge };

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function Whiteboard() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [sidebarNodes, setSidebarNodes] = useState(() => {
    const saved = localStorage.getItem("sidebarNodes");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("sidebarNodes", JSON.stringify(sidebarNodes));
  }, [sidebarNodes]);

  const [showModal, setShowModal] = useState(false);

  // ✅ editingNode is in Whiteboard — null = create mode, node object = edit mode
  const [editingNode, setEditingNode] = useState(null);

  const [formData, setFormData] = useState({
    id: "",
    name: "",
    requestDto: "",
    responseDto: "",
  });

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const nodesRef = React.useRef(nodes);
  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  const onMappingChange = useCallback(
    (edgeId, rowId, field, value) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edgeId) return e;
          const updatedRows = (e.data?.mappingRows || []).map((row) =>
            row.id === rowId ? { ...row, [field]: value } : row
          );
          return { ...e, data: { ...e.data, mappingRows: updatedRows } };
        })
      );
    },
    [setEdges]
  );

  const onAddRow = useCallback(
    (edgeId) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edgeId) return e;
          const newRow = { id: uuidv4(), requestKey: "", responseKey: "" };
          return {
            ...e,
            data: { ...e.data, mappingRows: [...(e.data?.mappingRows || []), newRow] },
          };
        })
      );
    },
    [setEdges]
  );

  const onRemoveRow = useCallback(
    (edgeId, rowId) => {
      setEdges((eds) =>
        eds.map((e) => {
          if (e.id !== edgeId) return e;
          return {
            ...e,
            data: {
              ...e.data,
              mappingRows: (e.data?.mappingRows || []).filter((r) => r.id !== rowId),
            },
          };
        })
      );
    },
    [setEdges]
  );

  const enrichedEdges = edges.map((e) => ({
    ...e,
    data: { ...e.data, nodesRef, onMappingChange, onAddRow, onRemoveRow },
  }));

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            type: "mappingEdge",
            data: {
              mappingRows: [{ id: uuidv4(), requestKey: "", responseKey: "" }],
            },
          },
          eds
        )
      ),
    [setEdges]
  );

  // ✅ onNodeDoubleClick is in Whiteboard — has full access to state setters
  const onNodeDoubleClick = useCallback((event, node) => {
    setEditingNode(node);
    setFormData({
      id: node.data.id || node.id,
      name: node.data.label,
      requestDto: JSON.stringify(node.data?.dtos?.request || {}, null, 2),
      responseDto: JSON.stringify(node.data?.dtos?.response || {}, null, 2),
    });
    setShowModal(true);
  }, []);

  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event) => {
    event.preventDefault();
    const rawData = event.dataTransfer.getData("application/reactflow");
    if (!rawData) return;

    const nodeData = JSON.parse(rawData);
    const position = { x: event.clientX - 220, y: event.clientY - 50 };
    const newNodeId = uuidv4();

    const newNode = {
      id: newNodeId,
      position,
      data: { label: nodeData.label, id: nodeData.id, dtos: nodeData.dtos },
      type: "default",
    };

    setNodes((prevNodes) => {
      if (prevNodes.length > 0) {
        const lastNode = prevNodes[prevNodes.length - 1];
        setEdges((prevEdges) => [
          ...prevEdges,
          {
            id: uuidv4(),
            source: lastNode.id,
            target: newNodeId,
            type: "mappingEdge",
            data: {
              mappingRows: [{ id: uuidv4(), requestKey: "", responseKey: "" }],
            },
          },
        ]);
      }
      return [...prevNodes, newNode];
    });
  };

  const handleSave = () => {
    const savedFlows = JSON.parse(localStorage.getItem("flows")) || [];
    const existingFlow = savedFlows.find((flow) => flow.id === id);

    const serializableEdges = edges.map(({ data, ...rest }) => ({
      ...rest,
      data: {
        mappingRows: (data?.mappingRows || []).map(
          ({ id: rid, requestKey, responseKey }) => ({
            id: rid,
            requestKey: requestKey || "",
            responseKey: responseKey || "",
          })
        ),
      },
    }));

    let updatedFlows;
    if (existingFlow) {
      updatedFlows = savedFlows.map((flow) =>
        flow.id === id ? { ...flow, nodes, edges: serializableEdges } : flow
      );
    } else {
      updatedFlows = [
        ...savedFlows,
        {
          id,
          name: `Flow ${savedFlows.length + 1}`,
          createdAt: new Date().toLocaleString(),
          nodes,
          edges: serializableEdges,
        },
      ];
    }

    localStorage.setItem("flows", JSON.stringify(updatedFlows));
    const nodeNames = nodes.map((n) => n.data.label || n.id).join(", ") || "none";
    const edgeCount = edges.length;
    alert(`Flow saved successfully!\n\nNodes (${nodes.length}): ${nodeNames}\nConnections: ${edgeCount}`);
  };

  useEffect(() => {
    if (!id) return;
    const savedFlows = JSON.parse(localStorage.getItem("flows")) || [];
    const existingFlow = savedFlows.find((flow) => flow.id === id);
    if (existingFlow) {
      setNodes(existingFlow.nodes || []);
      setEdges(existingFlow.edges || []);
    }
  }, [id, setNodes, setEdges]);

  // ✅ Handles both CREATE and EDIT
  const handleCreateNode = () => {
    if (!formData.id || !formData.name) {
      alert("ID and Name are required");
      return;
    }

    let parsedRequest, parsedResponse;
    try {
      parsedRequest = formData.requestDto ? JSON.parse(formData.requestDto) : {};
      parsedResponse = formData.responseDto ? JSON.parse(formData.responseDto) : {};
    } catch {
      alert("DTOs must be valid JSON format");
      return;
    }

    if (editingNode) {
      const originalId = editingNode.data.id || editingNode.id;
      const originalName = editingNode.data.label || originalId;

      // Always update the sidebar node
      setSidebarNodes((prev) =>
        prev.map((sn) =>
          sn.id === originalId
            ? { ...sn, id: formData.id, label: formData.name, dtos: { request: parsedRequest, response: parsedResponse } }
            : sn
        )
      );

      if (!editingNode.isSidebarNode) {
        // Canvas double-click — update only that specific canvas node
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id !== editingNode.id) return n;
            return {
              ...n,
              data: {
                ...n.data,
                label: formData.name,
                id: formData.id,
                dtos: { request: parsedRequest, response: parsedResponse },
              },
            };
          })
        );
        alert(`Canvas node "${originalName}" updated.\nName: "${formData.name}"\nRequest keys: ${Object.keys(parsedRequest).join(", ") || "none"}\nResponse keys: ${Object.keys(parsedResponse).join(", ") || "none"}`);
      } else {
        // Sidebar double-click — update ALL canvas nodes that came from this sidebar node
        setNodes((nds) =>
          nds.map((n) => {
            if ((n.data.id || n.id) !== originalId) return n;
            return {
              ...n,
              data: {
                ...n.data,
                label: formData.name,
                id: formData.id,
                dtos: { request: parsedRequest, response: parsedResponse },
              },
            };
          })
        );
        alert(`Sidebar node "${originalName}" updated.\nName: "${formData.name}"\nRequest keys: ${Object.keys(parsedRequest).join(", ") || "none"}\nResponse keys: ${Object.keys(parsedResponse).join(", ") || "none"}`);
      }
    } else {
      // CREATE MODE — add to sidebar
      setSidebarNodes((prev) => [
        ...prev,
        {
          id: formData.id,
          label: formData.name,
          dtos: { request: parsedRequest, response: parsedResponse },
        },
      ]);
      alert(`Node "${formData.name}" created.\nRequest keys: ${Object.keys(parsedRequest).join(", ") || "none"}\nResponse keys: ${Object.keys(parsedResponse).join(", ") || "none"}\nDrag it onto the canvas to use it.`);
    }

    setFormData({ id: "", name: "", requestDto: "", responseDto: "" });
    setEditingNode(null);
    setShowModal(false);
  };

  const handleCloseModal = () => {
    setFormData({ id: "", name: "", requestDto: "", responseDto: "" });
    setEditingNode(null);
    setShowModal(false);
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* LEFT PANEL */}
      <div
        style={{
          width: "200px",
          background: "#f4f4f4",
          padding: "10px",
          borderRight: "1px solid #ddd",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button onClick={() => navigate("/")}>← Back</button>
        <h3 style={{ margin: "12px 0 8px" }}>Nodes</h3>

        {sidebarNodes.map((node) => (
          <div
            key={node.id}
            draggable
            onDragStart={(event) =>
              event.dataTransfer.setData(
                "application/reactflow",
                JSON.stringify(node)
              )
            }
            onDoubleClick={() => {
              setEditingNode({ id: node.id, data: { id: node.id, label: node.label, dtos: node.dtos }, isSidebarNode: true });
              setFormData({
                id: node.id,
                name: node.label,
                requestDto: JSON.stringify(node.dtos?.request || {}, null, 2),
                responseDto: JSON.stringify(node.dtos?.response || {}, null, 2),
              });
              setShowModal(true);
            }}
            style={{
              padding: "8px",
              margin: "4px 0",
              background: "white",
              border: "1px solid #999",
              borderRadius: "4px",
              cursor: "grab",
              fontSize: "13px",
              userSelect: "none",
            }}
            title="Double-click to edit"
          >
            {node.label}
          </div>
        ))}

        <button
          onClick={() => {
            setEditingNode(null);
            setFormData({ id: "", name: "", requestDto: "", responseDto: "" });
            setShowModal(true);
          }}
          style={{ marginTop: "auto", padding: "8px 12px" }}
        >
          + Create node
        </button>
      </div>

      {/* CANVAS */}
      <div style={{ flexGrow: 1, position: "relative" }}>
        <button
          onClick={handleSave}
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            zIndex: 10,
            padding: "8px 14px",
            background: "#555",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Save
        </button>

        <ReactFlow
          nodes={nodes}
          edges={enrichedEdges}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeDoubleClick={onNodeDoubleClick}
          fitView
        >
          <Controls position="bottom-right" />
          <Background variant="dots" gap={20} size={1} />
        </ReactFlow>
      </div>

      {/* CREATE / EDIT NODE MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 100,
          }}
        >
          <div
            style={{
              background: "white",
              padding: "24px",
              borderRadius: "8px",
              width: "360px",
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <h3 style={{ margin: 0 }}>{editingNode ? "Edit Node" : "Create Node"}</h3>

            <input
              placeholder="ID"
              value={formData.id}
              readOnly={!!editingNode}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              style={{
                width: "100%",
                padding: "6px",
                boxSizing: "border-box",
                background: editingNode ? "#f5f5f5" : "white",
                color: editingNode ? "#999" : "inherit",
              }}
            />
            <input
              placeholder="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
            />
            <textarea
              placeholder={'Request DTO  e.g. {"userId": "", "amount": ""}'}
              value={formData.requestDto}
              onChange={(e) => setFormData({ ...formData, requestDto: e.target.value })}
              rows={4}
              style={{
                width: "100%", padding: "6px", boxSizing: "border-box",
                fontFamily: "monospace", fontSize: "12px",
              }}
            />
            <textarea
              placeholder={'Response DTO  e.g. {"status": "", "txnId": ""}'}
              value={formData.responseDto}
              onChange={(e) => setFormData({ ...formData, responseDto: e.target.value })}
              rows={4}
              style={{
                width: "100%", padding: "6px", boxSizing: "border-box",
                fontFamily: "monospace", fontSize: "12px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={handleCloseModal}>Cancel</button>
              <button onClick={handleCreateNode}>
                {editingNode ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}