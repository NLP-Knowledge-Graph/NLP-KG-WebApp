import { createTRPCRouter } from "~/server/api/trpc";
import { pageRouter } from "./routers/pageRouter";
import { searchRouter } from "./routers/searchRouter";
import { profileRouter } from "./routers/profileRouter";
import { bookmarklistRouter } from "./routers/bookmarklistRouter";
import { bookmarkRouter } from "./routers/bookmarkRouter";
import { GetServerSidePropsContext } from "next";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { getServerAuthSession } from "../auth";
import SuperJSON from "superjson";
import { collaborationRouter } from "./routers/collaborationRouter";
import { chatRouter } from "./routers/chatRouter";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  page: pageRouter,
  search: searchRouter,
  profile: profileRouter,
  bookmarklist: bookmarklistRouter,
  bookmark: bookmarkRouter,
  collaboration: collaborationRouter,
  chat: chatRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createSSRHelpers = async (context: GetServerSidePropsContext) => {
  return createServerSideHelpers({
    router: appRouter,
    ctx: { session: await getServerAuthSession(context) },
    transformer: SuperJSON, // optional - adds superjson serialization
  });
};
