// import React, { useCallback, useState, useEffect } from "react";
// import { v4 as uuidv4 } from "uuid";
// import ReactFlow, {
//   Background,
//   Controls,
//   addEdge,
//   useNodesState,
//   useEdgesState,
// } from "reactflow";
// import "reactflow/dist/style.css";
// import { useNavigate, useParams } from "react-router-dom";
// import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "reactflow";

// // ─────────────────────────────────────────────────────────────────────────────
// // MappingEdge — MUST be defined outside Whiteboard so React never remounts it.
// // If defined inside, every parent re-render creates a new component identity,
// // which unmounts + remounts the edge, resetting all dropdown values.
// // ─────────────────────────────────────────────────────────────────────────────
// const MappingEdge = ({
//   id,
//   source,
//   target,
//   sourceX,
//   sourceY,
//   targetX,
//   targetY,
//   sourcePosition,
//   targetPosition,
//   data,
// }) => {
//   const sourceNode = data?.nodesRef?.current?.find((n) => n.id === source);
//   const targetNode = data?.nodesRef?.current?.find((n) => n.id === target);

//   const requestKeys = Object.keys(targetNode?.data?.dtos?.request || {});
//   const responseKeys = Object.keys(sourceNode?.data?.dtos?.response || {});

//   // ✅ FIX 1: getBezierPath returns [pathString, labelX, labelY].
//   // The missing `path` prop on BaseEdge was why edges were invisible.
//   const [edgePath, labelX, labelY] = getBezierPath({
//     sourceX,
//     sourceY,
//     sourcePosition,
//     targetX,
//     targetY,
//     targetPosition,
//   });

//   const mappingRows = data?.mappingRows || [{ id: uuidv4(), requestKey: "", responseKey: "" }];

//   const handleRowChange = (rowId, field, value) => {
//     data?.onMappingChange?.(id, rowId, field, value);
//   };

//   const handleAddRow = (e) => {
//     e.stopPropagation();
//     data?.onAddRow?.(id);
//   };

//   const handleRemoveRow = (e, rowId) => {
//     e.stopPropagation();
//     data?.onRemoveRow?.(id, rowId);
//   };

//   return (
//     <>
//       {/* ✅ path prop is required for the SVG line to render */}
//       <BaseEdge id={id} path={edgePath} />

//       <EdgeLabelRenderer>
//         <div
//           style={{
//             position: "absolute",
//             transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
//             background: "white",
//             padding: "10px 14px",
//             border: "1px solid #d0d0d0",
//             borderRadius: "8px",
//             boxShadow: "0 2px 8px rgba(0,0,0,0.13)",
//             pointerEvents: "all",
//             zIndex: 1000,
//             fontSize: "12px",
//             minWidth: "320px",
//           }}
//           onClick={(e) => e.stopPropagation()}
//           onMouseDown={(e) => e.stopPropagation()}
//           onPointerDown={(e) => e.stopPropagation()}
//         >
//           {/* Header row */}
//           <div
//             style={{
//               display: "grid",
//               gridTemplateColumns: "1fr 24px 1fr 28px",
//               gap: "6px",
//               alignItems: "center",
//               marginBottom: "6px",
//             }}
//           >
//             <span style={{ fontSize: "10px", color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
//               Request 
//             </span>
//             <span />
//             <span style={{ fontSize: "10px", color: "#888", fontWeight: 700, textTransform: "uppercase" }}>
//                 Response
//             </span>
//             <span />
//           </div>

//           {/* Mapping rows */}
//           {mappingRows.map((row) => (
//             <div
//               key={row.id}
//               style={{
//                 display: "grid",
//                 gridTemplateColumns: "1fr 24px 1fr 28px",
//                 gap: "6px",
//                 alignItems: "center",
//                 marginBottom: "5px",
//               }}
//             >
//               {/* ✅ FIX 2: controlled `value` stored in edge data — not defaultValue.
//                   This ensures selection survives re-renders. */}
//               <select
//                 value={row.requestKey || ""}
//                 onChange={(e) => handleRowChange(row.id, "requestKey", e.target.value)}
//                 onClick={(e) => e.stopPropagation()}
//                 onMouseDown={(e) => e.stopPropagation()}
//                 onPointerDown={(e) => e.stopPropagation()}
//                 style={{ padding: "4px", width: "100%", fontSize: "12px" }}
//               >
//                 <option value="">Select key</option>
//                 {requestKeys.map((k) => (
//                   <option key={k} value={k}>{k}</option>
//                 ))}
//               </select>

