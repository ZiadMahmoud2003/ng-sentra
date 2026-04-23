/**
 * Terminal Service - Stub Implementation
 * 
 * SSH terminal access is handled via local terminal launch (OpenSSHButton component)
 * rather than embedded WebSocket connections. This service is kept as a stub
 * for potential future use or reference.
 */

interface TerminalSession {
  sessionId: string;
  host: string;
  user: string;
  isConnected: boolean;
}

const sessions = new Map<string, TerminalSession>();

/**
 * Create an SSH terminal session
 * NOTE: This is a stub. Use OpenSSHButton component for local terminal launch instead.
 */
export async function createTerminalSession(
  sessionId: string,
  host: string,
  user: string,
  password: string
): Promise<TerminalSession | null> {
  console.warn(
    "[Terminal] Embedded terminal sessions are not supported. Use the OpenSSHButton component to launch your local SSH client."
  );
  return null;
}

/**
 * Send input to terminal session
 */
export function sendTerminalInput(sessionId: string, data: string): boolean {
  console.warn("[Terminal] Terminal input not supported in stub implementation");
  return false;
}

/**
 * Close terminal session
 */
export function closeTerminalSession(sessionId: string): void {
  sessions.delete(sessionId);
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
  console.warn("[Terminal] File editing not supported in stub implementation");
  return false;
}
