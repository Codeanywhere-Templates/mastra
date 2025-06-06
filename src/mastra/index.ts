import { Mastra } from "@mastra/core/mastra";
import { createLogger } from "@mastra/core/logger";
import { weatherWorkflow } from "./workflows";
import { weatherAgent, activitiesAgent } from "./agents";

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent, activitiesAgent },
  logger: createLogger({
    name: "Mastra",
    level: "info",
  }),
});
