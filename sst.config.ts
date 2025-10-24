/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "alertdashboard",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: ["production"].includes(input?.stage),
      home: "aws",
      providers: { "azure-native": "3.8.0", azure: "6.28.0" },
    };
  },
  async run() {
    const infra = await import("./infra");
    const resources = {
      ...infra.functions.resources,
      ...infra.libs.resources,
      ...infra.apps.resources,
      ...infra.storage.resources,
    };
    // Return outputs for easy access
    return resources;
  },
});
