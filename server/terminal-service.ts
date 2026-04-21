import { Client, ClientChannel } from "ssh2";
import { getSSHConfig } from "./ssh-service";

interface TerminalSession {
  client: Client;
  stream: ClientChannel;
  isConnected: boolean;
}

const sessions = new Map<string, TerminalSession>();

/**
 * Create an SSH terminal session
 */
export async function createTerminalSession(
  sessionId: string,
  host: string,
  user: string,
  password: string
): Promise<TerminalSession | null> {
  return new Promise((resolve) => {
    const client = new Client();

    client.on("ready", () => {
      client.shell((err, stream) => {
        if (err) {
          client.end();
          resolve(null);
          return;
        }

        const session: TerminalSession = {
          client,
          stream,
          isConnected: true,
        };

        sessions.set(sessionId, session);
        resolve(session);
      });
    });

    client.on("error", (err) => {
      console.error("[Terminal] SSH connection error:", err);
      resolve(null);
    });

    client.on("close", () => {
      sessions.delete(sessionId);
    });

    client.connect({
      host,
      username: user,
      password,
      readyTimeout: 10000,
    });
  });
}

/**
 * Send input to terminal session
 */
export function sendTerminalInput(sessionId: string, data: string): boolean {
  const session = sessions.get(sessionId);
  if (!session || !session.isConnected) {
    return false;
  }

  try {
    session.stream.write(data);
    return true;
  } catch (error) {
    console.error("[Terminal] Failed to send input:", error);
    return false;
  }
}

/**
 * Close terminal session
 */
export function closeTerminalSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.isConnected = false;
    try {
      session.stream.end();
      session.client.end();
    } catch (error) {
      console.error("[Terminal] Error closing session:", error);
    }
    sessions.delete(sessionId);
  }
}

/**
 * Get terminal session
 */
export function getTerminalSession(sessionId: string): TerminalSession | undefined {
  return sessions.get(sessionId);
}

/**
 * Edit a file via terminal (opens nano/vi)
 */
export async function editFileViaTerminal(
  sessionId: string,
  filePath: string,
  editor: "nano" | "vi" = "nano"
): Promise<boolean> {
  const session = sessions.get(sessionId);
  if (!session || !session.isConnected) {
    return false;
  }

  try {
    session.stream.write(`${editor} "${filePath}"\n`);
    return true;
  } catch (error) {
    console.error("[Terminal] Failed to open editor:", error);
    return false;
  }
}
