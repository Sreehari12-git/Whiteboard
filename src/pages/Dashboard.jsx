// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { v4 as uuidv4 } from "uuid";

// const STORAGE_KEY = "flows";

// export default function Dashboard() {
//   const navigate = useNavigate();
//   const [flows, setFlows] = React.useState([]);

//   React.useEffect(() => {
//     const saved = localStorage.getItem(STORAGE_KEY);
//     if (saved) setFlows(JSON.parse(saved));
//   }, []);

//   const handleCreateFlow = () => {
//     const newFlow = {
//       id: uuidv4(),
//     //   name: `Flow ${flows.length + 1}`,
//       createdAt: new Date().toLocaleString(),
//       nodes: [],
//       edges: [],
//     };

//     const updated = [...flows, newFlow];
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
//     setFlows(updated);

//     navigate(`/whiteboard/${newFlow.id}`);
//   };

//   return (
//     <div className="min-h-screen bg-gray-100 p-8">
//       <div className="flex justify-between items-center mb-8">
//         <h1 className="text-3xl font-bold">Dashboard</h1>
//         <button
//           onClick={handleCreateFlow}
//           className="bg-blue-600 text-white px-6 py-2 rounded-xl"
//         >
//           Create New Flow
//         </button>
//       </div>

//       <div className="grid grid-cols-3 gap-6">
//         {flows.map((flow) => (
//           <div
//             key={flow.id}
//             onClick={() => navigate(`/whiteboard/${flow.id}`)}
//             className="bg-white p-6 rounded-xl shadow cursor-pointer"
//           >
//             <h2 className="font-semibold">{flow.name}</h2>
//             <p className="text-sm text-gray-500">{flow.createdAt}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }


// import React from "react";
// import { useNavigate } from "react-router-dom";
// import { v4 as uuidv4 } from "uuid";

// const STORAGE_KEY = "flows";

// function CanvasPreview({ nodes = [], edges = [] }) {
//   const W = 280;
//   const H = 160;
//   const PAD = 24;

//   if (nodes.length === 0) {
//     return (
//       <div
//         style={{
//           width: W,
//           height: H,
//           background: "#f8f9fb",
//           borderRadius: 10,
//           display: "flex",
//           alignItems: "center",
//           justifyContent: "center",
//           border: "1.5px dashed #d1d5db",
//         }}
//       >
//         <span style={{ color: "#b0b7c3", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
//           Empty canvas
//         </span>
//       </div>
//     );
//   }

//   // Normalize node positions to fit preview
//   const xs = nodes.map((n) => n.position?.x ?? 0);
//   const ys = nodes.map((n) => n.position?.y ?? 0);
//   const minX = Math.min(...xs);
//   const minY = Math.min(...ys);
//   const maxX = Math.max(...xs) + 120;
//   const maxY = Math.max(...ys) + 40;
//   const scaleX = (W - PAD * 2) / Math.max(maxX - minX, 1);
//   const scaleY = (H - PAD * 2) / Math.max(maxY - minY, 1);
//   const scale = Math.min(scaleX, scaleY, 1);

//   const tx = (x) => PAD + (x - minX) * scale;
//   const ty = (y) => PAD + (y - minY) * scale;

//   // Build node center map for edges
//   const nodeMap = {};
//   nodes.forEach((n) => {
//     nodeMap[n.id] = {
//       cx: tx((n.position?.x ?? 0) + 60),
//       cy: ty((n.position?.y ?? 0) + 20),
//     };
//   });

//   const NODE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

//   return (
//     <svg
//       width={W}
//       height={H}
//       style={{
//         borderRadius: 10,
//         background: "linear-gradient(135deg, #f8f9fb 0%, #eef0f5 100%)",
//         border: "1.5px solid #e2e6ef",
//         display: "block",
//       }}
//     >
//       {/* Grid dots */}
//       <defs>
//         <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
//           <circle cx="1" cy="1" r="1" fill="#d1d5e0" />
//         </pattern>
//       </defs>
//       <rect width={W} height={H} fill="url(#dots)" rx={10} />

//       {/* Edges */}
//       {edges.map((e, i) => {
//         const src = nodeMap[e.source];
//         const tgt = nodeMap[e.target];
//         if (!src || !tgt) return null;
//         return (
//           <line
//             key={i}
//             x1={src.cx}
//             y1={src.cy}
//             x2={tgt.cx}
//             y2={tgt.cy}
//             stroke="#a5b4fc"
//             strokeWidth={1.5}
//             strokeDasharray="4 2"
//             opacity={0.7}
//           />
//         );
//       })}

