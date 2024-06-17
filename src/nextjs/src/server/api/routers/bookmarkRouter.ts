import {authenticatedProcedure, createTRPCRouter} from "../trpc";
import {Bookmark, bookmarkModel} from "~/mongodb";
import {bookmarkOutput, createBookmarkInput, removeBookmarkFromListInput,} from "~/schemas/bookmark.schema";
import {z} from "zod";

export const bookmarkRouter = createTRPCRouter({
  lists: authenticatedProcedure.input(z.string()).query(async ({ input }) => {
    // Return all lists
    const lists = await bookmarkModel().find({ publication: input });

    return lists.map((l) => l.listid);
  }),
  modify: authenticatedProcedure
    .input(createBookmarkInput)
    .output(bookmarkOutput.array())
    .mutation(async ({ input }) => {
      // Modify a single list
      const bookmarks = await bookmarkModel().find({
        publication: input.publication,
      });

      // First calculate the changes, what gets added, what gets removed
      const currentLists = bookmarks.map((bm) => bm.listid);
      const removedBMs = bookmarks.filter(
        (l) => !input.listids.includes(l.listid)
      );
      const addedBMs = input.listids.filter((id) => !currentLists.includes(id));

      // Apply the changes
      await bookmarkModel().deleteMany({
          publication: input.publication,
          listid: {$in: removedBMs.map((bm) => bm.listid)},
      });


      const newbookmarks: Bookmark[] = [];
      for (const bm of addedBMs) {
        newbookmarks.push(
          await bookmarkModel().create({
            listid: bm,
            publication: input.publication,
          })
        );
      }
      return newbookmarks;
    }),
  removeFromList: authenticatedProcedure
    .input(removeBookmarkFromListInput)
    .mutation(async ({ input }) => {
      await bookmarkModel().deleteOne(input);
    }),
});
