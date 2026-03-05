import { v4 as uuidv4 } from "uuid";
import { flowDb } from "../services/db";

export async function getFlows() {
  return flowDb.getAll();
}

export async function getFlowById(flowId) {
  return flowDb.getById(flowId);
}

export async function createFlow({ name }) {
  const flow = {
    id: uuidv4(),
    name: name?.trim() || "Untitled Flow",
    nodes: [],
    edges: [],
    lastResults: null,
    lastRunAt: null,
  };

  return flowDb.save(flow);
}

export async function upsertFlow(updatedFlow) {
  return flowDb.save(updatedFlow);
}

export async function deleteFlow(flowId) {
  return flowDb.delete(flowId);
}