//               <span style={{ textAlign: "center", color: "#aaa" }}>→</span>

//               <select
//                 value={row.responseKey || ""}
//                 onChange={(e) => handleRowChange(row.id, "responseKey", e.target.value)}
//                 onClick={(e) => e.stopPropagation()}
//                 onMouseDown={(e) => e.stopPropagation()}
//                 onPointerDown={(e) => e.stopPropagation()}
//                 style={{ padding: "4px", width: "100%", fontSize: "12px" }}
//               >
//                 <option value="">Select key</option>
//                 {responseKeys.map((k) => (
//                   <option key={k} value={k}>{k}</option>
//                 ))}
//               </select>

//               {/* Remove row button — hidden if only one row */}
//               {mappingRows.length > 1 ? (
//                 <button
//                   onClick={(e) => handleRemoveRow(e, row.id)}
//                   onMouseDown={(e) => e.stopPropagation()}
//                   onPointerDown={(e) => e.stopPropagation()}
//                   style={{
//                     width: "22px",
//                     height: "22px",
//                     padding: 0,
//                     fontSize: "14px",
//                     lineHeight: "20px",
//                     textAlign: "center",
//                     cursor: "pointer",
//                     border: "1px solid #ddd",
//                     borderRadius: "4px",
//                     background: "#fff",
//                     color: "#e55",
//                   }}
//                   title="Remove row"
//                 >
//                   ×
//                 </button>
//               ) : (
//                 <span style={{ width: "22px" }} />
//               )}
//             </div>
//           ))}

//           {/* Add row button */}
//           <button
//             onClick={handleAddRow}
//             onMouseDown={(e) => e.stopPropagation()}
//             onPointerDown={(e) => e.stopPropagation()}
//             style={{
//               marginTop: "4px",
//               padding: "3px 10px",
//               fontSize: "12px",
//               cursor: "pointer",
//               border: "1px dashed #bbb",
//               borderRadius: "4px",
//               background: "#fafafa",
//               color: "#555",
//               width: "100%",
//             }}
//           >
//             + Add mapping
//           </button>
//         </div>
//       </EdgeLabelRenderer>
//     </>
//   );
// };

// // ✅ Also defined outside — same reason as MappingEdge
// const edgeTypes = { mappingEdge: MappingEdge };

// // ─────────────────────────────────────────────────────────────────────────────
// // Main Component
// // ─────────────────────────────────────────────────────────────────────────────
// export default function Whiteboard() {
//   const navigate = useNavigate();
//   const { id } = useParams();

//   const [sidebarNodes, setSidebarNodes] = useState(() => {
//     const saved = localStorage.getItem("sidebarNodes");
//     return saved ? JSON.parse(saved) : [];
//   });

//   useEffect(() => {
//     localStorage.setItem("sidebarNodes", JSON.stringify(sidebarNodes));
//   }, [sidebarNodes]);

//   const [showModal, setShowModal] = useState(false);
//   const [formData, setFormData] = useState({
//     id: "",
//     name: "",
//     requestDto: "",
//     responseDto: "",
//   });

//   const [nodes, setNodes, onNodesChange] = useNodesState([]);
//   const [edges, setEdges, onEdgesChange] = useEdgesState([]);

//   // ✅ Ref so MappingEdge (outside the component) can always read the latest nodes
//   // without needing them passed as a prop (which would require redefining edgeTypes).
//   const nodesRef = React.useRef(nodes);
//   useEffect(() => {
//     nodesRef.current = nodes;
//   }, [nodes]);

//   // ── Mapping row callbacks ───────────────────────────────────────────────────

//   // Update a single field of a single row inside a specific edge
//   const onMappingChange = useCallback((edgeId, rowId, field, value) => {
//     setEdges((eds) =>
//       eds.map((e) => {
//         if (e.id !== edgeId) return e;
//         const updatedRows = (e.data?.mappingRows || []).map((row) =>
//           row.id === rowId ? { ...row, [field]: value } : row
//         );
//         return { ...e, data: { ...e.data, mappingRows: updatedRows } };
//       })
//     );
//   }, [setEdges]);

