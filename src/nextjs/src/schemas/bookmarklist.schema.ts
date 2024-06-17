import { z } from "zod";

export const bookmarklistOutput = z.object({
  userid: z.string(),
  listid: z.string(),
  name: z.string(),
  notes: z.string().optional(),
  public: z.boolean()
});

export const createBookmarklistInput = z.object({
  name: z.string().min(1),
});

export type CreateBookmarklistInput = z.infer<typeof createBookmarklistInput>;

export const updateBookmarklistInput = createBookmarklistInput.merge(
  z.object({
    listid: z.string(),
  })
);

export type UpdateBookmarklistInput = z.infer<typeof updateBookmarklistInput>;

export const updateBookmarklistNotesInput = z.object({
  listid: z.string(),
  notes: z.string().optional()
});

export type UpdateBookmarklistNotesInput = z.infer<typeof updateBookmarklistNotesInput>;

export const deleteBookmarklistInput = z.object({
  listid: z.string().min(1),
});

export type DeleteBookmarklistInput = z.infer<typeof deleteBookmarklistInput>;
