import { auth } from "./auth";
import { httpRouter, ROUTABLE_HTTP_METHODS } from "convex/server";
import { Hono } from "hono";
import { HonoWithConvex } from "convex-helpers/server/hono";
import { ActionCtx, httpAction } from "./_generated/server";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";
import { api, internal } from "./_generated/api";

const app: HonoWithConvex<ActionCtx> = new Hono();

import { logger } from "hono/logger";
import stripAnsi from "strip-ansi";
import { Id } from "./_generated/dataModel";
import { hasPermission } from "../lib/permissions";

app.use(
  "*",
  logger((...args) => {
    console.log(...args.map(stripAnsi));
  })
);

app.post(
  "/:organizationId/:departmentId/:integration/alerts",
  zValidator(
    "json",
    z.object({
      units: z.string(),
      descriptor: z.string(),
      cadDetails: z.string(),
      cadId: z.string(),
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
    const { key } = c.req.query();

    if (!key) {
      return c.json({ error: "Missing API key" }, 401);
    }

    const { organizationId, departmentId, integration } = c.req.param();

    let mappedDescriptor: Id<"descriptors"> | undefined;
    const mappedUnits: Id<"units">[] = [];
    let units: string[] = [];
    let descriptor: string | undefined;


    switch (integration) {
      case "ACTIVE911":
        units = c.req.valid("json").units.split(" ").map(unit => unit.trim()).filter(unit => unit !== "");
        descriptor = c.req.valid("json").descriptor;
        break;
      default:
        return c.json({ error: "Invalid integration" }, 400);
    }

    if (!organizationId) {
      return c.json({ error: "Missing organizationId" }, 400);
    }

    if (!departmentId) {
      return c.json({ error: "Missing departmentId" }, 400);
    }

    let departmentIdExistsPromise: Promise<boolean>;
    if (departmentId === "ALL") {
      departmentIdExistsPromise = Promise.resolve(true);
    } else {
      departmentIdExistsPromise = c.env.runQuery(internal.organizationSchema.departments.departmentExist, { id: departmentId as Id<"departments"> });
    }
    const organizationIdExistsPromise = c.env.runQuery(internal.organizationSchema.organizations.organizationExist, { id: organizationId as Id<"organizations"> });

    const [departmentIdExists, organizationIdExists] = await Promise.all([
      departmentIdExistsPromise,
      organizationIdExistsPromise,
    ]);

    // We let there exist and ALL departmentId for large scale integrations who might not want to
    // Have each department use a different url for their alert API.
    if (!departmentIdExists) {
      return c.json({ error: "Department not found" }, 404);
    }

    if (!organizationIdExists) {
      return c.json({ error: "Organization not found" }, 404);
    }

    const mappableDescriptorsPromise = c.env.runQuery(internal.configurationSchema.descriptors.mappableDescriptors, { organization: organizationId as Id<"organizations"> });
    const mappableUnitsPromise = c.env.runQuery(internal.configurationSchema.units.mappableUnits, { organization: organizationId as Id<"organizations"> });

    const [mappableDescriptors, mappableUnits] = await Promise.all([
      mappableDescriptorsPromise,
      mappableUnitsPromise
    ]);

    const descriptorId = mappableDescriptors.find(d => d.cadDescriptor === descriptor);
    if (descriptorId) {
      mappedDescriptor = descriptorId._id;
    }

    for (const unit of units) {
      const unitId = mappableUnits.find(u => u.cadUnit === unit);
      if (unitId) {
        mappedUnits.push(unitId._id);
      }
    }

    const body = c.req.valid("json");
    const alert = await c.env.runMutation(api.alerts.createAlertWithApiKey, {
      apiKey: key,
      organization: organizationId as Id<"organizations">,
      department: departmentId as Id<"departments">,
      alert: {
        ...body,
        mappedUnits,
        mappedDescriptor,
        department: departmentId as Id<"departments">,
        organization: organizationId as Id<"organizations">,
        modifiedAt: 0,
        modifiedBy: "System"
      },
    });
    return c.json({ status: "Created", alert }, 200);
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
