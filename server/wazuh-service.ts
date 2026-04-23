import { getWazuhSettings } from "./db";
import axios from "axios";
import https from "https";

export interface WazuhAlert {
  id: string;
  timestamp: string;
  rule_id: string;
  rule_description: string;
  severity: number;
  agent_id: string;
  agent_name: string;
  source_ip?: string;
  destination_ip?: string;
  action: string;
}

/**
 * Create axios instance with SSL bypass for self-signed certificates
 */
function createAxiosInstance(url: string) {
  const httpsAgent = new https.Agent({
    rejectUnauthorized: false,
  });

  return axios.create({
    httpsAgent,
    timeout: 10000,
  });
}

/**
 * Fetch recent alerts from Wazuh Elasticsearch
 */
export async function fetchWazuhAlerts(limit: number = 50): Promise<WazuhAlert[]> {
  try {
    const settings = await getWazuhSettings();
    
    if (!settings?.elasticsearchUrl) {
      throw new Error("Wazuh Elasticsearch URL not configured");
    }

    const client = createAxiosInstance(settings.elasticsearchUrl);
    
    const query = {
      size: limit,
      sort: [{ timestamp: { order: "desc", unmapped_type: "date" } }],
      query: {
        bool: {
          filter: [{ exists: { field: "rule.id" } }],
        },
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add basic auth if credentials are provided
    let auth = undefined;
    if (settings.elasticsearchUsername && settings.elasticsearchPassword) {
      auth = {
        username: settings.elasticsearchUsername,
        password: settings.elasticsearchPassword,
      };
    }

    const indexPattern = settings.alertIndexPattern || "wazuh-alerts-*";
    const response = await client.post(
      `${settings.elasticsearchUrl}/${encodeURIComponent(indexPattern)}/_search`,
      query,
      { headers, auth }
    );

    const data = response.data as any;
    const hits = data.hits?.hits || [];

    const read = (obj: any, path: string[]): unknown =>
      path.reduce((acc: any, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);

    return hits.map((hit: any) => {
      const source = hit._source || {};
      const ruleDescription =
        (read(source, ["rule", "description"]) as string | undefined) ||
        (read(source, ["message"]) as string | undefined) ||
        (read(source, ["full_log"]) as string | undefined) ||
        "Unknown Rule";
      const ruleId =
        (read(source, ["rule", "id"]) as string | number | undefined) ??
        (read(source, ["rule", "sid"]) as string | number | undefined) ??
        "unknown";
      const levelRaw =
        (read(source, ["rule", "level"]) as number | string | undefined) ??
        (read(source, ["severity"]) as number | string | undefined) ??
        0;
      const severity = typeof levelRaw === "number" ? levelRaw : Number(levelRaw) || 0;
      const action =
        (read(source, ["action"]) as string | undefined) ||
        (read(source, ["data", "action"]) as string | undefined) ||
        (read(source, ["syscheck", "event"]) as string | undefined) ||
        (read(source, ["rule", "groups", 0 as any]) as string | undefined) ||
        "unknown";

      return {
        id: hit._id,
        timestamp: (read(source, ["timestamp"]) as string | undefined) || new Date().toISOString(),
        rule_id: String(ruleId),
        rule_description: ruleDescription,
        severity,
        agent_id: String((read(source, ["agent", "id"]) as string | number | undefined) ?? "unknown"),
        agent_name: String((read(source, ["agent", "name"]) as string | undefined) ?? "Unknown Agent"),
        source_ip:
          (read(source, ["source", "ip"]) as string | undefined) ||
          (read(source, ["data", "srcip"]) as string | undefined),
        destination_ip:
          (read(source, ["destination", "ip"]) as string | undefined) ||
          (read(source, ["data", "dstip"]) as string | undefined),
        action,
      };
    });
  } catch (error) {
    console.error("[Wazuh] Failed to fetch alerts:", error);
    throw error;
  }
}

/**
 * Test Wazuh Elasticsearch connection with detailed diagnostics
 */
export async function testWazuhConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const settings = await getWazuhSettings();
    
    if (!settings?.elasticsearchUrl) {
      return { success: false, message: "Elasticsearch URL not configured" };
    }

    console.log("[Wazuh] Testing connection to:", settings.elasticsearchUrl);

    const client = createAxiosInstance(settings.elasticsearchUrl);
    
    const headers: Record<string, string> = {};

    let auth = undefined;
    if (settings.elasticsearchUsername && settings.elasticsearchPassword) {
      auth = {
        username: settings.elasticsearchUsername,
        password: settings.elasticsearchPassword,
      };
      console.log("[Wazuh] Using authentication with username:", settings.elasticsearchUsername);
    } else {
      console.log("[Wazuh] No authentication configured");
    }

    console.log("[Wazuh] Sending request to:", `${settings.elasticsearchUrl}/_cluster/health`);
    
    const response = await client.get(
      `${settings.elasticsearchUrl}/_cluster/health`,
      { headers, auth }
    );

    console.log("[Wazuh] Response status:", response.status);

    if (response.status === 200) {
      const data = response.data as any;
      const message = `Connected successfully. Cluster status: ${data.status}`;
      console.log("[Wazuh]", message);
      return { success: true, message };
    } else {
      const message = `HTTP ${response.status}: Unexpected response`;
      console.error("[Wazuh] Connection failed:", message);
      return { success: false, message };
    }
  } catch (error: any) {
    console.error("[Wazuh] Connection test failed:", error);
    
    // Provide helpful error messages based on error type
    let message = "Unknown error";
    
    if (error?.code === 'ECONNREFUSED') {
      message = "Connection refused: Elasticsearch is not running or the port is incorrect.";
    } else if (error?.code === 'ENOTFOUND') {
      message = "DNS error: Cannot resolve the Elasticsearch hostname.";
    } else if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
      message = "Connection timeout: Elasticsearch is not reachable. Check if the URL is correct and accessible from your network.";
    } else if (error?.response?.status === 401) {
      message = "Authentication failed: Invalid username or password.";
    } else if (error?.response?.status === 403) {
      message = "Access forbidden: User does not have permission to access Elasticsearch.";
    } else if (error?.message) {
      message = `Error: ${error.message}`;
    }
    
    return { success: false, message };
  }
}
