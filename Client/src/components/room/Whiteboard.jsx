import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Pen,
  Highlighter,
  Eraser,
  Minus,
  ArrowRight,
  Square,
  Circle,
  Type,
  Trash2,
  Download,
  RotateCcw,
  RotateCw,
  Sparkles,
  Grid,
  Palette,
  Crosshair,
  Sliders
} from "lucide-react";
import toast from "react-hot-toast";
import { useTheme } from "../../context/ThemeContext";

const PRESET_COLORS = [
  "#ffffff",
  "#0f172a",
  "#6366f1",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#a855f7",
  "#fb923c"
];

const STROKE_SIZES = [
  { id: "fine", label: "1px", size: 1 },
  { id: "thin", label: "2px", size: 2 },
  { id: "medium", label: "4px", size: 4 },
  { id: "thick", label: "8px", size: 8 },
  { id: "marker", label: "14px", size: 14 }
];

const GRID_TYPES = [
  { id: "dots", label: "Dot Grid" },
  { id: "graph", label: "Graph Grid" },
  { id: "blank", label: "Plain Canvas" }
];

const Whiteboard = ({ roomId, user, wsRef }) => {
  const { isDark } = useTheme();

  // Selected Tools & Styling
  const [tool, setTool] = useState("pen"); // 'pen' | 'highlighter' | 'eraser' | 'line' | 'arrow' | 'rect' | 'circle' | 'text' | 'laser'
  const [color, setColor] = useState(isDark ? "#ffffff" : "#0f172a");
  const [strokeWidth, setStrokeWidth] = useState(3);
  const [gridType, setGridType] = useState("dots"); // 'dots' | 'graph' | 'blank'

  // Text Tool State
  const [textInputPos, setTextInputPos] = useState(null); // { x, y }
  const [textInputVal, setTextInputVal] = useState("");

  // History for Undo/Redo
  const [history, setHistory] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // Live remote laser pointers
  const [remoteLasers, setRemoteLasers] = useState(new Map()); // Map<userId, { x, y, username, color, expiresAt }>

  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const currentPathRef = useRef([]);
  const startPointRef = useRef(null);
  const tempCanvasRef = useRef(document.createElement("canvas")); // Offscreen buffer for previewing shapes

  // Update default color on theme toggle
  useEffect(() => {
    setColor((prev) => {
      if (prev === "#ffffff" && !isDark) return "#0f172a";
      if (prev === "#0f172a" && isDark) return "#ffffff";
      return prev;
    });
  }, [isDark]);

  // Redraw all canvas items from history array
  const redrawCanvas = useCallback((actionsList) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);

    (actionsList || []).forEach((action) => {
      renderAction(ctx, action);
    });

    ctx.restore();
  }, []);

  // Single Action Renderer
  const renderAction = (ctx, action) => {
    const { type, color: actColor, strokeWidth: actWidth, points, x, y, text, start, end, width, height } = action;

    ctx.save();
    ctx.strokeStyle = actColor || "#ffffff";
    ctx.fillStyle = actColor || "#ffffff";
    ctx.lineWidth = actWidth || 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (type === "pen") {
      if (!points || points.length < 2) {
        if (points && points.length === 1) {
          ctx.beginPath();
          ctx.arc(points[0].x, points[0].y, (actWidth || 2) / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i - 1].x + points[i].x) / 2;
        const yc = (points[i - 1].y + points[i].y) / 2;
        ctx.quadraticCurveTo(points[i - 1].x, points[i - 1].y, xc, yc);
      }
      ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
      ctx.stroke();
    } else if (type === "highlighter") {
      ctx.globalAlpha = 0.35;
      ctx.lineWidth = Math.max(actWidth * 3, 14);
      if (!points || points.length < 2) {
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    } else if (type === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = actWidth * 4;
      if (!points || points.length < 2) {
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.stroke();
    } else if (type === "line") {
      if (start && end) {
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
      }
    } else if (type === "arrow") {
      if (start && end) {
        const headlen = Math.max(12, actWidth * 3);
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const angle = Math.atan2(dy, dx);

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.lineTo(end.x, end.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x - headlen * Math.cos(angle - Math.PI / 6), end.y - headlen * Math.sin(angle - Math.PI / 6));
        ctx.lineTo(end.x - headlen * Math.cos(angle + Math.PI / 6), end.y - headlen * Math.sin(angle + Math.PI / 6));
        ctx.closePath();
        ctx.fill();
      }
    } else if (type === "rect") {
      if (start && typeof width === "number" && typeof height === "number") {
        ctx.beginPath();
        ctx.strokeRect(start.x, start.y, width, height);
      }
    } else if (type === "circle") {
      if (start && typeof width === "number" && typeof height === "number") {
        ctx.beginPath();
        const rx = Math.abs(width / 2);
        const ry = Math.abs(height / 2);
        const cx = start.x + width / 2;
        const cy = start.y + height / 2;
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, 2 * Math.PI);
        ctx.stroke();
      }
    } else if (type === "text") {
      if (text && typeof x === "number" && typeof y === "number") {
        ctx.font = `600 ${Math.max(14, actWidth * 4)}px 'Outfit', sans-serif`;
        ctx.fillText(text, x, y);
      }
    }

    ctx.restore();
  };

  // Resize and handle High-DPI canvas
  const setupCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;

    redrawCanvas(history);
  }, [history, redrawCanvas]);

  useEffect(() => {
    setupCanvasSize();
    window.addEventListener("resize", setupCanvasSize);
    return () => window.removeEventListener("resize", setupCanvasSize);
  }, [setupCanvasSize]);

  // Request initial board state from server & setup WS listener
  useEffect(() => {
    if (!wsRef.current) return;

    const handleMessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const { event: evt, payload } = data;

        if (evt === "board:init") {
          const { history: serverHistory } = payload || {};
          if (Array.isArray(serverHistory)) {
            setHistory(serverHistory);
            redrawCanvas(serverHistory);
          }
        }

        if (evt === "board:draw") {
          const { action } = payload || {};
          if (action) {
            setHistory((prev) => {
              const updated = [...prev, action];
              const canvas = canvasRef.current;
              if (canvas) {
                const ctx = canvas.getContext("2d");
                const dpr = window.devicePixelRatio || 1;
                ctx.save();
                ctx.scale(dpr, dpr);
                renderAction(ctx, action);
                ctx.restore();
              }
              return updated;
            });
          }
        }

        if (evt === "board:clear") {
          setHistory([]);
          setRedoStack([]);
          const canvas = canvasRef.current;
          if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
          toast("🧹 Whiteboard cleared by team member", { duration: 2500 });
        }

        if (evt === "board:laser") {
          const { point, user: laserUser } = payload || {};
          if (point && laserUser) {
            setRemoteLasers((prev) => {
              const next = new Map(prev);
              next.set(laserUser.userId, {
                x: point.x,
                y: point.y,
                username: laserUser.username,
                expiresAt: Date.now() + 2500
              });
              return next;
            });
          }
        }
      } catch (err) {
        console.error("Whiteboard WS parse error:", err);
      }
    };

    const ws = wsRef.current;
    ws.addEventListener("message", handleMessage);

    // Fetch initial board state
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          event: "board:get-state",
          payload: { roomId }
        })
      );
    }

    return () => {
      ws.removeEventListener("message", handleMessage);
    };
  }, [redrawCanvas, roomId, wsRef]);

  // Clear expired laser pointers periodically
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setRemoteLasers((prev) => {
        let changed = false;
        const next = new Map();
        prev.forEach((v, k) => {
          if (v.expiresAt > now) {
            next.set(k, v);
          } else {
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }, 500);

    return () => clearInterval(timer);
  }, []);

  // Broadcast Action to Peers
  const broadcastAction = (action) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "board:draw",
          payload: {
            roomId,
            action
          }
        })
      );
    }
  };

  // Mouse Coordinate Helper
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const clientY = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  // Pointer Down Handlers
  const handlePointerDown = (e) => {
    const coords = getCanvasCoords(e);

    if (tool === "laser") {
      isDrawingRef.current = true;
      broadcastLaser(coords);
      return;
    }

    if (tool === "text") {
      setTextInputPos(coords);
      setTextInputVal("");
      return;
    }

    isDrawingRef.current = true;
    startPointRef.current = coords;
    currentPathRef.current = [coords];
  };

  // Pointer Move Handlers
  const handlePointerMove = (e) => {
    const coords = getCanvasCoords(e);

    if (tool === "laser" && isDrawingRef.current) {
      broadcastLaser(coords);
      return;
    }

    if (!isDrawingRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      currentPathRef.current.push(coords);

      // Incremental render
      ctx.save();
      ctx.scale(dpr, dpr);
      const points = currentPathRef.current;
      const len = points.length;
      if (len >= 2) {
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (tool === "highlighter") {
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = strokeWidth * 3;
        } else if (tool === "eraser") {
          ctx.globalCompositeOperation = "destination-out";
          ctx.lineWidth = strokeWidth * 4;
        }

        ctx.beginPath();
        ctx.moveTo(points[len - 2].x, points[len - 2].y);
        ctx.lineTo(points[len - 1].x, points[len - 1].y);
        ctx.stroke();
      }
      ctx.restore();
    } else if (tool === "line" || tool === "arrow" || tool === "rect" || tool === "circle") {
      // Temporary preview during drag
      redrawCanvas(history);
      ctx.save();
      ctx.scale(dpr, dpr);
      const previewAction = {
        type: tool,
        color,
        strokeWidth,
        start: startPointRef.current,
        end: coords,
        width: coords.x - startPointRef.current.x,
        height: coords.y - startPointRef.current.y
      };
      renderAction(ctx, previewAction);
      ctx.restore();
    }
  };

  // Pointer Up Handlers
  const handlePointerUp = (e) => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (tool === "laser") return;

    const coords = getCanvasCoords(e);
    let newAction = null;

    if (tool === "pen" || tool === "highlighter" || tool === "eraser") {
      if (currentPathRef.current.length > 0) {
        newAction = {
          type: tool,
          color,
          strokeWidth,
          points: currentPathRef.current
        };
      }
    } else if (tool === "line" || tool === "arrow") {
      if (startPointRef.current) {
        newAction = {
          type: tool,
          color,
          strokeWidth,
          start: startPointRef.current,
          end: coords
        };
      }
    } else if (tool === "rect" || tool === "circle") {
      if (startPointRef.current) {
        newAction = {
          type: tool,
          color,
          strokeWidth,
          start: startPointRef.current,
          width: coords.x - startPointRef.current.x,
          height: coords.y - startPointRef.current.y
        };
      }
    }

    if (newAction) {
      const updated = [...history, newAction];
      setHistory(updated);
      setRedoStack([]);
      redrawCanvas(updated);
      broadcastAction(newAction);
    }

    currentPathRef.current = [];
    startPointRef.current = null;
  };

  // Broadcast Laser Position
  const broadcastLaser = (point) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "board:laser",
          payload: {
            roomId,
            point
          }
        })
      );
    }
  };

  // Commit Text Tool to Canvas
  const handleCommitText = () => {
    if (!textInputVal.trim() || !textInputPos) {
      setTextInputPos(null);
      setTextInputVal("");
      return;
    }

    const action = {
      type: "text",
      color,
      strokeWidth,
      text: textInputVal.trim(),
      x: textInputPos.x,
      y: textInputPos.y
    };

    const updated = [...history, action];
    setHistory(updated);
    setRedoStack([]);
    redrawCanvas(updated);
    broadcastAction(action);

    setTextInputPos(null);
    setTextInputVal("");
  };

  // Undo Last Action
  const handleUndo = () => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    const updated = history.slice(0, -1);
    setHistory(updated);
    setRedoStack((prev) => [...prev, last]);
    redrawCanvas(updated);

    // Broadcast clear & full redraw sync
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "board:clear",
          payload: { roomId }
        })
      );
      updated.forEach((act) => broadcastAction(act));
    }
  };

  // Redo Action
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextAct = redoStack[redoStack.length - 1];
    const updatedRedo = redoStack.slice(0, -1);
    const updatedHistory = [...history, nextAct];
    setHistory(updatedHistory);
    setRedoStack(updatedRedo);
    redrawCanvas(updatedHistory);
    broadcastAction(nextAct);
  };

  // Clear Canvas
  const handleClearBoard = () => {
    if (!window.confirm("Are you sure you want to clear the entire whiteboard for all team members?")) {
      return;
    }
    setHistory([]);
    setRedoStack([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          event: "board:clear",
          payload: { roomId }
        })
      );
    }
    toast.success("✨ Whiteboard cleared");
  };

  // Download Board as High-Resolution PNG
  const handleDownloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create an export canvas with solid background
    const exportCanvas = document.createElement("canvas");
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext("2d");

    // Background fill
    ctx.fillStyle = isDark ? "#0f172a" : "#f8fafc";
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // Draw whiteboard content
    ctx.drawImage(canvas, 0, 0);

    const dataUrl = exportCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `CodeForge-Board-${roomId.slice(-6)}.png`;
    a.click();
    toast.success("📥 Whiteboard exported as PNG image!");
  };

  return (
    <div className="clay-card-static p-2 p-md-3 d-flex flex-column h-100 position-relative" style={{ minHeight: "560px" }}>
      {/* Top Toolbar */}
      <div
        className="d-flex align-items-center justify-content-between pb-2 mb-2 border-bottom flex-wrap gap-2"
        style={{ borderColor: "var(--border-glass)" }}
      >
        {/* Tool Selectors */}
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <button
            onClick={() => setTool("pen")}
            className={`clay-btn py-1 px-2 ${tool === "pen" ? "clay-btn-primary" : ""}`}
            title="Pen (Freehand Drawing)"
          >
            <Pen size={14} />
            <span className="d-none d-md-inline small">Pen</span>
          </button>

          <button
            onClick={() => setTool("highlighter")}
            className={`clay-btn py-1 px-2 ${tool === "highlighter" ? "clay-btn-primary" : ""}`}
            title="Highlighter (Semi-transparent)"
          >
            <Highlighter size={14} />
            <span className="d-none d-md-inline small">Highlighter</span>
          </button>

          <button
            onClick={() => setTool("eraser")}
            className={`clay-btn py-1 px-2 ${tool === "eraser" ? "clay-btn-primary" : ""}`}
            title="Eraser"
          >
            <Eraser size={14} />
            <span className="d-none d-md-inline small">Eraser</span>
          </button>

          <div className="vr mx-1 opacity-25" />

          {/* Shapes Group */}
          <button
            onClick={() => setTool("line")}
            className={`clay-btn py-1 px-2 ${tool === "line" ? "clay-btn-primary" : ""}`}
            title="Straight Line"
          >
            <Minus size={14} />
          </button>

          <button
            onClick={() => setTool("arrow")}
            className={`clay-btn py-1 px-2 ${tool === "arrow" ? "clay-btn-primary" : ""}`}
            title="Arrow (Diagrams & Flowcharts)"
          >
            <ArrowRight size={14} />
          </button>

          <button
            onClick={() => setTool("rect")}
            className={`clay-btn py-1 px-2 ${tool === "rect" ? "clay-btn-primary" : ""}`}
            title="Rectangle (Architecture Boxes)"
          >
            <Square size={14} />
          </button>

          <button
            onClick={() => setTool("circle")}
            className={`clay-btn py-1 px-2 ${tool === "circle" ? "clay-btn-primary" : ""}`}
            title="Circle (Graph Nodes / Trees)"
          >
            <Circle size={14} />
          </button>

          <button
            onClick={() => setTool("text")}
            className={`clay-btn py-1 px-2 ${tool === "text" ? "clay-btn-primary" : ""}`}
            title="Text Annotations"
          >
            <Type size={14} />
          </button>

          <button
            onClick={() => setTool("laser")}
            className={`clay-btn py-1 px-2 ${tool === "laser" ? "clay-btn-primary text-danger" : ""}`}
            title="Live Laser Pointer (Presenting)"
          >
            <Crosshair size={14} />
            <span className="d-none d-md-inline small">Laser</span>
          </button>
        </div>

        {/* Action Controls (Undo, Redo, Clear, Download) */}
        <div className="d-flex align-items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="clay-btn py-1 px-2"
            title="Undo (Ctrl+Z)"
          >
            <RotateCcw size={13} />
          </button>

          <button
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="clay-btn py-1 px-2"
            title="Redo (Ctrl+Y)"
          >
            <RotateCw size={13} />
          </button>

          <div className="vr mx-1 opacity-25" />

          {/* Grid Background Switcher */}
          <select
            value={gridType}
            onChange={(e) => setGridType(e.target.value)}
            className="clay-btn py-1 px-2 fw-semibold"
            style={{ fontSize: "0.75rem" }}
          >
            {GRID_TYPES.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleDownloadImage}
            className="clay-btn py-1 px-2 text-primary"
            title="Download Canvas PNG"
          >
            <Download size={13} />
            <span className="d-none d-sm-inline small">Save</span>
          </button>

          <button
            onClick={handleClearBoard}
            className="clay-btn clay-btn-danger py-1 px-2"
            title="Clear Board"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Secondary Bar: Color Palettes & Stroke Width */}
      <div className="d-flex align-items-center justify-content-between pb-2 mb-2 flex-wrap gap-2">
        {/* Colors */}
        <div className="d-flex align-items-center gap-1 flex-wrap">
          <span className="small text-muted me-1" style={{ fontSize: "0.75rem" }}>
            Color:
          </span>
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className="rounded-circle border-0 p-0"
              style={{
                width: "20px",
                height: "20px",
                backgroundColor: c,
                boxShadow: color === c ? `0 0 0 2px var(--accent-primary), 0 0 6px ${c}` : "none",
                transform: color === c ? "scale(1.2)" : "scale(1)",
                transition: "all 0.15s ease",
                cursor: "pointer"
              }}
              title={c}
            />
          ))}

          {/* Custom Color Input */}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="border-0 bg-transparent cursor-pointer ms-1"
            style={{ width: "22px", height: "22px", padding: 0 }}
            title="Custom Hex Color"
          />
        </div>

        {/* Thickness Selectors */}
        <div className="d-flex align-items-center gap-1">
          <span className="small text-muted me-1" style={{ fontSize: "0.75rem" }}>
            Size:
          </span>
          {STROKE_SIZES.map((sz) => (
            <button
              key={sz.id}
              onClick={() => setStrokeWidth(sz.size)}
              className={`clay-badge px-2 py-0 cursor-pointer ${
                strokeWidth === sz.size ? "border-primary text-primary fw-bold" : "text-muted"
              }`}
              style={{ fontSize: "0.72rem", cursor: "pointer" }}
            >
              {sz.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Canvas Container with Grid Pattern */}
      <div
        className="flex-fill position-relative rounded-3 overflow-hidden"
        style={{
          minHeight: "440px",
          height: "460px",
          border: "1px solid var(--border-glass)",
          backgroundColor: isDark ? "#0a0f1d" : "#f8fafc",
          backgroundImage:
            gridType === "dots"
              ? isDark
                ? "radial-gradient(rgba(255, 255, 255, 0.15) 1px, transparent 1px)"
                : "radial-gradient(rgba(0, 0, 0, 0.15) 1px, transparent 1px)"
              : gridType === "graph"
              ? isDark
                ? "linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)"
                : "linear-gradient(to right, rgba(0, 0, 0, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 0, 0, 0.06) 1px, transparent 1px)"
              : "none",
          backgroundSize: gridType === "dots" ? "20px 20px" : gridType === "graph" ? "24px 24px" : "auto",
          cursor:
            tool === "laser"
              ? "crosshair"
              : tool === "eraser"
              ? "cell"
              : tool === "text"
              ? "text"
              : "crosshair",
          touchAction: "none"
        }}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
          className="w-100 h-100 position-absolute top-0 start-0"
        />

        {/* Inline Text Input Popover */}
        {textInputPos && (
          <div
            className="position-absolute p-1 rounded-2 shadow"
            style={{
              left: textInputPos.x,
              top: textInputPos.y,
              zIndex: 10,
              background: "var(--bg-surface-elevated)",
              border: "1px solid var(--accent-primary)"
            }}
          >
            <input
              type="text"
              autoFocus
              placeholder="Type label here & press Enter..."
              value={textInputVal}
              onChange={(e) => setTextInputVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCommitText();
                if (e.key === "Escape") setTextInputPos(null);
              }}
              onBlur={handleCommitText}
              className="clay-input py-1 px-2 small"
              style={{
                color: color,
                fontSize: `${Math.max(14, strokeWidth * 4)}px`,
                minWidth: "180px",
                outline: "none"
              }}
            />
          </div>
        )}

        {/* Remote Laser Pointers Overlay */}
        {Array.from(remoteLasers.values()).map((laser, idx) => (
          <div
            key={idx}
            className="position-absolute pointer-events-none d-flex align-items-center gap-1"
            style={{
              left: laser.x,
              top: laser.y,
              transform: "translate(-50%, -50%)",
              zIndex: 20,
              pointerEvents: "none",
              transition: "left 0.05s linear, top 0.05s linear"
            }}
          >
            <div
              className="rounded-circle animate-ping"
              style={{
                width: "14px",
                height: "14px",
                backgroundColor: "#f43f5e",
                boxShadow: "0 0 12px #f43f5e"
              }}
            />
            <span
              className="badge bg-danger text-white py-0 px-1 font-monospace"
              style={{ fontSize: "0.65rem", transform: "translate(4px, -12px)" }}
            >
              {laser.username}
            </span>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="d-flex align-items-center justify-content-between pt-2 mt-1 text-muted small" style={{ fontSize: "0.75rem" }}>
        <span>🖌️ Smooth Bézier vector rendering • Real-time team synchronized</span>
        <span>{history.length} strokes active</span>
      </div>
    </div>
  );
};

export default Whiteboard;
