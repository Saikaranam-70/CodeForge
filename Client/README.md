# CodeForge Client Application

The CodeForge client is a modern, responsive single-page React application built on top of the Vite tooling stack. It provides developers with collaborative, real-time code workspaces, interactive room chat, visual analytics, and an integrated coding playground.

---

## 🛠 Tech Stack & Core Libraries

- **Build System**: Vite (Ultra-fast HMR and compilation packaging)
- **UI library**: React 19 (Component-driven view architecture)
- **Styling**: Vanilla CSS (Tailored variables for custom animations and dark mode theme)
- **Code Editor**: `@monaco-editor/react` (Visual code interface, identical to VS Code core)
- **State Store**: `Zustand` (Fast, lightweight, slice-based state management)
- **Charts**: `Recharts` (Dynamic, SVG-based charts to render user statistics)
- **Routing**: `React Router Dom` (v7 client-side SPA routing)
- **Notifications**: `React Hot Toast` (Non-blocking status updates for compile/run verdicts)

---

## 📂 Frontend Project Structure

```text
Client/
├── public/              # Static public assets (icons, images)
├── src/
│   ├── assets/          # Project images, logo vectors, and SVGs
│   ├── components/      # Common UI components (Navbar, Button, Card, Modal, Loader)
│   │   ├── dashboard/   # Recharts visualization panels and statistics cards
│   │   ├── editor/      # Monaco editor wrapper, compiler panels, testcase tables
│   │   └── room/        # Chat drawers, participant grids, and access controls
│   ├── hooks/           # Custom React hooks (useWebSocket, useAuth)
│   ├── pages/           # High-level route pages
│   │   ├── Dashboard.jsx# User metrics, history list, and coding analytics
│   │   ├── Home.jsx     # Landing landing page with active room finders
│   │   ├── Login.jsx    # User authentication sign-in
│   │   ├── ProblemDetail.jsx # Solo programming workspace layout
│   │   ├── ProblemsList.jsx   # Catalog of coding challenges
│   │   ├── Register.jsx # Account sign-up form
│   │   └── RoomWorkspace.jsx # Collaborative workspace with live editor
│   ├── stores/          # Zustand store definitions (authStore, roomStore)
│   ├── App.css          # Core layouts and animations styles
│   ├── App.jsx          # Route declarations and layout shells
│   ├── index.css        # Tailwind/CSS custom global variables and utility classes
│   └── main.jsx         # Application initialization entrypoint
├── index.html           # SPA entry layout HTML template
├── vite.config.js       # Vite plugins and compilation settings
└── package.json         # Project manifests and package dependencies
```

---

## 💾 Zustand State Stores

State management is separated into lightweight, modular Zustand stores:

### 1. Authentication Store (`src/stores/authStore.js`)
Tracks the current user session and tokens.
- **State**: `user` (Object), `token` (String), `isAuthenticated` (Boolean), `loading` (Boolean).
- **Actions**:
  - `login(credentials)`: Calls POST `/api/auth/login` and persists JWT.
  - `register(details)`: Calls POST `/api/auth/register` to create a profile.
  - `logout()`: Clears the storage caches and token credentials.
  - `checkAuth()`: Validates existing token with `/api/auth/me` on bootstrap.

### 2. Room Collaborative Store (`src/stores/roomStore.js`)
Synchronizes live workspace metadata.
- **State**: `roomId` (String), `roomName` (String), `problem` (Object), `members` (Array of Users), `chatMessages` (Array of messages), `codeState` (String), `language` (String).
- **Actions**:
  - `setRoomData(data)`: Populates initial settings from `/api/rooms/:id`.
  - `addMember(user)`: Welcomes new participant.
  - `removeMember(userId)`: Cleans up listing on participant disconnection.
  - `updateCode(newCode)`: Commits editor changes.
  - `pushChatMessage(msg)`: Appends incoming messages to the chat console.

### 3. Leaderboard & Stats Store (`src/stores/statsStore.js`)
Handles users standings and public profiles.
- **State**: `leaderboard` (Array), `publicProfile` (Object), `statsLoading` (Boolean).
- **Actions**:
  - `fetchLeaderboard(sortBy)`: Fetch rankings sorted by streak count or solved totals.
  - `fetchUserProfile(username)`: Query public metrics for display cards and heatmap calendars.

---

## 💻 Monaco Editor Collaborative Setup

The collaborative experience integrates Monaco Editor with WebSocket broadcasts:

1. **Initialization**:
   When loading a collaborative page (`RoomWorkspace.jsx`), the Monaco Editor loads the code matching the server's current stored document status.
2. **Synchronizing Changes**:
   - Every key stroke registers an event. To prevent network traffic spam, the client listens to Monaco's `onDidChangeModelContent` event and forwards changes:
     ```javascript
     const handleEditorChange = (value, event) => {
       if (isIncomingSocketChange) return; // Prevent infinite loop broadcasts
       socket.send(JSON.stringify({
         event: 'code:change',
         payload: { roomId, changes: event.changes }
       }));
     };
     ```
   - On receiving a WebSocket `code:change` packet, Monaco applies the edits at specific cursor ranges programmatically to maintain cursor offsets and styling.
3. **Presence & Cursors**:
   - Mouse click or caret repositioning fires the `cursor:move` socket message.
   - Other users' cursors are displayed in Monaco using custom **Decorators** (colored lines) combined with floating tooltip names showing their username.

---

## 📊 Analytics Dashboards

The client uses `Recharts` to compile custom graphics on the `Dashboard.jsx` page:
- **Submissions Status Pie Chart**: Renders a percentage distribution of execution outcomes (Accepted, WR, TLE, RE, CE).
- **Execution Times Area Chart**: Tracks solving speeds for the user's last 20 submissions.
- **Difficulty Success Cards**: Shows breakdown metrics (e.g., 5/10 Easy, 2/15 Medium, 0/5 Hard solved).

---

## 📅 Profile Activity Heatmap & Stats Widget

To represent coding consistency (streaks) effectively, the frontend features custom dashboard widgets:

1. **Daily Streak Counter**:
   A visual flame tracker displaying current streak days (e.g., `🔥 7 Days Streak!`) along with the user's historical longest streak.
2. **GitHub-Style Contribution Heatmap**:
   - The calendar displays a grid of squares mapped across 365 days (53 columns x 7 rows).
   - Uses CSS Grid layouts where each grid item represents a day.
   - Day squares are styled conditionally with green gradients representing submission density:
     - `bg-neutral-800` for 0 submissions.
     - `bg-emerald-800` for 1-2 submissions.
     - `bg-emerald-600` for 3-5 submissions.
     - `bg-emerald-400` for >5 submissions.
   - Hover tooltips show: `"12 submissions on 2026-08-04"`.

---

## ⚙️ Client Configuration & Setup

1. **Environment Config**:
   Create a `.env` file in the `Client/` directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_WS_URL=ws://localhost:5000/ws
   ```

2. **Starting the Dev Server**:
   ```bash
   npm install
   npm run dev
   ```
   The client application will start running at `http://localhost:5173`.