//   // Append a new empty row to an edge
//   const onAddRow = useCallback((edgeId) => {
//     setEdges((eds) =>
//       eds.map((e) => {
//         if (e.id !== edgeId) return e;
//         const newRow = { id: uuidv4(), requestKey: "", responseKey: "" };
//         return {
//           ...e,
//           data: {
//             ...e.data,
//             mappingRows: [...(e.data?.mappingRows || []), newRow],
//           },
//         };
//       })
//     );
//   }, [setEdges]);

//   // Remove a row from an edge
//   const onRemoveRow = useCallback((edgeId, rowId) => {
//     setEdges((eds) =>
//       eds.map((e) => {
//         if (e.id !== edgeId) return e;
//         return {
//           ...e,
//           data: {
//             ...e.data,
//             mappingRows: (e.data?.mappingRows || []).filter((r) => r.id !== rowId),
//           },
//         };
//       })
//     );
//   }, [setEdges]);

//   // ✅ Inject nodesRef + callbacks into each edge at render time.
//   // These are NOT serialisable — strip them before saving to localStorage.
//   const enrichedEdges = edges.map((e) => ({
//     ...e,
//     data: { ...e.data, nodesRef, onMappingChange, onAddRow, onRemoveRow },
//   }));

//   // ── ReactFlow handlers ──────────────────────────────────────────────────────

//   const onConnect = useCallback(
//     (params) =>
//       setEdges((eds) =>
//         addEdge(
//           {
//             ...params,
//             type: "mappingEdge",
//             data: {
//               mappingRows: [{ id: uuidv4(), requestKey: "", responseKey: "" }],
//             },
//           },
//           eds
//         )
//       ),
//     [setEdges]
//   );

//   const onDragOver = (event) => {
//     event.preventDefault();
//     event.dataTransfer.dropEffect = "move";
//   };

//   const onDrop = (event) => {
//     event.preventDefault();
//     const rawData = event.dataTransfer.getData("application/reactflow");
//     if (!rawData) return;

//     const nodeData = JSON.parse(rawData);
//     const position = { x: event.clientX - 220, y: event.clientY - 50 };
//     const newNodeId = uuidv4();

//     const newNode = {
//       id: newNodeId,
//       position,
//       data: { label: nodeData.label, id: nodeData.id, dtos: nodeData.dtos },
//       type: "default",
//     };

//     setNodes((prevNodes) => {
//       if (prevNodes.length > 0) {
//         const lastNode = prevNodes[prevNodes.length - 1];
//         setEdges((prevEdges) => [
//           ...prevEdges,
//           {
//             id: uuidv4(),
//             source: lastNode.id,
//             target: newNodeId,
//             type: "mappingEdge",
//             data: {
//               mappingRows: [{ id: uuidv4(), requestKey: "", responseKey: "" }],
//             },
//           },
//         ]);
//       }
//       return [...prevNodes, newNode];
//     });
//   };

//   // ── Save ────────────────────────────────────────────────────────────────────

//   const handleSave = () => {
//     const savedFlows = JSON.parse(localStorage.getItem("flows")) || [];
//     const existingFlow = savedFlows.find((flow) => flow.id === id);

//     // ✅ Strip non-serialisable refs/functions before writing to localStorage
//     const serializableEdges = edges.map(({ data, ...rest }) => ({
//       ...rest,
//       data: {
//         mappingRows: (data?.mappingRows || []).map(({ id: rid, requestKey, responseKey }) => ({
//           id: rid,
//           requestKey: requestKey || "",
//           responseKey: responseKey || "",
//         })),
//       },
//     }));

//     let updatedFlows;
//     if (existingFlow) {
//       updatedFlows = savedFlows.map((flow) =>
//         flow.id === id ? { ...flow, nodes, edges: serializableEdges } : flow
//       );
//     } else {
//       updatedFlows = [
//         ...savedFlows,
//         {
//           id,
//           name: `Flow ${savedFlows.length + 1}`,
//           createdAt: new Date().toLocaleString(),
//           nodes,
//           edges: serializableEdges,
//         },
//       ];
//     }

//     localStorage.setItem("flows", JSON.stringify(updatedFlows));
//     alert("Flow saved successfully");
//   };

//   // ── Load saved flow on mount ────────────────────────────────────────────────

