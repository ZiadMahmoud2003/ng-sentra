import { checkAllModelsHealth } from "../server/ai-health-service";
import { getAllAiModels } from "../server/db";

async function main() {
  const models = await getAllAiModels();
  console.log("Found models:", models.map(m => m.slug));
  const results = await checkAllModelsHealth(
    models.map(m => ({ id: m.id, slug: m.slug, endpointUrl: m.endpointUrl }))
  );
  console.log("Health check results:", JSON.stringify(results, null, 2));
}

main().catch(console.error);
