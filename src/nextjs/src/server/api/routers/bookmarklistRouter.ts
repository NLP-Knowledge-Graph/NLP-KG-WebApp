import { authenticatedProcedure, createTRPCRouter, publicProcedure, } from "../trpc";
import { bookmarklistModel, bookmarkModel, collaborationModel, Profile, profileModel, } from "~/mongodb";
import { TRPCError } from "@trpc/server";
import {
  bookmarklistOutput,
  createBookmarklistInput,
  deleteBookmarklistInput,
  updateBookmarklistInput,
  updateBookmarklistNotesInput,
} from "~/schemas/bookmarklist.schema";
import { z } from "zod";
import { read } from "~/server/services/neo4jConnection";
import { Field, PublicationSearch, Venue } from "~/utils";
import { env } from "~/env.cjs";
import { bookmarkOutput } from "~/schemas/bookmark.schema";
import { profileOutput } from "~/schemas/profile.schema";
import { observable } from "@trpc/server/observable";
import { EventEmitter } from "events";
import type TypedEmitter from "typed-emitter";
import { deleteBookmarklist } from "~/server/services/bookmarklist.service";

type NotesChange = { listid: string; notes: string; users: Profile[] };
type NotesWatchState = Map<string, Profile[]>; // bookmarklist -> userid[]
type ChangeEvents = {
  change: (input: NotesChange) => void;
};

const globalForBM = globalThis as unknown as {
  notesWatchState: NotesWatchState | undefined;
  bmNotesChangeEmitter: TypedEmitter<ChangeEvents> | undefined;
};

// State includes all currently watching users of a given list
const notesWatchState =
  globalForBM.notesWatchState ?? new Map<string, Profile[]>();

const bmNotesChangeEmitter =
  globalForBM.bmNotesChangeEmitter ??
  (new EventEmitter() as TypedEmitter<ChangeEvents>);

if (env.NODE_ENV !== "production") {
  globalForBM.notesWatchState = notesWatchState;
  globalForBM.bmNotesChangeEmitter = bmNotesChangeEmitter;
}

