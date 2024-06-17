import { z } from "zod";

export const removeCollaboratorFromListInput = z.object({
  listid: z.string(),
  userid: z.string(),
});

export type RemoveCollaboratorFromListInput = z.infer<
  typeof removeCollaboratorFromListInput
>;

export const createCollaborationInvitesInput = z.object({
  listid: z.string(),
  users: z.array(z.string()),
});

export type CreateCollaborationInvitesInput = z.infer<
  typeof createCollaborationInvitesInput
>;

export const resolveInviteInput = z.object({
  listid: z.string(),
  status: z.enum(["accepted", "declined"]),
});
