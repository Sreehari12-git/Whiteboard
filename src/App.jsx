import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import AppShell from "./components/AppShell";
import ApiTestingDashboard from "./pages/api-testing/ApiTestingDashboard";
import ApiTestingWorkspace from "./pages/api-testing/ApiTestingWorkspace";
import ApiTestingReport from "./pages/api-testing/ApiTestingReport";
import E2ETesting from "./pages/E2ETesting";
import E2EWorkspace from "./pages/e2e-testing/E2EWorkspace";
import E2EReport from "./pages/e2e-testing/E2EReport";
import Whiteboard from "./pages/Whiteboard";
import WhiteboardsDashboard from "./pages/WhiteboardsDashboard";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Navigate to="/api-testing" replace />} />
          <Route path="/api-testing" element={<ApiTestingDashboard />} />
          <Route path="/api-testing/:apiId" element={<ApiTestingWorkspace />} />
          <Route path="/api-testing/:apiId/report" element={<ApiTestingReport />} />
          <Route path="/e2e-testing" element={<E2ETesting />} />
          <Route path="/e2e-testing/:flowId" element={<E2EWorkspace />} />
          <Route path="/e2e-testing/:flowId/report" element={<E2EReport />} />
        </Route>

        {/* Keep existing whiteboard feature reachable */}
        <Route path="/whiteboards" element={<WhiteboardsDashboard />} />
        <Route path="/whiteboard/:id" element={<Whiteboard />} />
      </Routes>
    </Router>
  );
}
