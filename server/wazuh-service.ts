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
 * Test Wazuh Elasticsearch connection
 */
export async function testWazuhConnection(): Promise<boolean> {
  try {
    const settings = await getWazuhSettings();
    
    if (!settings?.elasticsearchUrl) {
      return false;
    }

    const url = new URL("/_cluster/health", settings.elasticsearchUrl);
    
    const headers: Record<string, string> = {};

    if (settings.elasticsearchUsername && settings.elasticsearchPassword) {
      const auth = Buffer.from(
        `${settings.elasticsearchUsername}:${settings.elasticsearchPassword}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${auth}`;
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
    });

    return response.ok;
  } catch (error) {
    console.error("[Wazuh] Connection test failed:", error);
    return false;
  }
}
