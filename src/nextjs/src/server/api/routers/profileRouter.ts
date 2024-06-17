import {
  profileOutput,
  searchProfiles,
  updateProfileInput,
} from "~/schemas/profile.schema";
import { authenticatedProcedure, createTRPCRouter } from "../trpc";
import { bookmarklistModel, chatHistoryModel, client, profileModel } from "~/mongodb";
import { TRPCError } from "@trpc/server";
import { ObjectId } from "mongodb";
import { deleteBookmarklist } from "~/server/services/bookmarklist.service";

export const profileRouter = createTRPCRouter({
  // Get currently logged in profile
  get: authenticatedProcedure.output(profileOutput).query(async ({ ctx }) => {
    const profile = await profileModel().findOne({
      userid: ctx.session.user.id,
    });

    // Check if it exists
    if (profile === null)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "You have no profile",
      });

    return profile;
  }),
  // Update currently logged in profile
  update: authenticatedProcedure
    .input(updateProfileInput)
    .output(profileOutput)
    .mutation(async ({ ctx, input }) => {
      const profile = await profileModel().findOne({
        userid: ctx.session.user.id,
      });

    // Check if it exists
      if (profile === null)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "You have no profile",
        });

      profile.username = input.username;
      profile.openaikey = input.openaikey;
      profile.image = input.image;
      profile.save();

      return profile;
    }),
  // Search for profiles according to their id or their username
  search: authenticatedProcedure
    .input(searchProfiles)
    .query(async ({ ctx, input }) => {
      const profiles = await profileModel().find({
        $or: [
          { username: { $regex: ".*" + input.query + ".*" } },
          { userid: { $regex: ".*" + input.query + ".*" } },
        ],
        userid: { $nin: [...input.useridfilter, ctx.session.user.id] },
      });

      return profiles.map((p) => ({
        userid: p.userid,
        username: p.username,
        image: p.image,
      }));
    }),
  // Delete currently logged in user
  delete: authenticatedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.user.id;
    const profile = await profileModel().findOne({ userid: userId });

    if (profile === null)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          "You have no profile, cannot delete account. Please contact admin",
      });

    await profileModel().deleteOne({ userid: userId });

    // Also delete all bookmarklists of that user
    const bookmarklists = await bookmarklistModel().find({ userid: userId });

    await Promise.all(
      bookmarklists.map(
        (list) => deleteBookmarklist({ listid: list.listid }, userId)
      )
    );

    await chatHistoryModel().deleteMany({userid: userId});

    const db = (await client).db();
    await db.collection("sessions").deleteOne({ userId: new ObjectId(userId) });
    await db.collection("accounts").deleteOne({ userId: new ObjectId(userId) });
    await db.collection("users").deleteOne({ _id: new ObjectId(userId) });
  }),
});
