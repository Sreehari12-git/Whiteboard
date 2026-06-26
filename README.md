# Whiteboard & API / E2E Testing Suite

A modern, visual development suite built with React and Vite. It combines interactive canvas workspaces with powerful API testing and E2E automation tools.

## 🚀 Features

### 1. 🎨 Visual Whiteboard DTO Mapper
* **Interactive Canvas**: Powered by `reactflow` to create and connect nodes representing systems, API endpoints, or services.
* **DTO Mapping**: Define request and response schemas, connect outputs to inputs, and configure fields visually.
* **Persistent Layouts**: Save and restore whiteboard designs.

### 2. ⚡ API Testing Dashboard & Workspace
* **Custom Payloads**: Maintain multiple request configurations and bodies for each endpoint.
* **Interactive Tester**: Send live HTTP requests directly from the interface.
* **Detailed Reports**: Generate comprehensive pass/fail test reports with status codes, payload data, and response metrics.

### 3. 🔄 E2E Flow Designer
* **Sequential Execution**: Run multiple API steps in sequence with configurable delays between requests.
* **Progress Tracking**: Real-time progress visualizers showing step status.
* **Execution Metrics**: Capture end-to-end performance and error tracking per flow run.

---

## 🛠️ Tech Stack

* **Framework**: [React 19](https://react.dev)
* **Build Tool**: [Vite](https://vite.dev)
* **Visual Canvas**: [React Flow 11](https://reactflow.dev)
* **Routing**: [React Router Dom 7](https://reactrouter.com)
* **State & Persistence**: Session/Local Storage with a generic database-like interface (`src/services/db.js`)

---

## 💻 Getting Started

### Prerequisites
Make sure you have Node.js installed.

### Installation
1. Clone the repository
2. Install the package dependencies:
   ```bash
   npm install
   ```

### Development Server
Run the project locally:
```bash
npm run dev
```

### Production Build
Compile a production bundle:
```bash
npm run build
```
The output files will be built in the `/dist` directory.
