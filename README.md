# CodeForge: Real-Time Collaborative Code Judge

CodeForge is a high-performance, full-stack real-time collaborative coding workspace and isolated online code judge. Built using React, Node.js, WebSockets, MongoDB, Redis, and Docker, CodeForge replicates the core collaborative experience of Google Docs combined with the secure, robust code execution capabilities of platforms like LeetCode and HackerRank, enriched with a gamified developer dashboard and streak tracker.

---

## 🚀 Key Features

- **Real-Time Collaboration**: Collaborative code editor using Monaco Editor, supporting concurrent document editing, live cursor tracking, and active participant presence indicators.
- **Isolated Code Judge Sandbox**: Code execution engine that evaluates user submissions (Python, JavaScript, C++, Java) inside secure, CPU-and-memory-constrained, network-isolated Docker containers using `dockerode`.
- **Custom Test Case Evaluator**: Support for running standard tests and hidden evaluation test cases, reporting exact execution times, memory usage, and runtime/compilation outputs.
- **Profile Gamification & Streak Engine**: Dynamic calculations for daily coding streaks, longest streak records, category-wise problem stats (Easy, Medium, Hard), and activity logs.
- **Room-Based Workspaces**: Multi-user room creation and joining with dynamic host controls, access restrictions, and persistent workspace configurations.
- **Interactive Chat System**: Integrated real-time room chat with markdown support for developers to communicate alongside the code workspace.
- **Personal Analytics Dashboard**: Visual charts powered by Recharts detailing historical submission status percentages, execution speeds, language preferences, and success rates, alongside a GitHub-style activity heat map.
- **Robust Security**: Rate-limiting, secure JWT authentication with HttpOnly cookies, request validation (Joi), API security headers (Helmet), and container resource quotas to block fork bombs and network access.

---

## 🛠 Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS, Monaco Editor, Zustand, Recharts, React Router Dom | High-fidelity UI with real-time reactive updates and rich charts |
| **Backend** | Node.js, Express, WebSocket (`ws`), Dockerode, Helmet, Joi | Fast APIs and WebSocket communication server with safety validation |
| **Databases** | MongoDB (via Mongoose), Redis (via ioredis) | Schema-based document storage and low-latency session/cache sync |
| **Execution** | Docker (Alpine images per language) | Isolated execution boundaries for untrusted user code |

---

## 📐 System Architecture

The following diagram details the interaction flow between the client, backend, database servers, and Docker container daemon:

```mermaid
sequenceDiagram
    autonumber
    actor Client as Developers (Browser)
    participant Server as Express & WebSocket Server
    database DB as MongoDB / Redis
    participant Docker as Docker Container Daemon

    Client->>Server: Establish WebSocket Connection & Join Room
    Server->>DB: Fetch Room State & Active Users
    DB-->>Server: Room Details & Last Code State
    Server-->>Client: Join Confirmed (Syncs Editor Content & Cursor Locations)
    
    Note over Client, Server: Real-time code synchronization & live cursors actively broadcast

    Client->>Server: Submit Code for Problem (REST POST)
    Server->>DB: Fetch Problem Details (Hidden Test Cases)
    Server->>Docker: Spawn isolated container with memory/CPU limits & mounted code
    Docker->>Docker: Execute script against stdin test cases
    Docker-->>Server: Return stdout, stderr, execution time & exit code
    Server->>Docker: Destroy & Clean up container instances
    Server->>Server: Grade output against expected outputs
    Server->>DB: Persist submission & dynamically recalculate user streaks/solvedStats/activityLog
    Server-->>Client: Return grading verdict (Accepted / WA / TLE / RE / CE) and updated stats
```

---

## 📂 Project Structure

The repository is divided into two primary subdirectories:

- 💻 **[Client Directory](file:///c:/Users/KARANAM%20SAI/Desktop/Projects%20For%20SDE/CodeForge/Client/README.md)**: Contains the React single-page application (SPA), Zustand stores, component directories, routing, and Monaco editor configs. Read the [Client README](file:///c:/Users/KARANAM%20SAI/Desktop/Projects%20For%20SDE/CodeForge/Client/README.md) for frontend-specific instructions.
- ⚙️ **[Server Directory](file:///c:/Users/KARANAM%20SAI/Desktop/Projects%20For%20SDE/CodeForge/Server/README.md)**: Contains the Express API handlers, WebSocket gateways, Mongoose database models, Docker execution pipeline, security middlewares, and validation schemas. Read the [Server README](file:///c:/Users/KARANAM%20SAI/Desktop/Projects%20For%20SDE/CodeForge/Server/README.md) for backend-specific details.

---

## ⚡ Getting Started & Prerequisites

### Prerequisites

Ensure you have the following services installed and running locally:

1. **Node.js** (v18 or higher) & **npm**
2. **MongoDB** (Local instance or Atlas cloud connection URI)
3. **Redis** (Local instance or remote cloud connection)
4. **Docker Desktop** (Required for code execution compilation sandboxing).
   - Ensure the Docker daemon is running.
   - On Windows, enable "Expose daemon on tcp://localhost:2375 without TLS" in Docker Desktop settings, or ensure the local named pipe `//./pipe/docker_engine` is accessible.

### Installation & Setup

1. **Clone the repository and enter the directory**:
   ```bash
   git clone <your-repo-url> CodeForge
   cd CodeForge
   ```

2. **Backend Setup**:
   Go to the [Server directory](file:///c:/Users/KARANAM%20SAI/Desktop/Projects%20For%20SDE/CodeForge/Server), create your configuration file, and install dependencies:
   ```bash
   cd Server
   cp .env.example .env # Customize database URIs and keys
   npm install
   npm run dev
   ```

3. **Frontend Setup**:
   Go to the [Client directory](file:///c:/Users/KARANAM%20SAI/Desktop/Projects%20For%20SDE/CodeForge/Client), install dependencies, and run the Vite dev server:
   ```bash
   cd ../Client
   npm install
   npm run dev
   ```

4. **Verify Docker Images**:
   Pull the base runner images to prevent latency on the first submission execution:
   ```bash
   docker pull python:3.10-alpine
   docker pull node:18-alpine
   docker pull gcc:12-alpine
   docker pull openjdk:17-alpine
   ```

---

## 🔒 Security Practices

CodeForge runs arbitrary code provided by users, which carries severe security risks. The following mitigation protocols are in place:
1. **Network Isolation**: The spawned Docker containers are configured with `NetworkDisabled: true` to prevent containerized malware from performing DDoS attacks or accessing intranet microservices.
2. **Process Resource Constraints**: Containers are locked to `64MB` of RAM and `50%` of a single CPU core. This automatically limits memory allocation abuse and infinite loop processor spikes.
3. **Disk Write Limits**: Mounting files read-only (`ro`) prevents write attempts on host directories.
4. **Execution Timeouts**: A watchdog timer monitors the container run process. If execution exceeds the user-configured limit (e.g., 2000ms), the container is forcefully killed, preventing infinite loop lock-ups.
