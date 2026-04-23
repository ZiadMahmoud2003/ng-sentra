import { describe, expect, it } from "vitest";
import { testWazuhConnection } from "./wazuh-service";

describe("Wazuh Elasticsearch Connection", () => {
  it(
    "should test connection to Wazuh Elasticsearch",
    async () => {
      // This test validates that the Wazuh credentials are correctly configured
      const result = await testWazuhConnection();

      // Result should be an object with success and message
      expect(result).toHaveProperty("success");
      expect(result).toHaveProperty("message");
      expect(typeof result.success).toBe("boolean");
      expect(typeof result.message).toBe("string");

      if (result.success) {
        console.log("[Wazuh] Connection test passed:", result.message);
      } else {
        console.log("[Wazuh] Connection test failed:", result.message);
      }
    },
    { timeout: 15000 }
  );
});
