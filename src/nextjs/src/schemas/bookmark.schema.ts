import { z } from "zod";

export const bookmarkOutput = z.object({
  publication: z.string(),
  listid: z.string(),
});

export const createBookmarkInput = z.object({
  publication: z.string(),
  listids: z.string().array(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkInput>;

export const removeBookmarkFromListInput = z.object({
  publication: z.string(),
  listid: z.string(),
});

export type RemoveBookmarkFromListInput = z.infer<typeof removeBookmarkFromListInput>;
