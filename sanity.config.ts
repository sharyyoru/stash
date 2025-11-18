import { defineConfig } from "sanity";
import { visionTool } from "@sanity/vision";
import { structureTool } from "sanity/structure";
import { schemaTypes } from "./src/sanity/schemaTypes";

const projectId =
  (process.env.NEXT_PUBLIC_SANITY_PROJECT_ID as string) || "1coje25j";
const dataset =
  (process.env.NEXT_PUBLIC_SANITY_DATASET as string) || "production";

export default defineConfig({
  name: "stash-studio",
  title: "Stash Studio",
  projectId,
  dataset,
  apiVersion: process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2025-01-01",
  basePath: "/studio",
  plugins: [structureTool(), visionTool()],
  schema: {
    types: schemaTypes,
  },
});
