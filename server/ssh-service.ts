import { getDb } from "./db";
import { eq, inArray } from "drizzle-orm";
import { systemSettings } from "../drizzle/schema";

interface SSHConfig {
  host: string;
  user: string;
  password: string;
}

/**
 * Get SSH credentials from system settings
 */
export async function getSSHConfig(): Promise<SSHConfig | null> {
  const db = await getDb();
  if (!db) return null;

  try {
    const result = await db
      .select()
      .from(systemSettings)
      .where(inArray(systemSettings.key, ["ssh_host", "ssh_user", "ssh_password"]));
    const settings = result;

    const map: Record<string, string> = {};
    settings.forEach((s: any) => { map[s.key] = s.value ?? ""; });

    if (!map.ssh_host || !map.ssh_user || !map.ssh_password) {
      return null;
    }

    return {
      host: map.ssh_host,
      user: map.ssh_user,
      password: map.ssh_password,
    };
  } catch (error) {
    console.error("[SSH Service] Failed to get SSH config:", error);
    return null;
  }
}

/**
 * Read a file from the remote server via SSH
 */
export async function readFileViaSsh(filePath: string): Promise<string | null> {
  // SSH2 is not available in production environment
  // This function is only used for reading config files from the SOC server
  // In production, users should use the browser terminal to view/edit files
  throw new Error("SSH file operations are not available in this environment. Use the browser terminal instead.");
}

/**
 * Write a file to the remote server via SSH
 */
export async function writeFileViaSsh(filePath: string, content: string): Promise<void> {
  // SSH2 is not available in production environment
  throw new Error("SSH file operations are not available in this environment. Use the browser terminal instead.");
}

/**
 * Test SSH connection
 */
export async function testSSHConnection(): Promise<boolean> {
  const sshConfig = await getSSHConfig();
  if (!sshConfig) {
    return false;
  }

  // SSH2 is not available in production
  // Return true if credentials are configured
  return !!sshConfig.host && !!sshConfig.user && !!sshConfig.password;
}
