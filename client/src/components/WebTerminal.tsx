import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { AlertCircle, Loader2 } from "lucide-react";

interface WebTerminalProps {
  componentSlug?: string; // For config file editing
  filePath?: string;
}

export default function WebTerminal({
  componentSlug,
  filePath,
}: WebTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstance = useRef<Terminal | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js
    const term = new Terminal({
      cols: 120,
      rows: 30,
      theme: {
        background: "#0f0f1e",
        foreground: "#e0e0e0",
        cursor: "#00ff00",
        black: "#1a1a2e",
        red: "#ff4444",
        green: "#44ff44",
        yellow: "#ffff44",
        blue: "#4444ff",
        magenta: "#ff44ff",
        cyan: "#44ffff",
        white: "#ffffff",
      },
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 13,
      lineHeight: 1.2,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);

    term.open(terminalRef.current);
    fitAddon.fit();

    terminalInstance.current = term;

    // Resize handler
    const handleResize = () => {
      try {
        fitAddon.fit();
        // Notify server of terminal resize
        if (socketRef.current?.readyState === WebSocket.OPEN) {
          socketRef.current.send(
            JSON.stringify({
              type: "resize",
              cols: term.cols,
              rows: term.rows,
            })
          );
        }
      } catch (e) {
        console.error("Failed to fit terminal:", e);
      }
    };

    window.addEventListener("resize", handleResize);

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/terminal`;

    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      // Send initialization request (NO passwords sent)
      socket.send(
        JSON.stringify({
          type: "init",
          componentSlug: componentSlug || null,
          filePath: filePath || null,
        })
      );
    };

    socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "ready") {
          setIsConnecting(false);
          term.write("\r\n✓ SSH connection established\r\n\r\n");
          if (filePath) {
            term.write(`Editing: ${filePath}\r\n`);
            term.write("Type ':q' to exit nano, or Ctrl+X to exit vi\r\n\r\n");
          }
        } else if (data.type === "data") {
          term.write(data.data);
        } else if (data.type === "error") {
          setError(data.message);
          term.write(`\r\n✗ Error: ${data.message}\r\n`);
        } else if (data.type === "closed") {
          term.write("\r\n\n✓ Connection closed\r\n");
        }
      } catch (parseError) {
        console.error("Failed to parse WebSocket message:", parseError);
      }
    };

    socket.onerror = (event) => {
      console.error("WebSocket error:", event);
      setError("WebSocket connection failed");
      setIsConnecting(false);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
    };

    socketRef.current = socket;

    // Handle terminal input
    term.onData((data) => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.send(JSON.stringify({ type: "input", data }));
        } catch (e) {
          console.error("Failed to send terminal input:", e);
        }
      }
    });

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (socket.readyState === WebSocket.OPEN) {
        socket.close();
      }
      term.dispose();
    };
  }, [componentSlug, filePath]);

  return (
    <div className="w-full h-full flex flex-col bg-black rounded-lg border border-border overflow-hidden">
      {isConnecting && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10 rounded-lg">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <p className="text-sm text-cyan-400">Connecting to SSH...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border-b border-red-500/30 p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div
        ref={terminalRef}
        className="flex-1 overflow-hidden"
        style={{ minHeight: "400px" }}
      />
    </div>
  );
}
