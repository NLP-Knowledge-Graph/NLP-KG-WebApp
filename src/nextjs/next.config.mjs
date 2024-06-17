/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
await import("./src/env.cjs");
import removeImports from "next-remove-imports";

/** @type {import("next").NextConfig} */
const config = removeImports()({
  reactStrictMode: true,
  images: {
    // formats: ["image/avif", "image/webp"],
      unoptimized: true,
      domains: [process.env.NEXTAUTH_URL],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
      // {
      //   protocol: "https",
      //   hostname: "avatars.githubusercontent.com",
      //   port: "",
      //   pathname: "/u/**",
      // },
      // {
      //   protocol: "https",
      //   hostname: "*.googleusercontent.com",
      //   port: "",
      //   pathname: "**",
      // },
      // {
      //   protocol: "https",
      //   hostname: "*.gravatar.com",
      //   port: "",
      //   pathname: "/avatar/**",
      // },
    ],
  },

  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  webpack: function (config) {
    config.resolve.fallback = { fs: false };
    config.module.rules.push({
      test: /\.md$/,
      use: "raw-loader",
    });

    return config;
  },
  publicRuntimeConfig: {
    FOS_ROOT_ID: process.env.FOS_ROOT_ID,
  },
});
export default config;
