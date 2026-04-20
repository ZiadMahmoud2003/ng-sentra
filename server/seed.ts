import { drizzle } from "drizzle-orm/mysql2";
import { components, soarApproaches, aiModels } from "../drizzle/schema";

async function seed() {
  const db = drizzle(process.env.DATABASE_URL!);

  // Seed 11 SOC components
  const componentData = [
    { name: "Wazuh", slug: "wazuh", description: "Core SIEM/XDR manager, indexer, and dashboard", icon: "Shield", category: "SIEM", port: 443 },
    { name: "Snort", slug: "snort", description: "Network IDS configured with custom routing rules", icon: "Eye", category: "IDS", port: 8080 },
    { name: "UFW", slug: "ufw", description: "Host-level firewall managing active packet blocking", icon: "Lock", category: "Firewall", port: null },
    { name: "T-Pot", slug: "tpot", description: "Honeypot network (Cowrie, Dionaea) with Kibana dashboard", icon: "Bug", category: "Honeypot", port: 64297 },
    { name: "Filebeat", slug: "filebeat", description: "Dedicated log shippers routing Snort, UFW, and Honeypot logs to Wazuh", icon: "FileText", category: "Log Shipper", port: 5044 },
    { name: "Anomaly Detection AI", slug: "anomaly-detection", description: "Background AI service detecting anomalies, pushing logs via Filebeat to Wazuh", icon: "Activity", category: "AI Model", port: 5001 },
    { name: "Alert Classification AI", slug: "alert-classification", description: "Background AI service classifying alerts, pushing logs via Filebeat to Wazuh", icon: "AlertTriangle", category: "AI Model", port: 5002 },
    { name: "UBA AI", slug: "uba-ai", description: "User Behavior Analytics AI running as a service, pushing logs to Wazuh", icon: "Users", category: "AI Model", port: 5003 },
    { name: "Local TI API", slug: "local-ti-api", description: "Master REST API handling threat intelligence flows (Waitress, port 5000)", icon: "Globe", category: "Threat Intel", port: 5000 },
    { name: "n8n SOAR", slug: "n8n-soar", description: "SOAR automation engine handling 5 distinct Incident Response approaches", icon: "Zap", category: "SOAR", port: 5678 },
    { name: "Digital Forensics Workstation", slug: "digital-forensics", description: "Specialized container with external evidence gathering and disk imaging tools", icon: "HardDrive", category: "Forensics", port: 8888 },
  ];

  for (const comp of componentData) {
    await db.insert(components).values(comp).onDuplicateKeyUpdate({ set: { description: comp.description } });
  }

  // Seed 5 SOAR IR approaches
  const soarData = [
    { name: "IP", slug: "ip", description: "Webhook-triggered IP-based incident response. Queries Local TI AI and sends HTML email report." },
    { name: "Behavior", slug: "behavior", description: "Shares the IP webhook. Uses UBA model with historical IP profiles including previous UFW actions." },
    { name: "File", slug: "file", description: "Webhook-triggered file analysis. Checks downloaded files in temp folder; dynamically deletes malicious files." },
    { name: "URL real-time", slug: "url-realtime", description: "Webhook-triggered real-time URL checking and blocking." },
    { name: "URL scheduled", slug: "url-scheduled", description: "Scheduled local URL analysis (non-real-time) without automated IR blocking." },
  ];

  for (const approach of soarData) {
    await db.insert(soarApproaches).values(approach).onDuplicateKeyUpdate({ set: { description: approach.description } });
  }

  // Seed 4 AI models
  const aiModelData = [
    { name: "Anomaly Detection", slug: "anomaly-detection", description: "Detects anomalous patterns in network and system behavior using ML algorithms." },
    { name: "Alert Classification", slug: "alert-classification", description: "Classifies security alerts by severity and type using trained classification models." },
    { name: "UBA", slug: "uba", description: "User Behavior Analytics — profiles user activity and detects insider threats." },
    { name: "Local Threat Intelligence", slug: "local-ti", description: "Master REST API providing local threat intelligence lookups and enrichment." },
  ];

  for (const model of aiModelData) {
    await db.insert(aiModels).values(model).onDuplicateKeyUpdate({ set: { description: model.description } });
  }

  console.log("✅ Seed complete: components, SOAR approaches, AI models inserted.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
