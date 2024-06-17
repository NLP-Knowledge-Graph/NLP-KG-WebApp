"use client";
import React, {useEffect, useState} from "react";
import {api} from "~/utils/api";
import {Conversation, Message} from "~/components/Chat/ChatHistory";
import {useSession} from "next-auth/react";
import useOpenApiFetch from "~/hooks/useOpenApiFetch";

interface AskThisPaperProps {
  publication: string | undefined;
  openaikey: string | undefined;
  publicationId: string;
  publicationName: string;
  chatId: string | undefined;
  chatMessages: { sender: string; text: string }[];
  setChatMessages: React.Dispatch<
    React.SetStateAction<{ sender: string; text: string }[]>
  >;
  chatRecommendedQuestions: string[];
  setChatRecommendedQuestions: React.Dispatch<React.SetStateAction<string[]>>;
}

const fetchOpenAI = async (message: string, openaikey: string) => {
  const data = await useOpenApiFetch(
    [{ role: "user", content: message }],
    openaikey
  );
  return data;
};

function AskThisPaper(props: AskThisPaperProps) {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isQuestionLoading, setIsQuestionLoading] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);

  const messages = props.chatMessages;
  const setMessages = props.setChatMessages;
  const recommendedQuestions = props.chatRecommendedQuestions;
  const setRecommendedQuestions = props.setChatRecommendedQuestions;

  const { mutate: createChat } = api.chat.create.useMutation({
    onSuccess: async (newChat) => {
      setSelectedConversation(newChat);
      await answerQuestion(newChat, newChat.message.at(-1)!);
    },
    onError: (error, variables, context) => {
      throw new Error("Error occurred while creating");
    },
  });
  const { mutate: updateChat } = api.chat.update.useMutation({
    onSuccess: async (updatedChat) => {
      setSelectedConversation(updatedChat);
    },
    onError: (error, variables, context) => {
      throw new Error("Error occurred while updating");
    },
  });

  const answerQuestion = async (
    conversation: Conversation,
    newMessage: Message
  ) => {
    // Filter out "No Answer Found" and its preceding message
    const filteredMessages = messages.filter((m, index, array) => {
      // Check if current or next message is "No Answer Found"
      const isCurrentNoAnswer = m.text.trim() === "No Answer Found";
      const isNextNoAnswer =
        index < array.length - 1 &&
        array[index + 1]?.text.trim() === "No Answer Found";
      return !isCurrentNoAnswer && !isNextNoAnswer;
    });

    const history = filteredMessages
      .slice(-10)
      .map((m) => m.text)
      .join("\n\n");

    //Check if history is empty and set the query accordingly
    const convHistory = !history.length
      ? ""
      : `\n\nThis is our conversation history:\n` + history;

    // Truncate full texts of publications to a max number of tokens/characters to not exceed the context window of the LLM
    let paperFullText = props.publication;
    // 128,000 tokens max context window
    const maxNumberOfTokensForLLM = 100000;
    // 1 token ~= 4 chars in English
    const maxNumberOfCharactersPerFullTextForLLM = maxNumberOfTokensForLLM * 4;
    if (paperFullText !== undefined) {
      if (paperFullText.length > maxNumberOfCharactersPerFullTextForLLM) {
        paperFullText = paperFullText.substring(0, maxNumberOfCharactersPerFullTextForLLM);
      }
    }

    const query =
        `Answer the new question based on the following paper: ${paperFullText}. ` +
        "If the user query is chit-chat related, answer accordingly without considering the paper and do not provide supporting statements." +
        "If the question related to the paper, first answer the question, then in your response, create a new section on the next line titled 'Supporting Statements'. In this section, provide the supporting statements from the paper that substantiate your answer. Present each statement on a separate new line, one by one, and include the corresponding page number at the end. " +
        convHistory +
        `\n\nThis is the new question: ${newMessage.text}`;

    try {
      if (props.openaikey) {
        const response = await fetchOpenAI(query, props.openaikey);
        const newMessage: Message = { text: response, sender: "bot" };
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        updateChat({
          ...conversation,
          type: props.publicationId,
          date: new Date(),
          message: [...messages, newMessage],
        });

        setIsLoading(false);

        await createQuestions(newMessage);
      }
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "Unable to handle your request. Please log in and provide a valid OpenAI key in your profile to use this feature.",
          sender: "system",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsQuestionLoading(false);
    }
  };

  const createQuestions = async (newMessage: Message) => {
    try {
      if (props.openaikey) {
        const questionsAsked: string[] = messages
          .filter((message) => message.sender === "user")
          .map((message) => message.text);
        questionsAsked.push(newMessage.text);


        // Truncate full texts of publications to a max number of tokens/characters to not exceed the context window of the LLM
        let paperFullText = props.publication;
        // 128,000 tokens max context window
        const maxNumberOfTokensForLLM = 120000;
        // 1 token ~= 4 chars in English
        const maxNumberOfCharactersPerFullTextForLLM = maxNumberOfTokensForLLM * 4;
        if (paperFullText !== undefined) {
          if (paperFullText.length > maxNumberOfCharactersPerFullTextForLLM) {
            paperFullText = paperFullText.substring(0, maxNumberOfCharactersPerFullTextForLLM);
          }
        }

        const questionQuery =
            `Please provide three concise follow-up questions that can be answered by the paper ${paperFullText}. ` +
          `These questions should be distinct from previously asked questions: ${questionsAsked.join(
            ", "
          )}. ` +
          'Yet they may be similar in nature to following questions such as: "What is the goal of this paper?", "What are the key results of this paper?", "What methods are used in this paper?"\n' +
          "In your response, list only the three questions one-by-one (like 1. 2. 3.), separated by line break, nothing else!";

        const responseForQuestions = await fetchOpenAI(
          questionQuery,
          props.openaikey
        );
        setRecommendedQuestions(
          responseForQuestions
            .split("\n")
            .map((question: string) => question.replace(/^\d+\.\s/, ""))
            .filter((question: string) => question.trim() !== "")
        );

        setIsQuestionLoading(false);
      }
    } catch (error) {
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          text: "Unable to handle your request. Please log in and provide a valid OpenAI key in your profile to use this feature.",
          sender: "system",
        },
      ]);
    } finally {
      setIsLoading(false);
      setIsQuestionLoading(false);
    }
  };

  const { data: session, status: sessionStatus } = useSession();

  const { data: history, error: fetchHistoryError } =
    api.chat.getChatHistories.useQuery(undefined, {
      enabled: session !== undefined && session !== null,
    });

  useEffect(() => {
    let foundEntry = history?.find((entry) => entry.chatid === props.chatId);
    if (foundEntry) {
      setMessages(foundEntry?.message);
      setSelectedConversation(foundEntry);
    }
  }, [history]);

  useEffect(() => {
    if (props.openaikey === undefined || props.openaikey === "") {
      setMessages([
        {
          sender: "system",
          text: "Please provide a valid OpenAI key in your profile to use this feature.",
        },
      ]);
      setIsDisabled(true);
    } else {
      setIsDisabled(false);
    }
  }, [props.openaikey]);

  const handleRecommendedQuestionsClick = (question: string) => {
    setInput(question);
  };

  const sendMessage = async (e: { preventDefault: () => void }) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage: Message = { text: input, sender: "user" };

    setMessages([...messages, newMessage]);
    setInput("");
    setIsLoading(true);
    setIsQuestionLoading(true);

    if (selectedConversation) {
      updateChat({
        ...selectedConversation,
        type: props.publicationId,
        date: new Date(),
        message: [...messages, newMessage],
      });

      await answerQuestion(selectedConversation, newMessage);
    } else if (props.openaikey) {
      const response = await fetchOpenAI(
        "suggest a name for the question: " +
          input +
          " asked for paper " +
          props.publicationName +
          "answer should contain only your suggestion without quotes",
        props.openaikey
      );

      createChat({
        name: response,
        type: props.publicationId,
        date: new Date(),
        message: [...messages, newMessage],
      });
    }
  };

  return (
      <div className="flex h-full w-full flex-col justify-between gap-y-4">
        <div className="flex-grow overflow-y-auto">
          {messages.map((message, index) => (
              <div
                  key={index}
                  className={`my-2 ml-auto rounded-lg p-2 text-black ${
                      message.sender === "user"
                          ? "bg-gray-100 text-right"
                          : message.sender === "bot"
                              ? "bg-blue-200 text-left"
                              : "bg-red-100 text-left"
                  }`}
              >
                {message.text.split("\n").map((line, lineIndex) => (
                    <React.Fragment key={lineIndex}>
                      {line}
                      <br/>
                    </React.Fragment>
                ))}
              </div>
          ))}
          {isLoading && (
              <div className="my-2 rounded-lg bg-blue-200 p-2 text-center text-black">
                <div className="flex justify-center items-center space-x-1 animate-pulse">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                       style={{animationDelay: '-0.3s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                       style={{animationDelay: '-0.15s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
          )}
        </div>

        {/* Predefined Questions */}
        <div className="flex justify-around">
          {isQuestionLoading ? (
              <div className="mr-2 rounded-lg border border-gray-300 bg-blue-50 p-2 text-center text-xs">
                <div className="flex justify-center items-center space-x-0.5 animate-pulse">
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
                       style={{animationDelay: '-0.3s'}}></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"
                       style={{animationDelay: '-0.15s'}}></div>
                  <div className="w-1 h-1 bg-gray-500 rounded-full animate-bounce"></div>
                </div>
              </div>
          ) : (
              recommendedQuestions.map((question, index) => (
                  <button
                      key={index}
                      className="mr-2 flex-grow rounded-lg border border-gray-300 bg-blue-50 p-2 text-left text-xs hover:bg-gray-200"
                      onClick={() => handleRecommendedQuestionsClick(question)}
                      disabled={isDisabled}
                  >
                    {question}
                  </button>
              ))
          )}
        </div>

        <div>
          <form onSubmit={sendMessage} className="flex">
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 p-2"
                placeholder={`Pose a question to \"${props.publicationName}\"`}
                disabled={isDisabled}
            />
            <button
                type="submit"
                className={`ml-2 items-center rounded-lg px-4 py-2 text-sm font-medium text-white
            ${
                    isDisabled || isLoading || isQuestionLoading
                        ? "bg-gray-400"
                        : "bg-primary hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
                }`}
                disabled={isDisabled || isLoading || isQuestionLoading}
            >
              Send
            </button>
          </form>
        </div>
        <span className="text-xs text-left text-gray-500">NLP-KG can make mistakes. Consider checking important information.</span>
      </div>
  );
}

export default AskThisPaper;
