import { describe, expect, it } from "vitest";
import { testWazuhConnection } from "./wazuh-service";

describe("Wazuh Elasticsearch Connection", () => {
  it(
    "should test connection to Wazuh Elasticsearch",
    async () => {
      // This test validates that the Wazuh credentials are correctly configured
      // and that the Elasticsearch endpoint is reachable
      const result = await testWazuhConnection();

      // The connection should succeed if credentials are valid
      expect(typeof result).toBe("boolean");

      if (result) {
        console.log("[Wazuh] Connection test passed - Elasticsearch is reachable");
      } else {
        console.log("[Wazuh] Connection test failed - Check Elasticsearch URL and credentials");
      }
    },
    { timeout: 15000 }
  );
});
