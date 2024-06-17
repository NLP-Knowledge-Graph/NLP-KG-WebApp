import { TRPCError } from "@trpc/server";
import {
  bookmarkModel,
  bookmarklistModel,
  collaborationModel,
} from "~/mongodb";
import { DeleteBookmarklistInput } from "~/schemas/bookmarklist.schema";

export const deleteBookmarklist = async (
  input: DeleteBookmarklistInput,
  userid: string
) => {
  const list = await bookmarklistModel().findOne(input);

  // Check if the bookmark list exists
  if (list === null)
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "List does not exist",
    });

  // Only the owner of the list can delete it
  if (list.userid !== userid)
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "Only the creator of this list can delete it",
    });

  // Delete everything associated to this list
  await bookmarklistModel().deleteOne(input);
  await bookmarkModel().deleteMany(input);
  await collaborationModel().deleteMany(input);
};
