# CodeForge Backend Server

The CodeForge backend is a high-performance Node.js & Express server equipped with WebSocket gateways for real-time collaboration and a secure runner engine that executes untrusted code in Docker containers using `dockerode`.

---

## 🛠 Tech Stack & Dependencies

- **Framework**: Express (REST API endpoints)
- **Real-Time Sync**: Native Node.js WebSocket library (`ws`)
- **Database**: MongoDB & Mongoose (data modeling and persistence)
- **Session Cache**: Redis & `ioredis` (caching problem specs and tracking transient room states)
- **Sandbox Execution**: `dockerode` (Docker remote API client wrapper)
- **Security**: `helmet` (HTTP headers), `express-rate-limit` (brute-force protection), `bcryptjs` (password hashing), `jsonwebtoken` (stateless tokens), `joi` (input payload schema validation)

---

## 📂 Backend Project Structure

```text
Server/
├── src/
│   ├── config/          # Database, Redis, and Docker daemon configurations
│   ├── controllers/     # API handler logic (auth, rooms, problems, submissions)
│   ├── middleware/      # Authentication checks, CORS, errors, rate limits, validators
│   ├── models/          # Mongoose Schemas (User, Problem, Submission, Room)
│   ├── routes/          # Express route definitions
│   ├── services/        # Sandbox execution runner, Redis store, WS broker
│   ├── websocket/       # Connection lifecycle and room event routers
│   └── app.js           # App initialization, routes register, middleware stacks
├── .env.example         # Template configuration for environment variables
├── package.json         # Node.js dependencies and scripts
└── server.js            # HTTP and WebSocket server entry point
```

---

## 🗄 Mongoose Schemas

### 1. User Model (`src/models/User.js`)
Stores authentication metadata.
```javascript
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true, minLength: 3, maxLength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true, minLength: 6 },
  createdAt: { type: Date, default: Date.now },
  
  // Resume Gamification Enhancements
  streakCount: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastActiveDate: { type: String, default: null }, // Format: "YYYY-MM-DD"
  solvedProblems: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Problem' }],
  solvedStats: {
    easy: { type: Number, default: 0 },
    medium: { type: Number, default: 0 },
    hard: { type: Number, default: 0 }
  },
  activityLog: [{
    date: { type: String, required: true }, // Format: "YYYY-MM-DD"
    count: { type: Number, default: 0 }
  }]
});
```

### 2. Problem Model (`src/models/Problem.js`)
Stores coding challenge descriptions and testing verification files.
```javascript
const ProblemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true }, // Markdown supported
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  constraints: { type: String },
  inputFormat: { type: String },
  outputFormat: { type: String },
  sampleTestCases: [{
    input: { type: String },
    output: { type: String }
  }],
  hiddenTestCases: [{
    input: { type: String, required: true },
    output: { type: String, required: true }
  }],
  timeLimit: { type: Number, default: 2000 },  // in ms
  memoryLimit: { type: Number, default: 64 }    // in MB
});
```

### 3. Submission Model (`src/models/Submission.js`)
Tracks grading records.
```javascript
const SubmissionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true },
  code: { type: String, required: true },
  language: { type: String, required: true }, // e.g. python, javascript, cpp, java
  status: { 
    type: String, 
    enum: ['Accepted', 'Wrong Answer', 'Time Limit Exceeded', 'Runtime Error', 'Compilation Error', 'Pending'],
    default: 'Pending'
  },
  executionTime: { type: Number }, // in ms
  memoryUsed: { type: Number },    // in KB
  errorOutput: { type: String },   // details of stderr or compilation messages
  createdAt: { type: Date, default: Date.now }
});
```

### 4. Room Model (`src/models/Room.js`)
Tracks short-lived collaborative workspaces.
```javascript
const RoomSchema = new mongoose.Schema({
  name: { type: String, required: true },
  problemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem' },
  hostId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now, expires: 86400 } // Auto-deletes room after 24 hrs
});
```

