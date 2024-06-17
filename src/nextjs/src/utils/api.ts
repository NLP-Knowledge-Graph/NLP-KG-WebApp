/**
 * This is the client-side entrypoint for your tRPC API. It is used to create the `api` object which
 * contains the Next.js App-wrapper, as well as your type-safe React Query hooks.
 *
 * We also create a few inference helpers for input and output types.
 */
import {createWSClient, httpBatchLink, loggerLink, splitLink, wsLink,} from "@trpc/client";
import {createTRPCNext} from "@trpc/next";
import {type inferRouterInputs, type inferRouterOutputs} from "@trpc/server";
import {type NextPageContext} from "next";
import superjson from "superjson";
import {type AppRouter} from "~/server/api/root";

// This has to be the last import, otherwise the Env variables won't be loaded properly
/* eslint-disable import/order */
import {env} from "~/env.cjs";

const getBaseHttpURL = () => {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (env.NEXT_PUBLIC_URL) return env.NEXT_PUBLIC_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`; // dev SSR should use localhost
};

const createHttpBatchLink = (ctx: NextPageContext | undefined) => {
  return httpBatchLink({
    url: `${getBaseHttpURL()}/api/trpc`,
    headers() {
      if (!ctx?.req?.headers) {
        return {};
      }
      // on ssr, forward client's headers to the server
      return {
        ...ctx.req.headers,
        "x-ssr": "1",
      };
    },
  });
};

const getBaseWsURL = () => {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}${window.location.port ? ':' + window.location.port : ''}/ws`;
};

const createWSLink = () => {
  const client = createWSClient({
    url: getBaseWsURL(),
  });
  return wsLink<AppRouter>({
    client,
  });
};

function getEndingLink(ctx: NextPageContext | undefined) {
  if (typeof window === "undefined") return createHttpBatchLink(ctx);

  return splitLink({
    condition: (operation) => operation.type === "subscription",
    true: createWSLink(),
    false: createHttpBatchLink(ctx),
  });
}

/** A set of type-safe react-query hooks for your tRPC API. */
export const api = createTRPCNext<AppRouter>({
  config({ ctx }) {
    return {
      /**
       * Transformer used for data de-serialization from the server.
       *
       * @see https://trpc.io/docs/data-transformers
       */
      transformer: superjson,

      /**
       * Links used to determine request flow from client to server.
       *
       * @see https://trpc.io/docs/links
       */
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),

        getEndingLink(ctx),
      ],
      queryClientConfig: {
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            refetchIntervalInBackground: false,
            retry: 1,
          },
        },
      },
    };
  },
  /**
   * Whether tRPC should await queries when server rendering pages.
   *
   * @see https://trpc.io/docs/nextjs#ssr-boolean-default-false
   */
  ssr: false,
});

/**
 * Inference helper for inputs.
 *
 * @example type HelloInput = RouterInputs['example']['hello']
 */
export type RouterInputs = inferRouterInputs<AppRouter>;

/**
 * Inference helper for outputs.
 *
 * @example type HelloOutput = RouterOutputs['example']['hello']
 */
export type RouterOutputs = inferRouterOutputs<AppRouter>;
