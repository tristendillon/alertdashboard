import { auth } from "./auth";
import { httpRouter, ROUTABLE_HTTP_METHODS } from "convex/server";
import { Hono } from "hono";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { ActionCtx, httpAction } from "./_generated/server";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { api } from "./_generated/api";

type Env = HonoWithConvex<ActionCtx>

const app = new Hono<Env>();

import { logger } from "hono/logger";
import stripAnsi from "strip-ansi";

app.use(
  "*",
  logger((...args) => {
    console.log(...args.map(stripAnsi));
  })
);

app.post(
  "/:organizationId/alerts",
  zValidator(
    "json",
    z.object({
      department: z.string(),
      mappedUnits: z.array(z.string()).optional(),
      mappedDescriptor: z.string().optional(),
      units: z.string(),
      descriptor: z.string(),
      cadDetails: z.string(),
      city: z.string(),
      state: z.string(),
      crossStreet: z.string(),
      address: z.string(),
      coordinates: z.object({
        latitude: z.number(),
        longitude: z.number()
      }),
      priority: z.string(),
      place: z.string(),
      date: z.number(),
    })
  ),
  async (c) => {
    const { organizationId } = c.req.param();
    const body = c.req.valid("json");
    await c.env.runMutation(api.alerts.createAlert, { ...body, organization: organizationId, modifiedAt: Date.now(), modifiedBy: "System" });
    return c.text("Sent message!");
  }
);


const http = httpRouter();
auth.addHttpRoutes(http);

// Then forward everything else to Hono
for (const routableMethod of ROUTABLE_HTTP_METHODS) {
  http.route({
    pathPrefix: "/",
    method: routableMethod,
    handler: httpAction(async (ctx, request: Request) => {
      // Skip auth routes that are already handled
      const url = new URL(request.url);
      if (url.pathname.startsWith("/.well-known/") ||
          url.pathname.startsWith("/api/auth/")) {
        // Return 404 to let the auth routes handle these
        return new Response("Not found", { status: 404 });
      }
      return await app.fetch(request, ctx);
    }),
  });
}

export default http;