---

## 📡 REST API Specifications

All endpoints (except Authentication registration/login) expect a Bearer Token: `Authorization: Bearer <JWT_TOKEN>`.

### Authentication Router
- **Register Account**
  - `POST /api/auth/register`
  - Body: `{ "username": "dev1", "email": "dev1@gmail.com", "password": "securepassword" }`
  - Response: `201 Created` with `{ "token": "JWT...", "user": { "id", "username", "email" } }`

- **Authenticate Login**
  - `POST /api/auth/login`
  - Body: `{ "email": "dev1@gmail.com", "password": "securepassword" }`
  - Response: `200 OK` with `{ "token": "JWT...", "user": { "id", "username" } }`

- **Current User Profile**
  - `GET /api/auth/me`
  - Response: `200 OK` with `{ "id", "username", "email", "createdAt" }`

### Problems Router
- **List All Problems**
  - `GET /api/problems?page=1&limit=20`
  - Response: `200 OK` with `{ "problems": [...], "totalPages": 3, "totalCount": 45 }`

- **Fetch Single Problem Details**
  - `GET /api/problems/:id`
  - Response: `200 OK` with detailed model (Note: **hiddenTestCases** are removed from response body for anti-cheating security).

- **Create a New Problem (Admin Only)**
  - `POST /api/problems`
  - Body: `{ "title": "Two Sum", "description": "...", "difficulty": "Easy", "hiddenTestCases": [{ "input": "...", "output": "..." }] }`
  - Response: `201 Created`

### Rooms Router
- **Create Room**
  - `POST /api/rooms`
  - Body: `{ "name": "Hackathon Prep Room", "problemId": "64ef81..." }`
  - Response: `201 Created` with room information details.

- **Retrieve Room Profile**
  - `GET /api/rooms/:id`
  - Response: `200 OK` with Room metadata and nested user profiles.

### Submissions Router
- **Submit Problem Solution**
  - `POST /api/problems/:id/submit`
  - Body: `{ "code": "def solve():...", "language": "python" }`
  - Response: `200 OK` with code verdict details, plus updated user statistics and streak information if the submission is accepted.

### Users & Leaderboard Router
- **Get Public User Profile & Streaks**
  - `GET /api/users/:username/profile`
  - Response: `200 OK`
    ```json
    {
      "username": "karanamsai",
      "createdAt": "2026-08-04T16:20:00.000Z",
      "streaks": { "currentStreak": 5, "longestStreak": 14, "lastActiveDate": "2026-08-04" },
      "stats": { "solvedTotal": 17, "solvedBreakdown": { "easy": 10, "medium": 5, "hard": 2 } },
      "activityLog": [{ "date": "2026-08-04", "count": 2 }]
    }
    ```

- **Get Global Rankings Leaderboard**
  - `GET /api/users/leaderboard?sortBy=solved&limit=10`
  - Params: `sortBy` (`"solved"` or `"streak"`)
  - Response: `200 OK`
    ```json
    [
      { "username": "userA", "solvedCount": 150, "streak": 25 },
      { "username": "userB", "solvedCount": 120, "streak": 5 }
    ]
    ```

---

## 🔌 WebSocket Collaboration Protocol

The WebSocket broker (implemented in `src/websocket/socketHandlers.js`) handles editor contents syncing, cursor movements, and team chat.

### WebSocket Connection URL
`ws://localhost:5000/ws?token=<JWT_TOKEN>`

### Messages Format (JSON)
All socket exchanges follow a unified wrapper format:
```json
{
  "event": "event_name",
  "payload": { ... }
}
```

### Event Manifest

1. **`room:join`** (Client -> Server)
   - Payload: `{ "roomId": "ROOM_OBJECT_ID" }`
   - Action: Adds websocket to Redis channels and local memory rooms. Broadcasts presence to existing members.

