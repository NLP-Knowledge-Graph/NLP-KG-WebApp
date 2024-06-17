import { z } from "zod";

// Schema for output data of ChatHistory
export const chatHistoryOutput = z.object({
  chatid: z.string(),
  name: z.string(),
  type: z.string(),
  date: z.date(),
  message: z.array(
    z.object({
      text: z.string(),
      sender: z.enum(["bot", "system", "user"]),
      conceptFromOpenApi: z.string().optional(),
      publicationTitles: z.array(z.string()).optional(),
      publicationIds: z.array(z.string()).optional(),
      publications: z.array(z.string()).optional(), 
    })
  ),
});

// Type for ChatHistory output
export type ChatHistoryOutput = z.infer<typeof chatHistoryOutput>;

// Schema for creating a new ChatHistory entry
export const createChatHistoryInput = z.object({
  name: z.string(),
  date: z.date(),
  type: z.string(),
  message: z.array(
    z.object({
      text: z.string(),
      sender: z.string(),
      conceptFromOpenApi: z.string().optional(),
      publicationTitles: z.array(z.string()).optional(),
      publicationIds: z.array(z.string()).optional(), 
      publications: z.array(z.string()).optional(), 
    })
  ),
});

// Type for CreateChatHistory input
export type CreateChatHistoryInput = z.infer<typeof createChatHistoryInput>;

// Schema for updating a ChatHistory entry
export const updateChatHistoryInput = z.object({
  chatid: z.string(),
  type: z.string(),
  name: z.string(),
  date: z.date(),
  message: z.array(
    z.object({
      text: z.string(),
      sender: z.string(),
      conceptFromOpenApi: z.string().optional(),
      publicationTitles: z.array(z.string()).optional(),
      publicationIds: z.array(z.string()).optional(), 
      publications: z.array(z.string()).optional(), 
    })
  ),
});

// Type for UpdateChatHistory input
export type UpdateChatHistoryInput = z.infer<typeof updateChatHistoryInput>;

// Schema for deleting a ChatHistory entry
export const deleteChatHistoryInput = z.object({
  chatid: z.string(),
});

// Type for DeleteChatHistory input
export type DeleteChatHistoryInput = z.infer<typeof deleteChatHistoryInput>;

export const saveSummaryToNotesInput = z.object({
  chatid: z.string(),
  name: z.string()
});

export type SaveSummaryToNotesInput = z.infer<typeof saveSummaryToNotesInput>;