//   useEffect(() => {
//     if (!id) return;
//     const savedFlows = JSON.parse(localStorage.getItem("flows")) || [];
//     const existingFlow = savedFlows.find((flow) => flow.id === id);
//     if (existingFlow) {
//       setNodes(existingFlow.nodes || []);
//       setEdges(existingFlow.edges || []);
//     }
//   }, [id, setNodes, setEdges]);

//   // ── Create sidebar node ─────────────────────────────────────────────────────

//   const handleCreateNode = () => {
//     if (!formData.id || !formData.name) {
//       alert("ID and Name are required");
//       return;
//     }
//     let parsedRequest, parsedResponse;
//     try {
//       parsedRequest = formData.requestDto ? JSON.parse(formData.requestDto) : {};
//       parsedResponse = formData.responseDto ? JSON.parse(formData.responseDto) : {};
//     } catch {
//       alert("DTOs must be valid JSON format");
//       return;
//     }

//     setSidebarNodes((prev) => [
//       ...prev,
//       {
//         id: formData.id,
//         label: formData.name,
//         dtos: { request: parsedRequest, response: parsedResponse },
//       },
//     ]);

//     setFormData({ id: "", name: "", requestDto: "", responseDto: "" });
//     setShowModal(false);
//   };

//   // ── Render ──────────────────────────────────────────────────────────────────

//   return (
//     <div style={{ display: "flex", height: "100vh" }}>
//       {/* LEFT PANEL */}
//       <div
//         style={{
//           width: "200px",
//           background: "#f4f4f4",
//           padding: "10px",
//           borderRight: "1px solid #ddd",
//           display: "flex",
//           flexDirection: "column",
//         }}
//       >
//         <button onClick={() => navigate("/")}>← Back</button>
//         <h3 style={{ margin: "12px 0 8px" }}>Nodes</h3>

//         {sidebarNodes.map((node) => (
//           <div
//             key={node.id}
//             draggable
//             onDragStart={(event) =>
//               event.dataTransfer.setData(
//                 "application/reactflow",
//                 JSON.stringify(node)
//               )
//             }
//             style={{
//               padding: "8px",
//               margin: "4px 0",
//               background: "white",
//               border: "1px solid #999",
//               borderRadius: "4px",
//               cursor: "grab",
//               fontSize: "13px",
//             }}
//           >
//             {node.label}
//           </div>
//         ))}

//         <button
//           onClick={() => setShowModal(true)}
//           style={{ marginTop: "auto", padding: "8px 12px" }}
//         >
//           + Create node
//         </button>
//       </div>

//       {/* CANVAS */}
//       <div style={{ flexGrow: 1, position: "relative" }}>
//         <button
//           onClick={handleSave}
//           style={{
//             position: "absolute",
//             top: 10,
//             right: 10,
//             zIndex: 10,
//             padding: "8px 14px",
//             background: "#555",
//             color: "white",
//             border: "none",
//             borderRadius: "4px",
//             cursor: "pointer",
//           }}
//         >
//           Save
//         </button>

//         <ReactFlow
//           nodes={nodes}
//           edges={enrichedEdges}
//           edgeTypes={edgeTypes}
//           onNodesChange={onNodesChange}
//           onEdgesChange={onEdgesChange}
//           onConnect={onConnect}
//           onDrop={onDrop}
//           onDragOver={onDragOver}
//           fitView
//         >
//           <Controls position="bottom-right" />
//           <Background variant="dots" gap={20} size={1} />
//         </ReactFlow>
//       </div>