2. **`room:joined`** (Server -> Client)
   - Payload: `{ "members": [{ "userId", "username" }], "currentCode": "...", "currentLanguage": "python" }`
   - Action: Sent to the joining user to load the latest editor state.

3. **`code:change`** (Client -> Server -> Client Broadcast)
   - Payload: `{ "roomId": "ROOM_ID", "changes": { "text": "...", "range": { "startLine", "startCol", "endLine", "endCol" } } }`
   - Action: Broadcasts document modifications to other room participants.

4. **`cursor:move`** (Client -> Server -> Client Broadcast)
   - Payload: `{ "roomId": "ROOM_ID", "position": { "lineNumber": 12, "column": 5 } }`
   - Action: Synchronizes and renders visual cursor indicators in the room's Monaco Editors.

5. **`chat:message`** (Client -> Server -> Client Broadcast)
   - Payload: `{ "roomId": "ROOM_ID", "message": "Can someone look at the nested loop?" }`
   - Action: Broadcasts chat message to the room.

---

## 🐳 Docker Execution Sandbox Details

To run code, the server spins up custom micro-containers using `Dockerode`. Here is how the service ensures safety and performance:

1. **Host-to-Guest Code Injection**:
   The user's code is written to a temporary unique file (e.g., `temp/run_123ab.py`). This file is mounted directly into the docker container in **Read-Only Mode** (`:ro` bind configuration) to prevent users from altering underlying system configs.
2. **Execution Environment Configurations**:
   Each container runs with resource locks:
   - `Memory`: `67108864` bytes (64MB maximum RAM allocation).
   - `NanoCpus`: `500000000` (caps processor usage to 0.5 CPU core).
   - `NetworkDisabled`: `true` (cuts off internet access entirely).
3. **Execution Pipeline Lifecycle**:
   - Create container instance using Alpine-based environments (`python:3.10-alpine`, `node:18-alpine`).
   - Start the container.
   - Stream standard inputs (`stdin`) into the container console stream.
   - Set a timeout watchdog (`setTimeout`). If container processes exceed the problem's `timeLimit` (default 2s), kill container forcefully, triggering a `Time Limit Exceeded` verdict.
   - Stop and capture `stdout`/`stderr`.
   - Remove/Clean up the container from Docker's records.
   - Validate captured outputs against the problem's expected solutions.

---

## 🔥 Streak Tracker & Stats Calculation Logic

When a code submission compiles and evaluates successfully with an **`Accepted`** status, the backend performs the following update transaction:

1. **Activity Heatmap Logging**:
   It grabs the current server date in user-local context (e.g., `"YYYY-MM-DD"`). If it exists in the `activityLog` array, it increments the count; otherwise, it appends a new date object.
2. **Solved Verification & Counters**:
   If the problem's `_id` is missing from the user's `solvedProblems` array:
   - It appends the `_id`.
   - It increments `solvedStats.easy`, `solvedStats.medium`, or `solvedStats.hard` depending on the category of the solved problem.
3. **Streak Delta Checking**:
   - Compares the `lastActiveDate` value:
     - **Streak Break**: If `lastActiveDate` is older than yesterday, it resets the current `streakCount` back to `1`.
     - **Streak Active**: If `lastActiveDate` is exactly yesterday, it increments `streakCount` by `1`.
     - **Co-incident**: If `lastActiveDate` is equal to today, the current count is left untouched.
   - If the new `streakCount` is greater than `longestStreak`, the `longestStreak` is synced to the new count.
   - Updates `lastActiveDate` to the current date string.

---

## ⚙️ Environment Variables (`.env`)

Configure the following parameters in your `.env` file before executing:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/codeforge
REDIS_URL=redis://localhost:6379
JWT_SECRET=supersecretkeyreplaceinproduction
TOKEN_EXPIRY=24h
DOCKER_SOCKET_PATH=//./pipe/docker_engine # Use '/var/run/docker.sock' on Unix systems
NODE_ENV=development
```
