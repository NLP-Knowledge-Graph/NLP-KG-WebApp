import { TRPCError } from "@trpc/server";
import { authenticatedProcedure, createTRPCRouter } from "../trpc";
import { bookmarklistModel, collaborationModel } from "~/mongodb";
import {
  createCollaborationInvitesInput,
  removeCollaboratorFromListInput,
  resolveInviteInput,
} from "~/schemas/collaboration.schema";
import { z } from "zod";

export const collaborationRouter = createTRPCRouter({
  // Remote a collaborator / invite from a bookmark list
  removeFromList: authenticatedProcedure
    .input(removeCollaboratorFromListInput)
    .mutation(async ({ input }) => {
      await collaborationModel().deleteOne(input);
    }),
  // Get all open invitations of the requesting user
  getInvitations: authenticatedProcedure.query(async ({ ctx }) => {
    const invitations = await collaborationModel().find({
      userid: ctx.session.user.id,
      status: "pending",
    });
    const lists = await bookmarklistModel().find({
      listid: invitations.map((i) => i.listid),
    });

    return invitations.map((i) => {
      const list = lists.find((l) => l.listid === i.listid)!;
      return {
        list,
        userid: i.userid,
      };
    });
  }),
  // Accept or decline an invite
  resolveInvite: authenticatedProcedure
    .input(resolveInviteInput)
    .mutation(async ({ ctx, input }) => {
      await collaborationModel().updateOne(
        { listid: input.listid, userid: ctx.session.user.id },
        { status: input.status }
      );
    }),
  // Create a new collaboration invitation to a bookmark list
  createInvites: authenticatedProcedure
    .input(createCollaborationInvitesInput)
    .mutation(async ({ ctx, input }) => {
      const bookmarklist = await bookmarklistModel().findOne({
        listid: input.listid,
      });

      if (bookmarklist === null)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Bookmarklist does not exist",
        });

      if (bookmarklist.userid !== ctx.session.user.id)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only owner of the list can add more collaborators",
        });

      const invites = await collaborationModel().find({ listid: input.listid });

      if (invites.some((i) => input.users.includes(i.userid)))
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Some users have already been invited",
        });

      await Promise.all(
        input.users.map((userid) =>
          collaborationModel().create({
            listid: input.listid,
            userid,
            status: "pending",
          })
        )
      );
    }),
});
