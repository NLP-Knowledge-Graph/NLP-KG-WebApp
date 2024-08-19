export const fetchOpenAI = async ({
  messages,
  openaikey,
  max_tokens,
  model,
}: {
  messages: { role: "user" | "system" | "assistant", content: string }[];
  openaikey: string;
  max_tokens?: number;
  model?: string;
}) => {
  // Call the OpenAI API for chat completions
  const openaiResponse = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaikey}`,
      },
      body: JSON.stringify({
        messages,
          max_tokens: max_tokens || 1000,
          model: model || "gpt-4o-mini",
      }),
    }
  );
  
  const data = await openaiResponse.json();
  return data;
};