export const bookmarklistRouter = createTRPCRouter({
  // Load all bookmarklists of user
  all: authenticatedProcedure
    .output(bookmarklistOutput.array())
    .query(async ({ ctx }) => {
      const lists = await bookmarklistModel().find({
        userid: ctx.session.user.id,
      });

      // Additionally load all accepted invitations to other lists
      const collaborations = await collaborationModel().find({
        userid: ctx.session.user.id,
        status: "accepted",
      });

      // Get the bookmark list info of previously fetched lists
      const collabLists = await bookmarklistModel().find({
        listid: collaborations.map((c) => c.listid),
      });

      return [...lists, ...collabLists];
    }),
  // Create a new bookmark list
  create: authenticatedProcedure
    .input(createBookmarklistInput)
    .output(bookmarklistOutput)
    .mutation(async ({ ctx, input }) => {
      const list = await bookmarklistModel().create({
        userid: ctx.session.user.id,
        ...input,
      });

      return list;
    }),
  // Update the bookmark lists' name
  updateName: authenticatedProcedure
    .input(updateBookmarklistInput)
    .output(bookmarklistOutput)
    .mutation(async ({ ctx, input: { listid, ...rest } }) => {
      const list = await bookmarklistModel().findOne({
        listid,
      });

      // Verify that the list exists
      if (list === null)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "List does not exist",
        });

      const collaborations = await collaborationModel().find({
        listid,
        status: "accepted",
      });

      // Check whether the user has the proper rights to edit the list
      // Only the owner or collaborators can edit lists
      if (
        list.userid !== ctx.session.user.id &&
        !collaborations.map((c) => c.userid).includes(ctx.session.user.id)
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot modify this list",
        });

      list.set(rest);
      list.save();

      return list;
    }),
  // Update a list's notes
  updateNotes: authenticatedProcedure
    .input(updateBookmarklistNotesInput)
    .output(bookmarklistOutput)
    .mutation(async ({ ctx, input: { listid, notes } }) => {
      const list = await bookmarklistModel().findOne({
        listid,
      });

      // Verify that the list exists
      if (list === null)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "List does not exist",
        });

      const collaborations = await collaborationModel().find({
        listid,
        status: "accepted",
      });

      // Check whether the user has the proper rights to edit the list
      // Only the owner or collaborators can edit lists
      if (
        list.userid !== ctx.session.user.id &&
        !collaborations.map((c) => c.userid).includes(ctx.session.user.id)
      )
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "You cannot modify this list",
        });

      list.set({ notes });
      list.save();

      // Send a real-time event to instantly update all clients
      bmNotesChangeEmitter.emit("change", {
        listid: list.listid,
        notes: list.notes || '',
        users: notesWatchState.get(list.listid)!,
      });

      return list;
    }),
  // Delete a list
  delete: authenticatedProcedure
    .input(deleteBookmarklistInput)
    .mutation(async ({ ctx, input }) => {
      await deleteBookmarklist(input, ctx.session.user.id);
    }),
  // Toggle the public flag of a list
  togglePublic: authenticatedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      const list = await bookmarklistModel().findOne({
        listid: input,
      });

      // Verify that the list exists
      if (list === null)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "List does not exist",
        });

      // Only the owner of the list can make it public
      if (list.userid !== ctx.session.user.id)
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: "Only the owner can toggle this list's public state",
        });

      await bookmarklistModel().updateOne(
        { listid: input },
        { public: !list.public }
      );
    }),
  // Get data of a single list
  getByID: publicProcedure
    .input(z.string())
    .output(
      z
        .object({
          bookmarklist: bookmarklistOutput,
          bookmarks: bookmarkOutput.array(),
          collaborators: z
            .object({
              status: z.enum(["pending", "accepted", "declined"]),
              user: profileOutput,
            })
            .array(),
          publications: z.any().array(),
        })
        .nullable()
    )
    .query(async ({ ctx, input }) => {
      const bookmarklist = await bookmarklistModel().findOne({ listid: input });

      // Verify that the list exists
      if (bookmarklist === null) return null;

      const bookmarks = await bookmarkModel().find({ listid: input });
      const collaborations = await collaborationModel().find({ listid: input });
      const collabProfiles = await profileModel().find({
        userid: collaborations.map((c) => c.userid),
      });

      // Don't show list to user if it is not public and user is not owner or collaborator
      if (!bookmarklist.public) {
        if (ctx.session === null)
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You must be logged in to see this list",
          });

        if (
          bookmarklist.userid !== ctx.session.user.id &&
          !collaborations.map((c) => c.userid).includes(ctx.session.user.id)
        )
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "You are not allowed to view this bookmark list",
          });
      }

      // Load publication data from neo4j
      const publicationsCypher = `MATCH (p:Publication)
      WHERE elementId(p) IN $idList
      WITH p
      MATCH (p)-[:HAS_FIELD_OF_STUDY]-(f)
      WITH p, COLLECT(DISTINCT f) AS fields
      MATCH (p)-[:PUBLISHED_AT]-(venue)
      RETURN p AS publication, fields, venue`;
      const publicationsResult = await read(publicationsCypher, {
        idList: bookmarks.map((bm) => bm.publication),
      });

      const publications = publicationsResult.map((entry) => {
        return {
          ...entry.publication,
          properties: {
            ...JSON.parse(JSON.stringify(entry.publication.properties)),
          },
          fields: JSON.parse(JSON.stringify(entry.fields)) as Field[],
          venue: JSON.parse(JSON.stringify(entry.venue)) as Venue,
        } as PublicationSearch;
      });

      return {
        bookmarklist,
        bookmarks,
        collaborators: collaborations.map((c) => {
          const user = collabProfiles.find((p) => p.userid === c.userid)!;
          return {
            user,
            status: c.status,
          };
        }),
        publications,
      };
    }),
  // Real-time Websocket connection for listening to changes on a bookmark list
  subscribeNotes: publicProcedure
    .input(z.object({ userid: z.string().optional(), listid: z.string() }))
    .subscription(async ({ input }) => {
      if (input.userid === undefined)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown user. Cannot establish websocket connection.",
        });

      const user = await profileModel().findOne({ userid: input.userid });

      if (user === null)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unknown user. Cannot establish websocket connection.",
        });

      const bookmarklist = await bookmarklistModel().findOne({
        listid: input.listid,
      });

      // Verify that the list exists
      if (bookmarklist === null)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Unknown bookmark list. Cannot establish websocket connection.",
        });

      // Real-time Websocket connection for listening to changes on a bookmark list
      return observable<NotesChange, string>(({ next }) => {
        const watchingUsers = notesWatchState.get(input.listid);
        notesWatchState.set(input.listid, [...(watchingUsers ?? []), user]);

        const onChange = (change: NotesChange) => {
          // Only send notification to users watching the same list
          if (
            change.listid === input.listid &&
            change.users.some((u) => u.userid === input.userid)
          )
            next(change);
        };

        bmNotesChangeEmitter.on("change", onChange);

        bmNotesChangeEmitter.emit("change", {
          listid: input.listid,
          notes: bookmarklist.notes || '',
          users: notesWatchState.get(input.listid)!,
        });

        return () => {
          bmNotesChangeEmitter.off("change", onChange);

          const watchingUsers = notesWatchState.get(input.listid);
          notesWatchState.set(
            input.listid,
            (watchingUsers ?? []).filter((u) => u.userid !== input.userid)
          );

          bmNotesChangeEmitter.emit("change", {
            listid: input.listid,
            notes: bookmarklist.notes || '',
            users: notesWatchState.get(input.listid)!,
          });
        };
      });
    }),
});