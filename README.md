<div align="center">

# ⚡ CodeForge ⚡
### *The Next-Generation Real-Time Collaborative Coding Arena & Isolated Online Judge*

[![Live Demo](https://img.shields.io/badge/Live_App-code--forge--one--woad.vercel.app-6366F1?style=for-the-badge&logo=vercel&logoColor=white)](https://code-forge-one-woad.vercel.app)
[![API Gateway](https://img.shields.io/badge/API_Gateway-Railway_Production-000000?style=for-the-badge&logo=railway&logoColor=white)](https://codeforge-production-c22a.up.railway.app)
[![GitHub License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

<br />

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=700&size=24&duration=3000&pause=1000&color=6366F1&center=true&vCenter=true&width=750&lines=Pair+Programming+with+Real-Time+Keystroke+Sync;Isolated+Docker+Multi-Language+Code+Judge;AI-Powered+SDE+Mock+Interviewing+%26+Big-O+Analysis;Gamified+Coding+Streaks+%26+Global+Leaderboard;Complete+Admin+Command+Center+%26+Moderation" alt="Typing SVG" />
</p>

---

<!-- Tech Stack Badges -->
<p align="center">
  <img src="https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB" alt="React 19" />
  <img src="https://img.shields.io/badge/Vite_6-646CFF?style=flat-square&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Node.js_22_LTS-43853D?style=flat-square&logo=node.js&logoColor=white" alt="Node 22" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=flat-square&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/WebSockets_WS-010101?style=flat-square&logo=socketdotio&logoColor=white" alt="WebSockets" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" alt="Redis" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/Google_Gemini_AI-8E75B2?style=flat-square&logo=google&logoColor=white" alt="Gemini AI" />
  <img src="https://img.shields.io/badge/Monaco_Editor-1E1E1E?style=flat-square&logo=visualstudiocode&logoColor=007ACC" alt="Monaco" />
</p>

</div>

---

## 🌟 Table of Contents
- [📖 About The Project](#-about-the-project)
- [🌐 Live Deployment URIs](#-live-deployment-uris)
- [✨ Core Capabilities & Features](#-core-capabilities--features)
  - [1. Real-Time Collaborative Multiplayer Arenas](#1-real-time-collaborative-multiplayer-arenas)
  - [2. Isolated Multi-Language Code Judge Sandbox](#2-isolated-multi-language-code-judge-sandbox)
  - [3. AI SDE Mock Interviewer & Synthesizer](#3-ai-sde-mock-interviewer--synthesizer)
  - [4. Admin Command Center & Moderation Suite](#4-admin-command-center--moderation-suite)
  - [5. Gamification, Streaks & Global Hall of Fame](#5-gamification-streaks--global-hall-of-fame)
  - [6. Universal Responsive Design](#6-universal-responsive-design)
- [🛠 Tech Stack & Modern Compiler Matrix](#-tech-stack--modern-compiler-matrix)
- [📐 System Architecture](#-system-architecture)
- [🛡️ Security & Sandbox Hardening](#️-security--sandbox-hardening)
- [🔌 REST API & WebSocket Specifications](#-rest-api--websocket-specifications)
- [🔑 Admin Access & Seeding](#-admin-access--seeding)
- [🚀 Quick Start & Local Setup](#-quick-start--local-setup)
- [📄 License](#-license)

---

## 📖 About The Project

**CodeForge** is an ultra-modern, full-stack algorithmic problem-solving ecosystem and collaborative code judge. It fuses the real-time multiplayer synergy of Google Docs with the secure, high-throughput automated grading sandbox of platforms like LeetCode and Codeforces—supercharged with AI mock interviewing, LeetCode problem scraping, customizable room lifespans, and a comprehensive Admin Command Center.

Whether preparing for FAANG/Tier-1 software engineering interviews, hosting pair programming mock sessions, or organizing collegiate coding hackathons, CodeForge delivers an unrivaled developer experience.

---

## 🌐 Live Deployment URIs

| Component | Target URL | Status | Description |
| :--- | :--- | :--- | :--- |
| **Frontend Web App** | [`https://code-forge-one-woad.vercel.app`](https://code-forge-one-woad.vercel.app) | ![Vercel](https://img.shields.io/badge/Vercel-Deployed-success?style=flat-square) | React 19 SPA with Monaco Editor & Glassmorphism UI |
| **API Gateway** | [`https://codeforge-production-c22a.up.railway.app`](https://codeforge-production-c22a.up.railway.app) | ![Railway](https://img.shields.io/badge/Railway-Online-success?style=flat-square) | Express.js REST API with Redis caching & Docker Judge |
| **WebSocket Server** | `wss://codeforge-production-c22a.up.railway.app` | ![WS](https://img.shields.io/badge/WebSocket-Live-blue?style=flat-square) | Low-latency bi-directional multiplayer socket stream |
| **Repository** | [`https://github.com/Saikaranam-70/CodeForge`](https://github.com/Saikaranam-70/CodeForge) | ![GitHub](https://img.shields.io/badge/GitHub-Public-purple?style=flat-square) | Monorepo containing Client and Server |

---

## ✨ Core Capabilities & Features

### 1. Real-Time Collaborative Multiplayer Arenas
- **Zero-Latency Keystroke Sync**: Synchronized Monaco editor sessions across multiple developers with in-memory state persistence and Redis caching.
- **Problem Switching Sync**: When any team member switches the active challenge, all peers in the room transition simultaneously.
- **Custom Room Lifecycles & TTL**: Set room active durations (**30 Mins, 1 Hour, 2 Hours, 4 Hours, 8 Hours, 24 Hours**). Rooms automatically expire using **MongoDB TTL Indexes** and clean up memory/caches.
- **Live In-Room Countdown Timer**: Real-time ticking timer (`⏳ 01:45:20 Remaining`) with amber/red pulse warning when less than 10 minutes remain.
- **Security PIN / Passcode Lock**: Private rooms require a 4-digit PIN or secret phrase to join.
- **Instant Code Sharing**: 6-character human-friendly room codes (e.g. `CR-8F3A`) with 1-click clipboard copying.

### 2. Isolated Multi-Language Code Judge Sandbox
- **Modern Compiler & Runtime Suite**:
  - **Node.js 22 LTS** (`node:22-alpine`)
  - **Python 3.12** (`python:3.12-alpine`)
  - **Java 21 LTS** (`openjdk:21-alpine`)
  - **C++23 (GCC 14)** (`gcc:14-alpine` with `-std=c++23 -O3`)
  - **C17 (GCC 14)** (`gcc:14-alpine` with `-std=c17 -O3`)
  - **Go 1.23** (`golang:1.23-alpine`)
  - **Rust 1.80+** (`rust:1.80-alpine`)
- **Automated Grading Engine**: Compiles and executes code against hidden edge-case test suites, returning verdicts:
  - `Accepted (AC)`
  - `Wrong Answer (WA)`
  - `Time Limit Exceeded (TLE)`
  - `Memory Limit Exceeded (MLE)`
  - `Runtime Error (RE)`
  - `Compilation Error (CE)`
- **Percentile Speed & Memory Benchmarking**: Measures exact execution time (ms) and RAM usage (MB) against the global user base.

### 3. AI SDE Mock Interviewer & Synthesizer
- **Google Gemini-Powered AI Co-Pilot**:
  - **"Why did I fail?" AI Debugger**: Pinpoints logical bugs, edge cases, and off-by-one errors from test failures without spoiling the full solution.
  - **Big-O Complexity Analyzer**: Computes worst-case Time and Space complexity for user code.
  - **Socratic Hints**: Provides progressively helpful algorithmic hints.
- **1-Click LeetCode Problem Scraper**: Paste any LeetCode URL or slug to auto-extract problem statements, constraints, sample cases, and hidden test suites.
- **AI Test Suite Generator**: Automatically generates edge cases, large input sets, and verified outputs from a problem title and description.

### 4. Admin Command Center & Moderation Suite
- **Pending Community Proposals**: Moderate user-submitted challenges with a full preview inspection modal and 1-click **Approve & Publish** or **Reject**.
- **Problem Repository Manager**: Search, filter, edit problem details/test cases in-place, and delete challenges.
- **User Accounts Manager**: View registered users, solve counts, and daily streaks, with 1-click **Promote to Admin / Demote to Coder** and account deletion.
- **Live Room Overseer**: Real-time monitoring of all active collaborative rooms with host info, live member counts, and force termination controls.
- **Platform Analytics Ribbon**: Real-time stats for pending proposals, total challenges, total users, active rooms, and judge engine health.

### 5. Gamification, Streaks & Global Hall of Fame
- **Daily Streak Engine**: Automatically tracks consecutive daily problem solves and records all-time longest streaks.
- **Global Leaderboard**: Live rankings sorted by **Most Problems Conquered** or **Longest Streaks** with Gold, Silver, and Bronze podium cards.
- **Developer Profile Analytics**: Breakdown of solved challenges by difficulty (Easy, Medium, Hard), historical submission logs, and visual achievements.

### 6. Universal Responsive Design
- **Cross-Device Compatibility**: Seamless layout scaling from mobile phones (320px) and tablets (768px) to ultra-wide displays (4K).
- **Adaptive Arena Navigation**: Mobile and tablet users enjoy a sleek 3-tab navigation switcher (`[ 💻 Code Editor | 📖 Problem | 💬 Chat ]`) eliminating endless vertical scrolling.
- **Glassmorphism & Claymorphism Theme**: High-contrast, dark aesthetic with soft 3D clay elevation, translucent frosted glass panels, and radiant ambient glows.

---

## 🛠 Tech Stack & Modern Compiler Matrix

```
CodeForge Architecture
├── Frontend: React 19 • Vite 6 • Monaco Editor • Zustand • React Router 7 • Bootstrap 5 • Lucide Icons
├── Backend: Node.js 22 LTS • Express.js • WebSockets (ws) • Dockerode • JWT • Bcrypt • Dotenv
├── Persistence: MongoDB Atlas • Mongoose 8 • Redis (ioredis) Cache
├── Execution: Docker Sandboxing • Linux Alpine Containers • Multi-Core CPU/Memory Quotas
└── AI & LLM: Google Gemini AI API • LeetCode Scraping Engine
```

### Compiler & Container Runtime Specifications

| Language | Version / Compiler | Docker Base Image | Optimization Flags |
| :--- | :--- | :--- | :--- |
| **JavaScript** | Node.js 22 LTS (V8 Engine) | `node:22-alpine` | Standard V8 JIT |
| **TypeScript** | TypeScript 5.6 / Node 22 | `node:22-alpine` | `ts-node --transpile-only` |
| **Python** | Python 3.12 | `python:3.12-alpine` | `python -u` (unbuffered) |
| **C++** | C++23 (GCC 14.2) | `gcc:14-alpine` | `g++ -std=c++23 -O3 -Wall` |
| **C** | C17 (GCC 14.2) | `gcc:14-alpine` | `gcc -std=c17 -O3 -lm` |
| **Java** | Java 21 LTS (OpenJDK 21) | `openjdk:21-alpine` | `javac` + `java -Xmx128M` |
| **Go** | Go 1.23 | `golang:1.23-alpine` | `go run` |
| **Rust** | Rust 1.80+ (rustc / cargo) | `rust:1.80-alpine` | `rustc -O` |

---

## 📐 System Architecture

### 1. Code Execution & Grading Flow
```mermaid
sequenceDiagram
    autonumber
    actor Coder as Developer (Browser)
    participant API as Express API Server
    database Cache as Redis Cache
    database DB as MongoDB Database
    participant Engine as Docker Sandbox Runner
    participant Docker as Isolated Container

    Coder->>API: POST /api/problems/:id/submit { code, language }
    API->>DB: Fetch Problem Details & Hidden Test Cases
    API->>Engine: Dispatch execution job
    Engine->>Docker: Create container (Network: None, Memory: 128MB, CPU: 0.5)
    Engine->>Docker: Mount code & pipe stdin test cases
    Docker->>Docker: Execute binary against test suite
    Docker-->>Engine: Stream stdout, stderr, execution time & exit code
    Engine->>Docker: Destroy and prune container instance
    Engine-->>API: Return execution output & metrics
    API->>API: Evaluate actual vs expected output & assign Verdict
    alt Verdict == "Accepted"
        API->>DB: Update User Solved Stats & Daily Streak
        API->>Cache: Invalidate leaderboard cache
    end
    API-->>Coder: Return JSON { verdict, executionTime, testCasesPassed, failingTestCase }
```

### 2. WebSocket Multiplayer Synchronization Flow
```mermaid
sequenceDiagram
    autonumber
    actor PeerA as Developer A
    actor PeerB as Developer B
    participant WS as WebSocket Gateway
    database Redis as Redis Memory Store

    PeerA->>WS: ws://connect?token=JWT (room:join { roomId })
    WS->>Redis: Get current room state (code, lang, problemIdx, expiresAt)
    WS-->>PeerA: Broadcast room:joined { members, currentCode, expiresAt }
    WS-->>PeerB: Broadcast room:joined { joinedUser: PeerA }

    PeerA->>WS: Send code:change { changes: { text }, language }
    WS->>Redis: Update cached room state (TTL: 86400)
    WS-->>PeerB: Broadcast code:change to all peers (excluding sender)

    PeerB->>WS: Send problem:change { selectedProblemIdx: 1 }
    WS-->>PeerA: Broadcast problem:change to synchronize active challenge
```

---

## 🛡️ Security & Sandbox Hardening

Running untrusted user-submitted code requires rigorous security boundaries:

1. **Network Disconnection**: Every container is spawned with `NetworkDisabled: true`, preventing DDoS attacks, cryptomining pools, and intranet probing.
2. **Resource Quotas (Cgroups)**: Memory is hard-capped at `128MB` and CPU execution is restricted to `50%` of a single core. Fork bombs and memory allocation exploits are halted immediately.
3. **Execution Watchdog Timer**: A strict timeout (default `2000ms`) forcefully terminates containers exceeding time limits, preventing infinite loop lockups.
4. **Non-Root Execution & Read-Only Mounts**: Container processes execute without superuser privileges, and mounted source volumes are marked read-only (`ro`).
5. **JWT Single-Session Verification**: Active session UUIDs stored in Redis verify user authenticity and prevent credential sharing.

---

## 🔌 REST API & WebSocket Specifications

### Authentication Routes (`/api/auth`)
- `POST /register` — Register a new account
- `POST /login` — Authenticate and receive JWT token
- `GET /me` — Retrieve current authenticated user profile & streak data

### Problem Routes (`/api/problems`)
- `GET /` — Paginated list of published problems (supports `?difficulty=`, `?page=`, `?limit=`)
- `GET /:id` — Get problem description, sample cases, constraints, and time/memory limits
- `POST /:id/submit` — Submit code for Docker judge evaluation
- `POST /propose` — Propose a community problem for admin approval
- `GET /admin/pending` — *(Admin)* Fetch pending problem proposals
- `GET /admin/all` — *(Admin)* Fetch all problems with management fields
- `PUT /:id/approve` — *(Admin)* Approve and publish a proposed problem
- `PUT /:id/reject` — *(Admin)* Reject a proposed problem
- `PUT /:id` — *(Admin)* Edit problem details and test cases in-place
- `DELETE /:id` — *(Admin)* Delete a problem permanently

### Multiplayer Room Routes (`/api/room`)
- `POST /` — Create a collaborative room with custom lifespan (`durationMinutes`) & PIN
- `POST /join-by-code` — Join room by 6-character room code (e.g. `CR-8F3A`)
- `GET /` — Fetch active live rooms list with remaining time & participant counts
- `GET /:id` — Fetch single room details and attached problems
- `POST /:id/join` — Join room by ID with passcode validation
- `POST /:id/leave` — Leave a room (auto-deletes empty rooms)
- `GET /admin/all` — *(Admin)* Inspect all active rooms across the platform
- `DELETE /admin/:id` — *(Admin)* Force terminate and purge any room

### AI Gateway Routes (`/api/ai`)
- `POST /debug-explanation` — Get AI root-cause analysis for failing test cases
- `POST /time-space-complexity` — Compute Big-O Time & Space complexity
- `POST /socratic-hint` — Request a progressive algorithmic hint
- `POST /generate-testcases` — Synthesize automated test cases with verified outputs
- `POST /import-leetcode` — 1-Click scrape and import any LeetCode challenge
- `POST /generate-problem` — AI synthesis of novel DSA problems by topic & difficulty

### WebSocket Events (`/`)
- `room:join` ➔ `room:joined` (Syncs editor content, language, problem, expiration, and online members)
- `code:change` ➔ `code:change` (Bi-directional keystroke streaming)
- `problem:change` ➔ `problem:change` (Peer problem switching synchronization)
- `chat:message` ➔ `chat:message` (Real-time in-room text chat)
- `room:expired` (Broadcast when room time period concludes)

---

## 🔑 Admin Access & Seeding

CodeForge includes a built-in seeding utility to configure administrative access:

### Default Admin Credentials
- **Email:** `admin@codeforge.dev`
- **Password:** `AdminPassword123!`
- **Role:** `admin`

### Seeding the Admin Account
Run the following script from the `Server` directory:
```bash
cd Server
node scripts/seedAdmin.js
```

Once logged in as an administrator, the top navigation bar displays the **"🛡️ Admin Hub"** link leading directly to the **Admin Command Center**.

---

## 🚀 Quick Start & Local Setup

### Prerequisites
- [Node.js (v20+)](https://nodejs.org/) & `npm`
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI)
- [Redis](https://redis.io/) (Local or Redis Cloud URI)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Running locally for code execution)

---

### 1. Clone the Repository
```bash
git clone https://github.com/Saikaranam-70/CodeForge.git
cd CodeForge
```

---

### 2. Backend Server Setup
```bash
cd Server

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env
```

Configure your `Server/.env` file:
```env
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/codeforge
JWT_SECRET=your_super_secret_jwt_key_here
REDIS_URL=redis://default:<password>@<host>:<port>
GEMINI_API_KEY=your_google_gemini_api_key
```

Seed base problems and admin account:
```bash
node scripts/seedProblems.js
node scripts/seedAdmin.js
```

Start the backend development server:
```bash
npm run dev
```
*Backend runs on `http://localhost:5000` with WebSocket gateway on `ws://localhost:5000`.*

---

### 3. Frontend Client Setup
```bash
cd ../Client

# Install dependencies
npm install
```

Configure your `Client/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:5000
```

Start the Vite development server:
```bash
npm run dev
```
*Frontend runs on `http://localhost:5173`.*

---

### 4. Pull Docker Runner Images (Optional but Recommended)
To prevent cold-start delays on the first code evaluation, pre-pull the runner images:
```bash
docker pull node:22-alpine
docker pull python:3.12-alpine
docker pull openjdk:21-alpine
docker pull gcc:14-alpine
docker pull golang:1.23-alpine
docker pull rust:1.80-alpine
```

---

## 👥 Contributing

Contributions, issues, and feature requests are welcome!
Feel free to check the [issues page](https://github.com/Saikaranam-70/CodeForge/issues).

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Saikaranam-70">Sai Karanam</a> and the CodeForge Open Source Community.</sub>
</div>
