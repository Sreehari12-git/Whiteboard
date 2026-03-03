import React from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

const STORAGE_KEY = "flows";

export default function Dashboard() {
  const navigate = useNavigate();
  const [flows, setFlows] = React.useState([]);

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) setFlows(JSON.parse(saved));
  }, []);

  const handleCreateFlow = () => {
    const newFlow = {
      id: uuidv4(),
      name: `Flow ${flows.length + 1}`,
      createdAt: new Date().toLocaleString(),
      nodes: [],
      edges: [],
    };

    const updated = [...flows, newFlow];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    setFlows(updated);

    navigate(`/whiteboard/${newFlow.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <button
          onClick={handleCreateFlow}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl"
        >
          Create New Flow
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {flows.map((flow) => (
          <div
            key={flow.id}
            onClick={() => navigate(`/whiteboard/${flow.id}`)}
            className="bg-white p-6 rounded-xl shadow cursor-pointer"
          >
            <h2 className="font-semibold">{flow.name}</h2>
            <p className="text-sm text-gray-500">{flow.createdAt}</p>
          </div>
        ))}
      </div>
    </div>
  );
}