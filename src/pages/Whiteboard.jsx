import React, { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import ReactFlow, {
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";

export default function Whiteboard() {
  const initialNodes = [];
  const initialEdges = [];

  const [sidebarNodes, setSidebarNodes] = React.useState([
  "a1",
  "a2",
  "a3",
  "a4",
  "a5",
]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Allow dropping
  const onDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  // Handle drop on canvas
const onDrop = (event) => {
  event.preventDefault();

  const label = event.dataTransfer.getData("application/reactflow");
  if (!label) return;

  const position = {
    x: event.clientX - 220,
    y: event.clientY - 50,
  };

  const newNodeId = uuidv4();

  const newNode = {
    id: newNodeId,
    position,
    data: { label },
    type: "default",
  };

  setNodes((prevNodes) => {
    // If this is the first node, just add it
    if (prevNodes.length === 0) {
      return [...prevNodes, newNode];
    }

    const lastNode = prevNodes[prevNodes.length - 1];

    // Create edge from last node → new node
    const newEdge = {
      id: uuidv4(),
      source: lastNode.id,
      target: newNodeId,
      type: "default",
    };

    // Add edge
    setEdges((prevEdges) => [...prevEdges, newEdge]);

    return [...prevNodes, newNode];
  });
};

const addNode = () => {
  const nextNumber =
    sidebarNodes.length === 0
      ? 1
      : Math.max(
          ...sidebarNodes.map((label) =>
            parseInt(label.replace("a", ""))
          )
        ) + 1;

  const newLabel = `a${nextNumber}`;

  setSidebarNodes((prev) => [...prev, newLabel]);
};
    //Return when save button is clicked
    const handlesave = () => {
        //Reads data stored under the key "flows". Returns string if data exists else null. It stores object by coverting from string
        const savedFlows = JSON.parse(localStorage.getItem("flows")) || [];
        //loops through each flow
        const updateFlows = savedFlows.map((flow) => 
            //checking if id stored stored in localstorage and id from URL are matching
            flow.id === id
            ? {...flow, nodes, edges}
            : flow
        );
        localStorage.setItem("flows", JSON.stringify(updatedFlows));
        alert("Flow saved successfully");
    }


    //To navigate to a particular page 
    const navigate = useNavigate();

    const { id } = useParams();

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      
      {/* LEFT PANEL */}
      <div
        style={{
          width: "200px",
          background: "#f4f4f4",
          padding: "10px",
          borderRight: "1px solid #ddd",
        }}
      >
        <button onClick={() => navigate("/")}>Back</button>
        <h3>Nodes</h3>
        {sidebarNodes.map((label) => (
          <div
            key={label}
            draggable
            onDragStart={(event) =>
              event.dataTransfer.setData("application/reactflow", label)
            }
            style={{
              padding: "8px",
              margin: "8px 0",
              background: "white",
              border: "1px solid #999",
              cursor: "grab",
            }}
          >
            {label}
          </div>
        ))}
        <button onClick={addNode} style={{marginTop : "20px", padding: "8px 12px", width: "100%"}}>Create node</button>
      </div>

      {/* RIGHT CANVAS */}
      <div style={{ flexGrow: 1, position: "relative"}}>
        <button onClick={handlesave} style={{
      position: "absolute",
      top: 10,
      right: 10,
      zIndex: 10,
      padding: "8px 14px",
      background: "grey",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
    }}>Save</button>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDrop={onDrop}
          onDragOver={onDragOver}
          fitView
        >
          <Controls position="bottom-right" />
          <Background variant="dots" gap={20} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}