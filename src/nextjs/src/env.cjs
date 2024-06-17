const { z } = require("zod");
const { createEnv } = require("@t3-oss/env-nextjs");

const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    STARTING_STATIC_PAGES: z.number(), // How many pages to load at starttime
    REVALIDATE_INTERVAL: z.number(), // Fetch new data every 1 week = 604800 seconds

    // ---------------------------------------------------------------- //

    NODE_ENV: z.enum(["development", "test", "production"]),
    FOS_ROOT_ID: z.string(),
    BACKEND_URI: z.string(),
    DATABASE_URI: z.string(),
    DATABASE_USERNAME: z.string(),
    DATABASE_PASSWORD: z.string(),
    MONGODB_URL: z.string().url(),
    NEXTAUTH_SECRET: z.string(),
    NEXTAUTH_URL: z.string(),
    GITHUB_ID: z.string().optional(),
    GITHUB_SECRET: z.string().optional(),
    GOOGLE_ID: z.string().optional(),
    GOOGLE_SECRET: z.string().optional(),
    LINKEDIN_ID: z.string().optional(),
    LINKEDIN_SECRET: z.string().optional(),
    GITLAB_ID: z.string().optional(),
    GITLAB_SECRET: z.string().optional(),
    GITLAB_SERVER: z.string().optional(),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_URL: z.string(),
    NEXT_PUBLIC_WS_URL: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    STARTING_STATIC_PAGES: process.env.STARTING_STATIC_PAGES,
    REVALIDATE_INTERVAL: process.env.REVALIDATE_INTERVAL,
    // ---------------------------------------------------------------- //
    NODE_ENV: process.env.NODE_ENV,
    FOS_ROOT_ID: process.env.FOS_ROOT_ID,
    BACKEND_URI: process.env.BACKEND_URI,
    DATABASE_URI: process.env.DATABASE_URI,
    DATABASE_USERNAME: process.env.DATABASE_USERNAME,
    DATABASE_PASSWORD: process.env.DATABASE_PASSWORD,
    MONGODB_URL: process.env.MONGODB_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
    NEXT_PUBLIC_WS_URL: process.env.NEXT_PUBLIC_WS_URL,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    GOOGLE_ID: process.env.GOOGLE_ID,
    GOOGLE_SECRET: process.env.GOOGLE_SECRET,
    LINKEDIN_ID: process.env.LINKEDIN_ID,
    LINKEDIN_SECRET: process.env.LINKEDIN_SECRET,
    GITLAB_ID: process.env.GITLAB_ID,
    GITLAB_SECRET: process.env.GITLAB_SECRET,
    GITLAB_SERVER: process.env.GITLAB_SERVER,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation.
   * This is especially useful for Docker builds.
   */
  skipValidation: true,
});

module.exports = {
  env
}