//       {/* Nodes */}
//       {nodes.map((n, i) => {
//         const x = tx(n.position?.x ?? 0);
//         const y = ty(n.position?.y ?? 0);
//         const w = 52 * scale + 16;
//         const h = 20 * scale + 10;
//         const color = NODE_COLORS[i % NODE_COLORS.length];
//         const label = n.data?.label ?? "";

//         return (
//           <g key={n.id}>
//             <rect
//               x={x}
//               y={y}
//               width={Math.max(w, 28)}
//               height={Math.max(h, 14)}
//               rx={5}
//               fill={color}
//               fillOpacity={0.15}
//               stroke={color}
//               strokeWidth={1.5}
//             />
//             {label && (
//               <text
//                 x={x + Math.max(w, 28) / 2}
//                 y={y + Math.max(h, 14) / 2 + 4}
//                 textAnchor="middle"
//                 fontSize={Math.max(8, 10 * scale)}
//                 fill={color}
//                 fontFamily="'DM Sans', sans-serif"
//                 fontWeight="600"
//               >
//                 {label.length > 10 ? label.slice(0, 10) + "…" : label}
//               </text>
//             )}
//           </g>
//         );
//       })}
//     </svg>
//   );
// }

// export default function Dashboard() {
//   const navigate = useNavigate();
//   const [flows, setFlows] = React.useState([]);
//   const [hoveredId, setHoveredId] = React.useState(null);

//   React.useEffect(() => {
//     const saved = localStorage.getItem(STORAGE_KEY);
//     if (saved) setFlows(JSON.parse(saved));
//   }, []);

//   const handleCreateFlow = () => {
//     const newFlow = {
//       id: uuidv4(),
//       name: `Untitled Flow`,
//       createdAt: new Date().toLocaleString(),
//       nodes: [],
//       edges: [],
//     };
//     const updated = [...flows, newFlow];
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
//     setFlows(updated);
//     navigate(`/whiteboard/${newFlow.id}`);
//   };

//   const handleDelete = (e, id) => {
//     e.stopPropagation();
//     const updated = flows.filter((f) => f.id !== id);
//     localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
//     setFlows(updated);
//   };

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         background: "#f0f2f7",
//         fontFamily: "'DM Sans', sans-serif",
//         padding: "40px 48px",
//       }}
//     >
//       {/* Google font */}
//       <link
//         href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap"
//         rel="stylesheet"
//       />

//       {/* Header */}
//       <div
//         style={{
//           display: "flex",
//           justifyContent: "space-between",
//           alignItems: "center",
//           marginBottom: 40,
//         }}
//       >
//         <div>
//           <h1
//             style={{
//               fontSize: 28,
//               fontWeight: 700,
//               color: "#1a1d27",
//               margin: 0,
//               letterSpacing: "-0.5px",
//             }}
//           >
//             My Whiteboards
//           </h1>
//           <p style={{ margin: "4px 0 0", color: "#8a91a8", fontSize: 14 }}>
//             {flows.length} canvas{flows.length !== 1 ? "es" : ""} saved
//           </p>
//         </div>

//         <button
//           onClick={handleCreateFlow}
//           style={{
//             background: "#4f46e5",
//             color: "#fff",
//             border: "none",
//             borderRadius: 10,
//             padding: "10px 22px",
//             fontSize: 14,
//             fontWeight: 600,
//             cursor: "pointer",
//             display: "flex",
//             alignItems: "center",
//             gap: 8,
//             boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
//             transition: "transform 0.15s, box-shadow 0.15s",
//             fontFamily: "'DM Sans', sans-serif",
//           }}
//           onMouseEnter={(e) => {
//             e.currentTarget.style.transform = "translateY(-1px)";
//             e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.45)";
//           }}
//           onMouseLeave={(e) => {
//             e.currentTarget.style.transform = "translateY(0)";
//             e.currentTarget.style.boxShadow = "0 4px 14px rgba(79,70,229,0.35)";
//           }}
//         >
//           <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Whiteboard
//         </button>
//       </div>

