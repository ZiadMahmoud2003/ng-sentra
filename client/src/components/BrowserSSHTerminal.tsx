import { useEffect, useRef, useState } from "react";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import "@xterm/xterm/css/xterm.css";
import { Button } from "@/components/ui/button";
import { X, RotateCcw } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BrowserSSHTerminalProps {
  componentId: number;
  componentName: string;
  onClose: () => void;
}

export function BrowserSSHTerminal({ componentId, componentName, onClose }: BrowserSSHTerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const terminalInstanceRef = useRef<Terminal | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm
    const term = new Terminal({
      cols: 120,
      rows: 30,
      theme: {
        background: "#0f172a",
        foreground: "#e2e8f0",
        cursor: "#00ff00",
        cursorAccent: "#0f172a",
      },
      fontFamily: "Menlo, Monaco, 'Courier New', monospace",
      fontSize: 12,
      lineHeight: 1.2,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    terminalInstanceRef.current = term;

    // Connect to WebSocket
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/api/terminal`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log("[Terminal] WebSocket connected");
      // Send init message with component ID
      ws.send(
        JSON.stringify({
          type: "init",
          componentId: componentId,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "ready") {
          console.log("[Terminal] SSH connection ready");
          setIsConnecting(false);
          term.write("\r\n\x1b[32m✓ Connected to SSH\x1b[0m\r\n");
        } else if (data.type === "data") {
          term.write(data.data);
        } else if (data.type === "error") {
          setError(data.message);
          term.write(`\r\n\x1b[31mError: ${data.message}\x1b[0m\r\n`);
          setIsConnecting(false);
        } else if (data.type === "closed") {
          term.write("\r\n\x1b[33mConnection closed\x1b[0m\r\n");
          setIsConnecting(false);
        }
      } catch (err) {
        console.error("[Terminal] Failed to parse message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("[Terminal] WebSocket error:", error);
      setError("WebSocket connection failed");
      setIsConnecting(false);
    };

    ws.onclose = () => {
      console.log("[Terminal] WebSocket closed");
      setIsConnecting(false);
    };

    wsRef.current = ws;

    // Handle terminal input
    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "input",
            data: data,
          })
        );
      }
    });

    // Handle resize
    const handleResize = () => {
      try {
        fitAddon.fit();
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(
            JSON.stringify({
              type: "resize",
              cols: term.cols,
              rows: term.rows,
            })
          );
        }
      } catch (err) {
        console.error("[Terminal] Resize error:", err);
      }
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      term.dispose();
    };
  }, [componentId]);

  const handleReconnect = () => {
    setError(null);
    setIsConnecting(true);
    if (wsRef.current) {
      wsRef.current.close();
    }
    // Trigger re-mount by changing key or calling useEffect again
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
          <div>
            <h2 className="font-semibold text-foreground">{componentName} - SSH Terminal</h2>
            <p className="text-xs text-muted-foreground mt-1">
              {isConnecting ? "Connecting..." : "Connected"}
            </p>
          </div>
          <div className="flex gap-2">
            {error && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReconnect}
                className="gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reconnect
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={onClose}
              className="gap-2"
            >
              <X className="h-4 w-4" />
              Close
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="m-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Terminal */}
        <div
          ref={terminalRef}
          className="flex-1 overflow-hidden bg-[#0f172a]"
          style={{ minHeight: "400px" }}
        />

        {/* Footer */}
        <div className="p-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          <p>Type your SSH commands here. Press Ctrl+D to exit.</p>
        </div>
      </div>
    </div>
  );
}
