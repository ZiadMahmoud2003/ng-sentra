import { Server } from "http";

/**
 * Terminal Handler - Stub Implementation
 * 
 * Embedded WebSocket terminal is disabled. SSH access is handled via:
 * - OpenSSHButton component for local terminal launch (Windows/macOS/Linux)
 * - SSH URI protocol handlers for direct client integration
 * 
 * This handler is kept as a stub for potential future use.
 */

export function setupTerminalHandler(httpServer: Server) {
  console.log(
    "[Terminal] Embedded terminal handler disabled. Use OpenSSHButton component for SSH access."
  );
  
  // No-op: Terminal access is handled client-side via OpenSSHButton component
}