//       {/* Empty state */}
//       {flows.length === 0 && (
//         <div
//           style={{
//             textAlign: "center",
//             marginTop: 100,
//             color: "#8a91a8",
//           }}
//         >
//           <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
//           <p style={{ fontSize: 16, fontWeight: 500 }}>No whiteboards yet</p>
//           <p style={{ fontSize: 14, marginTop: 4 }}>
//             Click <strong>+ New Whiteboard</strong> to get started
//           </p>
//         </div>
//       )}

//       {/* Grid */}
//       <div
//         style={{
//           display: "grid",
//           gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
//           gap: 24,
//         }}
//       >
//         {flows.map((flow) => {
//           const isHovered = hoveredId === flow.id;
//           return (
//             <div
//               key={flow.id}
//               onClick={() => navigate(`/whiteboard/${flow.id}`)}
//               onMouseEnter={() => setHoveredId(flow.id)}
//               onMouseLeave={() => setHoveredId(null)}
//               style={{
//                 background: "#fff",
//                 borderRadius: 14,
//                 overflow: "hidden",
//                 cursor: "pointer",
//                 boxShadow: isHovered
//                   ? "0 8px 32px rgba(79,70,229,0.14), 0 2px 8px rgba(0,0,0,0.06)"
//                   : "0 2px 10px rgba(0,0,0,0.06)",
//                 transform: isHovered ? "translateY(-3px)" : "translateY(0)",
//                 transition: "box-shadow 0.2s, transform 0.2s",
//                 border: "1.5px solid",
//                 borderColor: isHovered ? "#c7d2fe" : "#e8eaf0",
//                 position: "relative",
//               }}
//             >
//               {/* Canvas preview */}
//               <div
//                 style={{
//                   padding: 16,
//                   background: "#f8f9fb",
//                   borderBottom: "1px solid #eef0f5",
//                 }}
//               >
//                 <CanvasPreview nodes={flow.nodes} edges={flow.edges} />
//               </div>

//               {/* Footer info */}
//               <div
//                 style={{
//                   padding: "14px 18px",
//                   display: "flex",
//                   alignItems: "center",
//                   justifyContent: "space-between",
//                 }}
//               >
//                 <div>
//                   <div
//                     style={{
//                       fontWeight: 600,
//                       fontSize: 14,
//                       color: "#1a1d27",
//                       marginBottom: 2,
//                     }}
//                   >
//                     {flow.name || `Flow ${flow.id.slice(0, 6)}`}
//                   </div>
//                   <div style={{ fontSize: 12, color: "#8a91a8" }}>
//                     {flow.nodes?.length ?? 0} nodes · {flow.createdAt}
//                   </div>
//                 </div>

//                 {/* Delete button */}
//                 <button
//                   onClick={(e) => handleDelete(e, flow.id)}
//                   title="Delete"
//                   style={{
//                     background: "none",
//                     border: "none",
//                     cursor: "pointer",
//                     color: "#c4c9d6",
//                     fontSize: 16,
//                     padding: "4px 6px",
//                     borderRadius: 6,
//                     transition: "color 0.15s, background 0.15s",
//                     lineHeight: 1,
//                     fontFamily: "'DM Sans', sans-serif",
//                   }}
//                   onMouseEnter={(e) => {
//                     e.currentTarget.style.color = "#ef4444";
//                     e.currentTarget.style.background = "#fef2f2";
//                   }}
//                   onMouseLeave={(e) => {
//                     e.currentTarget.style.color = "#c4c9d6";
//                     e.currentTarget.style.background = "none";
//                   }}
//                 >
//                   🗑
//                 </button>
//               </div>
//             </div>
//           );
//         })}
//       </div>
//     </div>
//   );
// }

import React from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "flows";