//       {/* CREATE NODE MODAL */}
//       {showModal && (
//         <div
//           style={{
//             position: "fixed",
//             inset: 0,
//             background: "rgba(0,0,0,0.4)",
//             display: "flex",
//             justifyContent: "center",
//             alignItems: "center",
//             zIndex: 100,
//           }}
//         >
//           <div
//             style={{
//               background: "white",
//               padding: "24px",
//               borderRadius: "8px",
//               width: "360px",
//               display: "flex",
//               flexDirection: "column",
//               gap: "10px",
//             }}
//           >
//             <h3 style={{ margin: 0 }}>Create Node</h3>
//             <input
//               placeholder="ID"
//               value={formData.id}
//               onChange={(e) => setFormData({ ...formData, id: e.target.value })}
//               style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
//             />
//             <input
//               placeholder="Name"
//               value={formData.name}
//               onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//               style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
//             />
//             <textarea
//               placeholder={'Request DTO  e.g. {"userId": "", "amount": ""}'}
//               value={formData.requestDto}
//               onChange={(e) =>
//                 setFormData({ ...formData, requestDto: e.target.value })
//               }
//               rows={3}
//               style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
//             />
//             <textarea
//               placeholder={'Response DTO  e.g. {"status": "", "txnId": ""}'}
//               value={formData.responseDto}
//               onChange={(e) =>
//                 setFormData({ ...formData, responseDto: e.target.value })
//               }
//               rows={3}
//               style={{ width: "100%", padding: "6px", boxSizing: "border-box" }}
//             />
//             <div style={{ display: "flex", justifyContent: "space-between" }}>
//               <button onClick={() => setShowModal(false)}>Cancel</button>
//               <button onClick={handleCreateNode}>Create</button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

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
// e.g. { projects: [{ id: "", name: "" }] }
// → ["projects", "projects.id", "projects.name", ...]
// ─────────────────────────────────────────────────────────────────────────────
const flattenKeys = (obj, prefix = "") => {
  if (obj === null || obj === undefined) return [];

  if (Array.isArray(obj)) {
    // Use first element to infer the shape of array items
    return obj.length > 0 ? flattenKeys(obj[0], prefix) : [];
  }

  if (typeof obj === "object") {
    return Object.entries(obj).flatMap(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      return [fullKey, ...flattenKeys(value, fullKey)];
    });
  }

  // Primitive — no children to recurse into
  return [];
};

// const onNodeDoubleClick = useCallback((event, node) => {
//   setEditingNode(node);           // remember which node we're editing
//   setFormData({
//     id: node.data.id,
//     name: node.data.label,
//     requestDto: JSON.stringify(node.data?.dtos?.request, null, 2),  // pretty printed
//     responseDto: JSON.stringify(node.data?.dtos?.response, null, 2),
//   });
//   setShowModal(true);
// }, []);

// ─────────────────────────────────────────────────────────────────────────────
// MappingEdge — defined OUTSIDE Whiteboard so React never remounts it.
// Defining it inside causes a new component identity every render → dropdowns reset.
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

  // dtos are stored as parsed objects — flattenKeys works directly on them
  const requestDto = targetNode?.data?.dtos?.request;
  const responseDto = sourceNode?.data?.dtos?.response;

  // Parse if somehow still a string (defensive)
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
          {/* Column headers */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 24px 1fr 28px",
              gap: "6px",
              alignItems: "center",
              marginBottom: "6px",
            }}
          >
            
