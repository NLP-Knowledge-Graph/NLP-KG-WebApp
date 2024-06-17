import z from "zod";

export const updateProfileInput = z.object({
  username: z.string().min(1),
  openaikey: z.string().min(0).optional(),
  image: z.string().url().min(1).optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInput>;

export const profileOutput = z.object({
  userid: z.string(),
  username: z.string(),
  openaikey: z.string().optional(),
  image: z.string().optional(),
});

export const searchProfiles = z.object({
  query: z.string(),
  useridfilter: z.array(z.string()),
});

export type SearchProfiles = z.infer<typeof searchProfiles>;
