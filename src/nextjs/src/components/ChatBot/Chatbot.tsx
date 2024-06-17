"use client";
import React, {useEffect, useState} from "react";
import useOpenApiFetch from "~/hooks/useOpenApiFetch";

interface ChatBotProps {
  publications: (string | undefined)[];
  openaikey: string | undefined;
}

const getInitMessage = (key: string | undefined) => {
  if (key === undefined || key === "")
    return [
      {
        sender: "system",
        text: "Please provide a valid OpenAI key in your profile to use this feature.",
      },
    ];
  else return [{ sender: "bot", text: "Hello, how can I assist you today?" }];
};

function ChatBot(props: ChatBotProps) {
  const [messages, setMessages] = useState(getInitMessage(props.openaikey));
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setMessages(getInitMessage(props.openaikey));
  }, [props.openaikey]);

  const sendMessage = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { text: input, sender: "user" };
    setMessages([...messages, newMessage]);
    setInput("");
    setIsLoading(true); // Start loading

    // Concatenate previous messages to maintain context
    // Get the last five messages including the new message
    // let recentChatHistory = [...messages, newMessage].slice(-3).map(m => {
    //   return `${m.sender === 'user' ? 'User: ' : 'Bot: '}${m.text}`;
    // }).join('\n');
    // recentChatHistory = 'This is our chat history:\n' + recentChatHistory;

    // Concatenate previous messages to maintain context
    let chatHistory = messages
      .slice(-10)
      .map((m) => m.text)
      .join("\n");
    chatHistory = "This is our chat history:\n" + chatHistory;
    chatHistory += `\nThis is the current question:\n${newMessage.text}`;
    //const question = `Based on the following papers: ${props.publications.join(", ")}\n${chatHistory}`;

    // Construct the final prompt
    const question = `Answer our questions based on the following papers: ${props.publications.join(
      ", "
    )}\n${chatHistory}`;

    // Concatenate previous user messages to maintain context
    // let chatHistory = messages
    // .filter(m => m.sender === 'user')
    // .slice(-4) // Keeping last 4, as we will add the new message separately
    // .map(m => `User: ${m.text}`)
    // .join('\n');
    // chatHistory += `\nUser: ${newMessage.text}`;

    //const question = `Based on the following papers: ${props.publications.join(", ")}\n${chatHistory}`;
    //const question = "Base on the following papers: "+ props.publications.join(", ") + " Question is: "+ newMessage.text;

    
    try {
      const res = await useOpenApiFetch([{ role: "user", content: question}], `${props.openaikey}`);

      const data = await res.json();
      const response = { text: data.choices[0].message.content, sender: "bot" };
      setMessages((prevMessages) => [...prevMessages, response]);
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "Please provide a valid OpenAI key in your profile to use this feature.",
          sender: "system",
        },
      ]);
      setIsLoading(false); // Stop loading after the response
    }

    setIsLoading(false); // Stop loading after the response
  };

  return (
    <div className="flex h-full w-full flex-col gap-y-2">
      <div className="h-80 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`my-2 rounded-lg p-2 text-black ${
              message.sender === "user"
                ? "ml-auto bg-gray-100"
                : message.sender === "bot"
                ? "bg-gray-200"
                : "bg-red-100"
            }`}
          >
            {message.text}
          </div>
        ))}
        {isLoading && (
          <div className="my-2 rounded-lg bg-gray-200 p-2 text-center text-black">
            Loading...
          </div>
        )}
      </div>
      <form onSubmit={sendMessage} className="flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 p-2"
          placeholder="Ask something..."
        />
        <button
          type="submit"
          className="ml-2 rounded-lg bg-primary px-4 py-2 text-white"
        >
          Send
        </button>
      </form>
      <span className="text-xs text-center text-gray-500">NLP-KG can make mistakes. Consider checking important information.</span>
    </div>
  );
}

export default ChatBot;