import { WebSocketServer } from "ws";
import { Server } from "http";
import { nanoid } from "nanoid";
import { createTerminalSession, sendTerminalInput, closeTerminalSession } from "../terminal-service";
import { sdk } from "./sdk";
import { getSshCredentialsByComponentId } from "../db";


/**
 * Setup WebSocket terminal handler
 */
export function setupTerminalHandler(httpServer: Server) {
  const wss = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrade requests
  httpServer.on("upgrade", async (request: any, socket: any, head: any) => {
    if (request.url !== "/api/terminal") {
      socket.destroy();
      return;
    }

    // Authenticate the request
    try {
      const user = await sdk.authenticateRequest(request as any);
      if (!user) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      // Check if user is admin or analyst (terminal access control)
      const isAdmin = user.role === "Admin" || user.role === "admin";
      const isAnalyst = user.role === "Analyst";

      if (!isAdmin && !isAnalyst) {
        socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(request, socket, head, (ws) => {
        handleTerminalConnection(ws, user, sdk);
      });
    } catch (error) {
      console.error("[Terminal] Authentication failed:", error);
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
    }
  });
}

/**
 * Handle individual terminal WebSocket connection
 */
function handleTerminalConnection(ws: any, user: any, sdk: any): void {
  const sessionId = nanoid();
  let sshSessionId: string | null = null;

  console.log(`[Terminal] New connection from user ${user.email} (session: ${sessionId})`);

  ws.on("message", async (rawData: Buffer) => {
    try {
      const data = JSON.parse(rawData.toString());

      if (data.type === "init") {
        // Initialize SSH connection
        const { componentId, filePath } = data;

        // Get SSH credentials for this specific component
        let sshConfig: any = null;
        if (componentId) {
          try {
            sshConfig = await getSshCredentialsByComponentId(componentId);
          } catch (error) {
            console.error("[Terminal] Failed to fetch component SSH credentials:", error);
          }
        }

        if (!sshConfig) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "SSH credentials not configured for this component",
            })
          );
          ws.close();
          return;
        }

        // Validate admin-only access for config file editing
        if (filePath) {
          const isAdmin = user.role === "Admin" || user.role === "admin";
          if (!isAdmin) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: "Admin access required for config file editing",
              })
            );
            ws.close();
            return;
          }
        }

        const session = await createTerminalSession(
          sessionId,
          sshConfig.host,
          sshConfig.username,
          sshConfig.password
        );

        if (!session) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Failed to establish SSH connection",
            })
          );
          ws.close();
          return;
        }

        sshSessionId = sessionId;

        // Send ready signal
        ws.send(JSON.stringify({ type: "ready" }));

        // Listen for stream data and send to client
        session.stream.on("data", (chunk: Buffer) => {
          if (ws.readyState === 1) { // WebSocket.OPEN
            ws.send(
              JSON.stringify({
                type: "data",
                data: chunk.toString(),
              })
            );
          }
        });

        session.stream.on("error", (err: Error) => {
          console.error("[Terminal] Stream error:", err);
          if (ws.readyState === 1) {
            ws.send(
              JSON.stringify({
                type: "error",
                message: err.message,
              })
            );
          }
        });

        session.stream.on("close", () => {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify({ type: "closed" }));
          }
          ws.close();
        });

        // If file path provided, open it in nano
        if (filePath) {
          setTimeout(() => {
            sendTerminalInput(sessionId, `nano "${filePath}"\n`);
          }, 500);
        }
      } else if (data.type === "input" && sshSessionId) {
        // Send user input to SSH stream
        sendTerminalInput(sshSessionId, data.data);
      } else if (data.type === "resize" && sshSessionId) {
        // Handle terminal resize (optional, for future PTY support)
        console.log(`[Terminal] Resize: ${data.cols}x${data.rows}`);
      }
    } catch (error) {
      console.error("[Terminal] Message handling error:", error);
      if (ws.readyState === 1) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Internal server error",
          })
        );
      }
    }
  });

  ws.on("close", () => {
    console.log(`[Terminal] Connection closed (session: ${sessionId})`);
    if (sshSessionId) {
      closeTerminalSession(sshSessionId);
    }
  });

  ws.on("error", (error: Error) => {
    console.error(`[Terminal] WebSocket error (session: ${sessionId}):`, error);
    if (sshSessionId) {
      closeTerminalSession(sshSessionId);
    }
  });
}