<span style={{ fontSize: "10px", color: "#888", fontWeight: 700, textTransform: "uppercase" , textAlign: "center" }}>
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
          </div>

          {/* Mapping rows */}
          {mappingRows.map((row) => (
            <div
              key={row.id}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 24px 1fr 28px",
                gap: "6px",
                alignItems: "center",
                marginBottom: "5px",
              }}
            >
              <select
                value={row.requestKey || ""}
                onChange={(e) =>
                  handleRowChange(row.id, "requestKey", e.target.value)
                }
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ padding: "4px", width: "100%", fontSize: "12px" }}
              >
                <option value="">Select key</option>
                {requestKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>

              <span style={{ textAlign: "center", color: "#aaa" }}>→</span>

              <select
                value={row.responseKey || ""}
                onChange={(e) =>
                  handleRowChange(row.id, "responseKey", e.target.value)
                }
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                style={{ padding: "4px", width: "100%", fontSize: "12px" }}
              >
                <option value="">Select key</option>
                {responseKeys.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>

              {mappingRows.length > 1 ? (
                <button
                  onClick={(e) => handleRemoveRow(e, row.id)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    width: "22px",
                    height: "22px",
                    padding: 0,
                    fontSize: "14px",
                    lineHeight: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    background: "#fff",
                    color: "#e55",
                  }}
                  title="Remove row"
                >
                  ×
                </button>
              ) : (
                <span style={{ width: "22px" }} />
              )}
            </div>
          ))}

          {/* Add row */}
          <button
            onClick={handleAddRow}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              marginTop: "4px",
              padding: "3px 10px",
              fontSize: "12px",
              cursor: "pointer",
              border: "1px dashed #bbb",
              borderRadius: "4px",
              background: "#fafafa",
              color: "#555",
              width: "100%",
            }}
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
            data: {
              ...e.data,
              mappingRows: [...(e.data?.mappingRows || []), newRow],
            },
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
              mappingRows: (e.data?.mappingRows || []).filter(
                (r) => r.id !== rowId
              ),
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
    alert("Flow saved successfully");
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

  useEffect(() => {
    if (!id) return;
    const savedFlows = JSON.parse(localStorage.getItem("flows")) || [];
    const existingFlow = savedFlows.find((flow) => flow.id === id);
    if (existingFlow) {
      setNodes(existingFlow.nodes || []);
      setEdges(existingFlow.edges || []);
    }
  }, [id, setNodes, setEdges]);

  // ── Detect DevTools localStorage edits (same tab) ── ← ADD THIS RIGHT HERE
  // useEffect(() => {
  //   if (!id) return;

  //   let snapshot = JSON.stringify(
  //     JSON.parse(localStorage.getItem("flows") || "[]").find((f) => f.id === id)?.nodes || []
  //   );

  //   const interval = setInterval(() => {
  //     const current = JSON.stringify(
  //       JSON.parse(localStorage.getItem("flows") || "[]").find((f) => f.id === id)?.nodes || []
  //     );

  //     if (current !== snapshot) {
  //       alert("⚠️ localStorage has been edited directly!");
  //       snapshot = current; // update so alert doesn't repeat
  //     }
  //   }, 2000);

  //   return () => clearInterval(interval);
  // }, [id]);


  const handleCreateNode = () => {
    if (!formData.id || !formData.name) {
      alert("ID and Name are required");
      return;
    }
    let parsedRequest, parsedResponse;
    try {
      parsedRequest = formData.requestDto
        ? JSON.parse(formData.requestDto)
        : {};
      parsedResponse = formData.responseDto
        ? JSON.parse(formData.responseDto)
        : {};
    } catch {
      alert("DTOs must be valid JSON format");
      return;
    }

    // ✅ Store dtos as parsed objects, NOT strings
    setSidebarNodes((prev) => [
      ...prev,
      {
        id: formData.id,
        label: formData.name,
        dtos: {
          request: parsedRequest,
          response: parsedResponse,
        },
      },
    ]);

    setFormData({ id: "", name: "", requestDto: "", responseDto: "" });
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
            style={{
              padding: "8px",
              margin: "4px 0",
              background: "white",
              border: "1px solid #999",
              borderRadius: "4px",
              cursor: "grab",
              fontSize: "13px",
            }}
          >
            {node.label}
          </div>
        ))}

        <button
          onClick={() => setShowModal(true)}
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
          // onNodeDoubleClick={onNodeDoubleClick}
          fitView
        >
          <Controls position="bottom-right" />
          <Background variant="dots" gap={20} size={1} />
        </ReactFlow>
      </div>

      {/* CREATE NODE MODAL */}
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
            <h3 style={{ margin: 0 }}>Create Node</h3>
            <input
              placeholder="ID"
              value={formData.id}
              onChange={(e) =>
                setFormData({ ...formData, id: e.target.value })
              }
              style={{
                width: "100%",
                padding: "6px",
                boxSizing: "border-box",
              }}
            />
            <input
              placeholder="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              style={{
                width: "100%",
                padding: "6px",
                boxSizing: "border-box",
              }}
            />
            <textarea
              placeholder={'Request DTO  e.g. {"userId": "", "amount": ""}'}
              value={formData.requestDto}
              onChange={(e) =>
                setFormData({ ...formData, requestDto: e.target.value })
              }
              rows={4}
              style={{
                width: "100%",
                padding: "6px",
                boxSizing: "border-box",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            />
            <textarea
              placeholder={'Response DTO  e.g. {"status": "", "txnId": ""}'}
              value={formData.responseDto}
              onChange={(e) =>
                setFormData({ ...formData, responseDto: e.target.value })
              }
              rows={4}
              style={{
                width: "100%",
                padding: "6px",
                boxSizing: "border-box",
                fontFamily: "monospace",
                fontSize: "12px",
              }}
            />
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button onClick={() => setShowModal(false)}>Cancel</button>
              <button onClick={handleCreateNode}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}