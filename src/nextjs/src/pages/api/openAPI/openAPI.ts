import {NextApiRequest, NextApiResponse} from "next";
import {fetchOpenAI} from "~/server/services/openai";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    try {
      const data = await fetchOpenAI({
        messages: req.body.messages as Parameters<typeof fetchOpenAI>[0]["messages"],
        openaikey: req.headers.api_key as string,
        max_tokens: req.body.max_tokens || 150,
        model: req.body.model,
      });

      res.status(200).json(data);
    } catch (error) {
      // Handle fetch errors
      //res.status(500).json({ error: "Error while fetching from OpenAI API" });
      console.log("Error while fetching from OpenAI API. Please check your OpenAI key.", error)
    }
  }
}