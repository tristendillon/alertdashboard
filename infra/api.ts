import { alertsTable, syncMetadataTable } from "./storage";

/**
 * API Gateway for webhooks and REST endpoints
 * Will be used for Active911 webhooks and future API features
 */
export const api = new sst.aws.ApiGatewayV2("AlertDashboardApi");

/**
 * Webhook endpoint for Active911 alerts
 * TODO: Implement handler in packages/functions/api/
 */
api.route("POST /webhooks/active911", {
  handler: "packages/functions/api/src/webhooks/active911.handler",
  link: [alertsTable, syncMetadataTable],
});

/**
 * Health check endpoint
 */
api.route("GET /health", {
  handler: "packages/functions/api/src/health.handler",
});