function CanvasPreview({ nodes = [], edges = [] }) {
  const W = 280;
  const H = 160;
  const PAD = 24;

  if (nodes.length === 0) {
    return (
      <div
        style={{
          width: W,
          height: H,
          background: "#f8f9fb",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          border: "1.5px dashed #d1d5db",
        }}
      >
        <span style={{ color: "#b0b7c3", fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>
          Empty canvas
        </span>
      </div>
    );
  }

  // Normalize node positions to fit preview
  const xs = nodes.map((n) => n.position?.x ?? 0);
  const ys = nodes.map((n) => n.position?.y ?? 0);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs) + 120;
  const maxY = Math.max(...ys) + 40;
  const scaleX = (W - PAD * 2) / Math.max(maxX - minX, 1);
  const scaleY = (H - PAD * 2) / Math.max(maxY - minY, 1);
  const scale = Math.min(scaleX, scaleY, 1);

  const tx = (x) => PAD + (x - minX) * scale;
  const ty = (y) => PAD + (y - minY) * scale;

  // Build node center map for edges
  const nodeMap = {};
  nodes.forEach((n) => {
    nodeMap[n.id] = {
      cx: tx((n.position?.x ?? 0) + 60),
      cy: ty((n.position?.y ?? 0) + 20),
    };
  });

  const NODE_COLORS = ["#6366f1", "#10b981", "#f59e0b", "#ef4444", "#3b82f6", "#8b5cf6"];

  return (
    <svg
      width={W}
      height={H}
      style={{
        borderRadius: 10,
        background: "linear-gradient(135deg, #f8f9fb 0%, #eef0f5 100%)",
        border: "1.5px solid #e2e6ef",
        display: "block",
      }}
    >
      {/* Grid dots */}
      <defs>
        <pattern id="dots" x="0" y="0" width="14" height="14" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="1" fill="#d1d5e0" />
        </pattern>
      </defs>
      <rect width={W} height={H} fill="url(#dots)" rx={10} />

      {/* Edges */}
      {edges.map((e, i) => {
        const src = nodeMap[e.source];
        const tgt = nodeMap[e.target];
        if (!src || !tgt) return null;
        return (
          <line
            key={i}
            x1={src.cx}
            y1={src.cy}
            x2={tgt.cx}
            y2={tgt.cy}
            stroke="#a5b4fc"
            strokeWidth={1.5}
            strokeDasharray="4 2"
            opacity={0.7}
          />
        );
      })}

      {/* Nodes */}
      {nodes.map((n, i) => {
        const x = tx(n.position?.x ?? 0);
        const y = ty(n.position?.y ?? 0);
        const w = 52 * scale + 16;
        const h = 20 * scale + 10;
        const color = NODE_COLORS[i % NODE_COLORS.length];
        const label = n.data?.label ?? "";

        return (
          <g key={n.id}>
            <rect
              x={x}
              y={y}
              width={Math.max(w, 28)}
              height={Math.max(h, 14)}
              rx={5}
              fill={color}
              fillOpacity={0.15}
              stroke={color}
              strokeWidth={1.5}
            />
            {label && (
              <text
                x={x + Math.max(w, 28) / 2}
                y={y + Math.max(h, 14) / 2 + 4}
                textAnchor="middle"
                fontSize={Math.max(8, 10 * scale)}
                fill={color}
                fontFamily="'DM Sans', sans-serif"
                fontWeight="600"
              >
                {label.length > 10 ? label.slice(0, 10) + "…" : label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [flows, setFlows] = React.useState([]);
  const [hoveredId, setHoveredId] = React.useState(null);
  const [showModal, setShowModal] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const inputRef = React.useRef(null);

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setFlows(JSON.parse(saved));
  }, []);

  const openModal = () => {
    setNewName("");
    setShowModal(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleCreateFlow = () => {
    const name = newName.trim() || "Untitled Flow";
    const newFlow = {
      id: uuidv4(),
      name,
      createdAt: new Date().toLocaleString(),
      nodes: [],
      edges: [],
    };
    const updated = [...flows, newFlow];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setFlows(updated);
    setShowModal(false);
    navigate(`/whiteboard/${newFlow.id}`);
  };

  const handleModalKeyDown = (e) => {
    if (e.key === "Enter") handleCreateFlow();
    if (e.key === "Escape") setShowModal(false);
  };

  const handleDelete = (e, id) => {
    e.stopPropagation();
    const updated = flows.filter((f) => f.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setFlows(updated);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f2f7",
        fontFamily: "'DM Sans', sans-serif",
        padding: "40px 48px",
      }}
    >
      {/* Google font */}
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@500&display=swap"
        rel="stylesheet"
      />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 40,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: "#1a1d27",
              margin: 0,
              letterSpacing: "-0.5px",
            }}
          >
            My Whiteboards
          </h1>
          <p style={{ margin: "4px 0 0", color: "#8a91a8", fontSize: 14 }}>
            {flows.length} canvas{flows.length !== 1 ? "es" : ""} saved
          </p>
        </div>

        <button
          onClick={openModal}
          style={{
            background: "#4f46e5",
            color: "#fff",
            border: "none",
            borderRadius: 10,
            padding: "10px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 8,
            boxShadow: "0 4px 14px rgba(79,70,229,0.35)",
            transition: "transform 0.15s, box-shadow 0.15s",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-1px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(79,70,229,0.45)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 14px rgba(79,70,229,0.35)";
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>+</span> New Whiteboard
        </button>
      </div>

      {/* Empty state */}
      {flows.length === 0 && (
        <div
          style={{
            textAlign: "center",
            marginTop: 100,
            color: "#8a91a8",
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
          <p style={{ fontSize: 16, fontWeight: 500 }}>No whiteboards yet</p>
          <p style={{ fontSize: 14, marginTop: 4 }}>
            Click <strong>+ New Whiteboard</strong> to get started
          </p>
        </div>
      )}

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 24,
        }}
      >
        {flows.map((flow) => {
          const isHovered = hoveredId === flow.id;
          return (
            <div
              key={flow.id}
              onClick={() => navigate(`/whiteboard/${flow.id}`)}
              onMouseEnter={() => setHoveredId(flow.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: "#fff",
                borderRadius: 14,
                overflow: "hidden",
                cursor: "pointer",
                boxShadow: isHovered
                  ? "0 8px 32px rgba(79,70,229,0.14), 0 2px 8px rgba(0,0,0,0.06)"
                  : "0 2px 10px rgba(0,0,0,0.06)",
                transform: isHovered ? "translateY(-3px)" : "translateY(0)",
                transition: "box-shadow 0.2s, transform 0.2s",
                border: "1.5px solid",
                borderColor: isHovered ? "#c7d2fe" : "#e8eaf0",
                position: "relative",
              }}
            >
              {/* Canvas preview */}
              <div
                style={{
                  padding: 16,
                  background: "#f8f9fb",
                  borderBottom: "1px solid #eef0f5",
                }}
              >
                <CanvasPreview nodes={flow.nodes} edges={flow.edges} />
              </div>

              {/* Footer info */}
              <div
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      color: "#1a1d27",
                      marginBottom: 2,
                    }}
                  >
                    {flow.name || `Flow ${flow.id.slice(0, 6)}`}
                  </div>
                  <div style={{ fontSize: 12, color: "#8a91a8" }}>
                    {flow.nodes?.length ?? 0} nodes · {flow.createdAt}
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDelete(e, flow.id)}
                  title="Delete"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "#c4c9d6",
                    fontSize: 16,
                    padding: "4px 6px",
                    borderRadius: 6,
                    transition: "color 0.15s, background 0.15s",
                    lineHeight: 1,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                    e.currentTarget.style.background = "#fef2f2";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#c4c9d6";
                    e.currentTarget.style.background = "none";
                  }}
                >
                  🗑
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {/* Create Flow Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(15,17,26,0.45)",
            backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleModalKeyDown}
            style={{
              background: "#fff",
              borderRadius: 16,
              padding: "32px 28px",
              width: 380,
              boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            }}
          >
            <h2 style={{ margin: "0 0 6px", fontSize: 18, fontWeight: 700, color: "#1a1d27", fontFamily: "'DM Sans', sans-serif" }}>
              Name your whiteboard
            </h2>
            <p style={{ margin: "0 0 20px", fontSize: 13, color: "#8a91a8", fontFamily: "'DM Sans', sans-serif" }}>
              You can rename it later from the canvas.
            </p>
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. User Auth Flow"
              style={{
                width: "100%",
                boxSizing: "border-box",
                padding: "10px 14px",
                fontSize: 14,
                fontFamily: "'DM Sans', sans-serif",
                border: "1.5px solid #d1d5db",
                borderRadius: 8,
                outline: "none",
                color: "#1a1d27",
                marginBottom: 20,
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#6366f1")}
              onBlur={(e) => (e.target.style.borderColor = "#d1d5db")}
            />
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e6ef",
                  background: "#fff", color: "#6b7280", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateFlow}
                style={{
                  padding: "9px 20px", borderRadius: 8, border: "none",
                  background: "#4f46e5", color: "#fff", fontSize: 14, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  boxShadow: "0 4px 12px rgba(79,70,229,0.3)",
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}