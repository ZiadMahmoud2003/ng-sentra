import { getWazuhSettings } from "./db";

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
 * Fetch recent alerts from Wazuh Elasticsearch
 */
export async function fetchWazuhAlerts(limit: number = 50): Promise<WazuhAlert[]> {
  try {
    const settings = await getWazuhSettings();
    
    if (!settings?.elasticsearchUrl) {
      throw new Error("Wazuh Elasticsearch URL not configured");
    }

    const url = new URL("/_search", settings.elasticsearchUrl);
    
    const query = {
      size: limit,
      sort: [{ timestamp: { order: "desc" } }],
      query: {
        match_all: {},
      },
    };

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    // Add basic auth if credentials are provided
    if (settings.elasticsearchUsername && settings.elasticsearchPassword) {
      const auth = Buffer.from(
        `${settings.elasticsearchUsername}:${settings.elasticsearchPassword}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    }

    const response = await fetch(url.toString(), {
      method: "POST",
      headers,
      body: JSON.stringify(query),
    });

    if (!response.ok) {
      throw new Error(`Elasticsearch error: ${response.statusText}`);
    }

    const data = await response.json() as any;
    const hits = data.hits?.hits || [];

    return hits.map((hit: any) => {
      const source = hit._source || {};
      return {
        id: hit._id,
        timestamp: source.timestamp || new Date().toISOString(),
        rule_id: source.rule?.id || "unknown",
        rule_description: source.rule?.description || "Unknown Rule",
        severity: source.rule?.level || 0,
        agent_id: source.agent?.id || "unknown",
        agent_name: source.agent?.name || "Unknown Agent",
        source_ip: source.source?.ip,
        destination_ip: source.destination?.ip,
        action: source.action || "unknown",
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

    const url = new URL("/_cluster/health", settings.elasticsearchUrl);
    
    const headers: Record<string, string> = {};

    if (settings.elasticsearchUsername && settings.elasticsearchPassword) {
      const auth = Buffer.from(
        `${settings.elasticsearchUsername}:${settings.elasticsearchPassword}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
      console.log("[Wazuh] Using authentication with username:", settings.elasticsearchUsername);
    } else {
      console.log("[Wazuh] No authentication configured");
    }

    console.log("[Wazuh] Sending request to:", url.toString());
    
    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    console.log("[Wazuh] Response status:", response.status, response.statusText);

    if (response.ok) {
      const data = await response.json() as any;
      const message = `Connected successfully. Cluster status: ${data.status}`;
      console.log("[Wazuh]", message);
      return { success: true, message };
    } else {
      const errorText = await response.text();
      const message = `HTTP ${response.status}: ${errorText.substring(0, 100)}`;
      console.error("[Wazuh] Connection failed:", message);
      return { success: false, message };
    }
  } catch (error: any) {
    console.error("[Wazuh] Connection test failed:", error);
    
    // Provide helpful error messages based on error type
    let message = "Unknown error";
    
    if (error?.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      message = "Connection timeout: Elasticsearch is not reachable. Check if the URL is correct and accessible from your network.";
    } else if (error?.code === 'ECONNREFUSED') {
      message = "Connection refused: Elasticsearch is not running or the port is incorrect.";
    } else if (error?.code === 'ENOTFOUND') {
      message = "DNS error: Cannot resolve the Elasticsearch hostname.";
    } else if (error?.message) {
      message = `Error: ${error.message}`;
    }
    
    return { success: false, message };
  }
}
