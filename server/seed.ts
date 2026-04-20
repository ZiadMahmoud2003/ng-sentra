import { drizzle } from "drizzle-orm/mysql2";
import { components, soarApproaches, aiModels } from "../drizzle/schema";

// Real infrastructure: IP 192.168.1.14, default ports
const HOST = "192.168.1.14";

async function seed() {
  const db = drizzle(process.env.DATABASE_URL!);

  // ── 6 actual SOC components (no AI model services, no DF Workstation) ──────
  const componentData = [
    {
      name: "Wazuh",
      slug: "wazuh",
      description: "Core SIEM/XDR — manager, indexer, and Kibana-based dashboard. Central alert hub receiving logs from Snort, UFW, Filebeat, and n8n.",
      icon: "Shield",
      category: "SIEM",
      url: `https://${HOST}`,
      port: 443,
      enabled: true,
    },
    {
      name: "Snort",
      slug: "snort",
      description: "Network IDS running inside the Wazuh Docker stack. Logs forwarded to Wazuh via snort_to_wazuh.py. No standalone web UI.",
      icon: "Eye",
      category: "IDS",
      url: null,       // CLI/log-only — no web UI
      port: null,
      enabled: true,
    },
    {
      name: "UFW",
      slug: "ufw",
      description: "Host-level firewall on the VirtualBox machine. Blocks IPs via SSH commands triggered by n8n IR workflows. No web UI.",
      icon: "Lock",
      category: "Firewall",
      url: null,       // CLI-only — no web UI
      port: null,
      enabled: true,
    },
    {
      name: "T-Pot",
      slug: "tpot",
      description: "Multi-honeypot platform (Cowrie, Dionaea, etc.) installed at /opt/tpotce. Includes Attack Map, Kibana, and SpiderFoot dashboards.",
      icon: "Bug",
      category: "Honeypot",
      url: `https://${HOST}:64297`,
      port: 64297,
      enabled: true,
    },
    {
      name: "Filebeat",
      slug: "filebeat",
      description: "Dedicated log shipper (v7.10.2 OSS) at /opt/filebeat-honeypot. Routes T-Pot honeypot logs directly to the Wazuh Indexer.",
      icon: "FileText",
      category: "Log Shipper",
      url: null,       // Background service — no web UI
      port: 5044,
      enabled: true,
    },
    {
      name: "n8n SOAR",
      slug: "n8n-soar",
      description: "SOAR automation engine at /opt/n8n-soc. Runs 5 IR workflows: IP, Behavior, File, URL real-time, and URL scheduled.",
      icon: "Zap",
      category: "SOAR",
      url: `http://${HOST}:5678`,
      port: 5678,
      enabled: true,
    },
  ];

  for (const comp of componentData) {
    await db.insert(components).values(comp).onDuplicateKeyUpdate({
      set: {
        description: comp.description,
        url: comp.url,
        port: comp.port,
        enabled: comp.enabled,
      },
    });
  }
  console.log("✅ Components seeded (6 real components)");

  // ── 5 SOAR IR Approaches (from NG-SENTRA.json analysis) ──────────────────
  const soarData = [
    {
      name: "IP",
      slug: "ip",
      description: "Webhook-triggered IP incident response. Queries Wazuh alerts, runs Local AI Brain for threat scoring, executes UFW block via SSH (incident_response.py), and sends HTML email report via Gemini AI.",
      webhookUrl: `http://${HOST}:5678/webhook/wazuh-realtime`,
      enabled: true,
    },
    {
      name: "Behavior",
      slug: "behavior",
      description: "Schedule-based behavioral analysis. Polls Wazuh every few seconds, enriches with UBA model (historical IP profiles + previous UFW actions), runs IR decision via SSH, and escalates to Gemini AI for report generation.",
      webhookUrl: null, // Schedule-triggered, no external webhook
      enabled: true,
    },
    {
      name: "File",
      slug: "file",
      description: "Webhook-triggered file analysis. Receives download events from Windows clients, scans with VirusTotal + Local AI Brain, dynamically deletes malicious files, and sends email alert with Gemini AI analysis.",
      webhookUrl: `http://${HOST}:5678/webhook/downloaded-file`,
      enabled: true,
    },
    {
      name: "URL real-time",
      slug: "url-realtime",
      description: "Real-time URL proxy scan. Browser/proxy sends POST to n8n webhook; checks VirusTotal + Local AI Brain; returns block/allow JSON response instantly. Pushes alert to Wazuh and sends email if malicious.",
      webhookUrl: `http://${HOST}:5678/webhook/url-scan`,
      enabled: true,
    },
    {
      name: "URL scheduled",
      slug: "url-scheduled",
      description: "Scheduled DNS log analysis (every 1 minute). Queries Wazuh Elasticsearch for DNS/HTTP hostnames from the last 6 hours, checks each domain against VirusTotal + Local AI Brain, and sends email reports for malicious findings.",
      webhookUrl: null, // Schedule-triggered (1-min interval), no external webhook
      enabled: true,
    },
  ];

  for (const approach of soarData) {
    await db.insert(soarApproaches).values(approach).onDuplicateKeyUpdate({
      set: {
        description: approach.description,
        webhookUrl: approach.webhookUrl,
        enabled: approach.enabled,
      },
    });
  }
  console.log("✅ SOAR approaches seeded (5 IR workflows)");

  // ── AI Models: reflect the actual AI integrations used inside n8n ─────────
  // These are not standalone services but AI integrations wired into n8n workflows
  const aiModelData = [
    {
      name: "Anomaly Detection",
      slug: "anomaly-detection",
      description: "Local AI Brain integrated in n8n IP/Behavior workflows. Uses Isolation Forest + behavioral baselines to score threat level (HIGH/MEDIUM/LOW) with confidence % and key indicators.",
      endpointUrl: `http://${HOST}:5000/analyze`,
      status: "unknown" as const,
    },
    {
      name: "Alert Classification",
      slug: "alert-classification",
      description: "Gemini 2.5 Flash AI integrated in n8n workflows. Generates professional HTML incident reports by synthesizing VirusTotal external data with Local AI internal scores. Detects zero-day vs known threats.",
      endpointUrl: "https://generativelanguage.googleapis.com",
      status: "unknown" as const,
    },
    {
      name: "UBA",
      slug: "uba",
      description: "User Behavior Analytics integrated in n8n Behavior workflow. Queries UBA service for historical IP profiles and previous UFW block actions to enrich behavioral incident response decisions.",
      endpointUrl: `http://${HOST}:5000/uba`,
      status: "unknown" as const,
    },
    {
      name: "Local Threat Intelligence",
      slug: "local-ti",
      description: "Local AI Brain REST API (Waitress server). Central AI hub called by IP, File, URL real-time, and URL scheduled workflows. Returns threat_level, confidence, reason, feature_highlights, and cross_flow_analysis.",
      endpointUrl: `http://${HOST}:5000`,
      status: "unknown" as const,
    },
  ];

  for (const model of aiModelData) {
    await db.insert(aiModels).values(model).onDuplicateKeyUpdate({
      set: {
        description: model.description,
        endpointUrl: model.endpointUrl,
      },
    });
  }
  console.log("✅ AI models seeded (4 n8n-integrated AI services)");

  console.log("\n🎯 Seed complete — NG-SENTRA configured for 192.168.1.14");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
