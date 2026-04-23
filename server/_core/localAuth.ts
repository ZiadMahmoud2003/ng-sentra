import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { ENV } from "./env";
import { sdk } from "./sdk";

export function registerLocalAuthRoutes(app: Express) {
  app.get("/api/local-auth/login", async (req: Request, res: Response) => {
    if (!ENV.localAuthEnabled) {
      res.status(404).json({ error: "Local auth mode is disabled" });
      return;
    }

    try {
      try {
        await db.upsertUser({
          openId: ENV.localAuthOpenId,
          name: ENV.localAuthName,
          email: ENV.localAuthEmail,
          role: ENV.localAuthRole as any,
          loginMethod: "local",
          lastSignedIn: new Date(),
        });
      } catch (error) {
        // Local mode should still allow sign-in even when DB is unavailable.
        console.warn("[LocalAuth] Could not persist local user, continuing with session only", error);
      }

      const sessionToken = await sdk.createSessionToken(ENV.localAuthOpenId, {
        name: ENV.localAuthName,
        expiresInMs: ONE_YEAR_MS,
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.redirect(302, "/");
    } catch (error) {
      console.error("[LocalAuth] Login failed", error);
      res.status(500).json({ error: "Local login failed" });
    }
  });
}
