import {z} from "zod";

import {authenticatedProcedure, createTRPCRouter, publicProcedure,} from "~/server/api/trpc";
import {read} from "~/server/services/neo4jConnection";
import {getPublications} from "~/server/services/pythonConnection";
import type {Field, PublicationSearch, Venue} from "~/utils/types";

import {bookmarklistModel, bookmarkModel, chatHistoryModel, profileModel,} from "~/mongodb";
import {
    chatHistoryOutput,
    createChatHistoryInput,
    deleteChatHistoryInput,
    saveSummaryToNotesInput,
    updateChatHistoryInput,
} from "~/schemas/chathistory.schema";
import {fetchOpenAI} from "~/server/services/openai";
import {TRPCError} from "@trpc/server";

// The router for /chat feature
export const chatRouter = createTRPCRouter({
  publication: publicProcedure
    .input(z.object({ queryString: z.string() }))
    .query(async ({ input }) => {
      // Get the publications for a search query
      let publicationsCypher: string;
      let publicationsResult;

      const res = await getPublications({
        query_string: input.queryString,
        field_filters: [],
        limit: 5,
        offset: 0,
        sort_option: "relevancy",
        search_type: "default",
        min_citation_filter: 0,
        min_date_filter: 1900,
        max_date_filter: 2999,
        venue_filters: [],
        survey_filter: undefined,
      });
      const idList = res.papers.map((x) => x.neo4jID);

      // with string, get the publications' data from neo4j
      publicationsCypher = `MATCH (p:Publication)
    WHERE elementId(p) IN $idList
    WITH p
    MATCH (p)-[:HAS_FIELD_OF_STUDY]-(f)
    WITH p, COLLECT(DISTINCT f) AS fields
    MATCH (p)-[:PUBLISHED_AT]-(venue)
    RETURN p AS publication`;
      publicationsResult = await read(publicationsCypher, { idList: idList });

      publicationsResult = publicationsResult.map((entry) => {
        return {
          ...entry.publication,
          fields: entry.fields as Field[],
          venue: entry.venue as Venue,
        } as PublicationSearch;
      });

      return {
        publications: publicationsResult,
      };
    }),

  // Create a new chat history
  create: authenticatedProcedure
    .input(createChatHistoryInput)
    .output(chatHistoryOutput)
    .mutation(async ({ ctx, input }) => {
      const newChatHistory = await chatHistoryModel().create({
        userid: ctx.session.user.id,
        ...input,
      });
      return newChatHistory;
    }),

  update: authenticatedProcedure
    .input(updateChatHistoryInput)
    .output(chatHistoryOutput)
    .mutation(async ({ ctx, input }) => {
      const { chatid, ...updateData } = input;
      const updatedChatHistory = await chatHistoryModel().findOneAndUpdate(
        { chatid }, // find by chatid and userid
        { $set: updateData }, // update the data
        { new: true } // return the updated document
      );

      if (!updatedChatHistory) {
        throw new Error("Chat history not found");
      }

      return updatedChatHistory;
    }),

  // Retrieve chat history by user ID
  getChatHistories: authenticatedProcedure
    .output(chatHistoryOutput.array())
    .query(async ({ ctx }) => {
      const chatHistories = await chatHistoryModel().find({
        userid: ctx.session.user.id,
      });
      return chatHistories;
    }),

  // Delete a chat history by user ID
  delete: authenticatedProcedure
    .input(deleteChatHistoryInput)
    .mutation(async ({ input }) => {
      const { chatid } = input;
      await chatHistoryModel().deleteOne({ chatid: chatid });
    }),
  saveSummaryToNotes: authenticatedProcedure
    .input(saveSummaryToNotesInput)
    .mutation(async ({ ctx, input }) => {
      const { chatid } = input;

      const chatHistories = await chatHistoryModel().find({ chatid });
      const profile = await profileModel().findOne({
        userid: ctx.session.user.id,
      });

      if (profile === null || profile.openaikey === undefined)
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Profile does not exist or has no OpenAI API key associated with it",
        });

      const messages = chatHistories.flatMap((c) => c.message);
      console.log("messages", messages);

      const message = `Provide a detailed summary of the following chat history in Markdown format. Messages are separated by '###########', beginning with the user's initial prompt. Respond only with the summary, using appropriate headers.\n
        ${messages.map((message) => message.text).join("###########")}
      `;

      const response = await fetchOpenAI({
        messages: [{ role: "user", content: message }],
        openaikey: profile.openaikey,
        max_tokens: 4000,
      });

      if (!response.choices || response.choices.length <= 0)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
            message: "Unable to handle your request. Please log in and provide a valid OpenAI key in your profile to use this feature.",
        });

      const list = await bookmarklistModel().create({
        userid: ctx.session.user.id,
        name: input.name,
        notes: response.choices[0].message.content,
        public: false,
      });

      for (const publication of new Set(
        messages.flatMap((m) => m.publicationIds)
      ))
        await bookmarkModel().create({
          listid: list.listid,
          publication,
        });

      return list.listid;
    }),
});
