import { betterAuth } from "better-auth";
import { createAuthMiddleware } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";
import { billing } from "./billing";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  hooks: {
    after: createAuthMiddleware(async (ctx) => {
      // idempotent assignment of free plan
      if (
        ctx.path.startsWith("/callback") || // google sign in
        ctx.path.startsWith("/sign-up") ||
        ctx.path.startsWith("/sign-in")
      ) {
        const userId = ctx.context.newSession?.user.id;
        if (userId) {
          try {
            const plan = await billing.assignFreePlan({
              userId,
            });
            console.log(`Assigned free plan to user ${userId}: ${plan?.id}`);
          } catch (error) {
            console.error(
              `Failed to assign free plan to user ${userId}: ${error}`,
            );
          }
        }
      }
    }),
  },
});
