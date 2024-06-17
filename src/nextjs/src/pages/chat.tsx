import React, {useEffect, useRef, useState} from "react";
import {Button, Col, Container, Form, Row} from "react-bootstrap";
import useOpenApiFetch from "../hooks/useOpenApiFetch";
import {api} from "~/utils/api";
import Link from "next/link";
import ChatHistory, {Conversation, Message,} from "~/components/Chat/ChatHistory";

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]); // conversation history for user and bot
  const [newMessage, setNewMessage] = useState<string>(""); // next user input
  const [messageToSend, setMessageToSend] = useState<string>(""); // message for asking the semantic search query from openai
  const [messageFromOpenApi, setMessageFromOpenApi] = useState<string>(""); // retrieved semantic search query
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]); // conversation history w updated links
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [generationState, setGenerationState] = useState<string>(""); // track the state in the generation pipeline
  const [loadingTextState, setLoadingTextState] = useState<string>(""); // track the state for the loading animation
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const [selectedConversation, setSelectedConversation] =
    useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeQuestionChatId, setActiveQuestionChatId] = useState(
    selectedConversation?.chatid
  );

  const [isLoadingPublicationChat, setIsLoadingPublicationChat] =
    useState<boolean>(false);
  const [isLoadingSaveSummary, setIsLoadingSaveSummary] =
    useState<boolean>(false);

  const {
    data: profile_data,
    refetch: profile_refetch,
    error: profileFetchError,
  } = api.profile.get.useQuery();
  const {
    data: paper_data,
    refetch: paper_refetch,
    error: paper_error,
  } = api.chat.publication.useQuery(
    { queryString: messageFromOpenApi },
    { enabled: false }
  );

  const [preparedPublications, setPreparedPublications] = useState<any>(null);
  const [conceptFromOpenApi, setConceptFromOpenApi] = useState<string>("");
  const numberOfConversationSteps = 8; // max number of conversation steps to consider in the history to not exceed the LLM context limit

  const { mutate: createChat } = api.chat.create.useMutation({
    onSuccess: (newChat) => {
      if (
        !conversations.some(
          (conversation) => conversation.chatid === newChat.chatid
        )
      ) {
        setConversations([...conversations, newChat]);
      }
      setActiveQuestionChatId(newChat.chatid);
      setSelectedConversation(newChat);
    },
    onError: (error, variables, context) => {
      console.error("Error occurred while updating chat:", error);
      throw new Error("Error occurred while creating");
    },
  });

  const { mutate: updateChat } = api.chat.update.useMutation({
    onSuccess: (updatedChat) => {
      setConversations(
        conversations.map((conversation) =>
          conversation.chatid === updatedChat.chatid
            ? updatedChat
            : conversation
        )
      );
      setActiveQuestionChatId(updatedChat.chatid);
      setSelectedConversation(updatedChat);
    },
    onError: (error, variables, context) => {
      console.error("Error occurred while updating chat:", error);
      throw new Error("Error occurred while updating");
    },
  });

  useEffect(() => {
    if (selectedConversation?.chatid !== activeQuestionChatId) {
      setIsChatLoading(false);
    }
  }, [selectedConversation]);

  useEffect(() => {
    //console.log('Update Messages')
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
          chatContainerRef.current.scrollHeight;
    }
    setConversationHistory(
      messages.filter(
        (message) => message.sender === "user" || message.sender === "bot"
      )
    );
    //console.log('Messages updated')
    //console.log(isChatLoading)
  }, [messages]);

  // Ref for the dummy div at the end of the messages list
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  // useEffect hook to scroll the dummy div into view whenever messages change
  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({behavior: "auto"});
  }, [messages]); // Dependency array includes messages to trigger scroll on message change

  const handleError = (error: unknown) => {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else {
      errorMessage = String(error);
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      {
        text: errorMessage,
        sender: "system",
      },
    ]);
    setIsChatLoading(false);
    setMessageFromOpenApi("");
  };

  const removeNonUsedReferences = (
    response: string,
    publicationsToUseInChatBot: string[],
    publicationsToUseInChatBotTitles: string[],
    publicationsToUseInChatBotIds: string[]
  ) => {
    const inlineCitations = ["[1]", "[2]", "[3]", "[4]", "[5]"];
    let removedCitations: number[] = [];

    // Track which citations are not used
    inlineCitations.forEach((citation, index) => {
      if (
        !response.includes(citation) &&
        index < publicationsToUseInChatBot.length
      ) {
        removedCitations.push(index + 1);
      }
    });

    // Filter out the unused citations without modifying the original arrays
    const filteredPublications = publicationsToUseInChatBot.filter(
      (_, index) => !removedCitations.includes(index + 1)
    );
    const filteredTitles = publicationsToUseInChatBotTitles.filter(
      (_, index) => !removedCitations.includes(index + 1)
    );
    const filteredIds = publicationsToUseInChatBotIds.filter(
      (_, index) => !removedCitations.includes(index + 1)
    );

    // Adjust the inline citations in the response
    let adjustedResponse = response;
    removedCitations.sort((a, b) => a - b); // Ensure the removedCitations is sorted to maintain order
    let adjustment = 0; // Adjustment for the citation index
    removedCitations.forEach(citationIndex => {
      const citationToRemove = `\\[${citationIndex}\\]`; // Escaping square brackets
      const citationToReplace = `\\[${citationIndex - adjustment}\\]`;
      adjustedResponse = adjustedResponse.replace(new RegExp(citationToRemove, "g"), citationToReplace);
      adjustment++; // Increment adjustment for next citation index
    });

    // Update the inline citations to reflect the removal of unused citations
    const updatedInlineCitations = inlineCitations.filter((_, index) => !removedCitations.includes(index + 1));

    // Reassign the adjusted inline citations
    adjustedResponse = adjustedResponse.replace(/\[\d+\]/g, (match) => {
      const index = updatedInlineCitations.indexOf(match);
      return `[${index + 1}]`;
    });

    return {
      adjustedResponse,
      publicationsToUseInChatBot: filteredPublications,
      publicationsToUseInChatBotTitles: filteredTitles,
      publicationsToUseInChatBotIds: filteredIds,
    };
  };

  const convertReferencesToLinks = (
    text: string,
    publicationsToUseInChatBotTitles: any,
    publicationsToUseInChatBotIds: any
  ): JSX.Element => {
    var startIndex = text.indexOf("References:");
    if (startIndex == -1) {
      startIndex = text.indexOf("Inline citations:");
    }
    var modifiedText = text;
    var referencesSection: JSX.Element[] = [];

    if (startIndex !== -1) {
      modifiedText = text.substring(0, startIndex);
    }

    const referenceRegex = /\[(\d+)\]/g;
    const textWithLinks = modifiedText
        .split(referenceRegex)
        .map((part, index, array) => {
          if (index % 2 === 1) {
            // Odd indexes are references, convert them to links
            const referenceNumber = parseInt(part, 10);
            const nextIndexIsLink = index + 1 < array.length && array[index + 1].startsWith("[");
            return (
                <React.Fragment key={index}>
                  {/* Add whitespace before the link if the next part is not a link */}
                  {!nextIndexIsLink && ' '}
            <Link
              href={`/publications/${encodeURIComponent(
                publicationsToUseInChatBotIds[referenceNumber - 1]
              )}`}
              className="link-hover link tooltip text-left text-sm text-primary before:z-50 before:content-[attr(data-tip)]"
              style={{ color: "#FFAD54" }}
              data-tip={`Go to publication: ${
                publicationsToUseInChatBotTitles[referenceNumber - 1]
              }`}
            >
              [{part}]
            </Link>
                </React.Fragment>
            );
          }
          return part;
        });
    publicationsToUseInChatBotTitles.forEach((title: string, i: number) => {
      referencesSection.push(
        <div key={`ref-${i}`}>
          <Link
            href={`/publications/${encodeURIComponent(
              publicationsToUseInChatBotIds[i]
            )}`}
            className="link-hover link tooltip text-left text-sm text-primary before:z-50 before:content-[attr(data-tip)]"
            data-tip={`Go to publication: ${title}`}
          >
            [{i + 1}] {title}
          </Link>
        </div>
      );
    });

    return (
      <>
        {textWithLinks}
        <div className="references-section" style={{ marginTop: "2rem" }}>
          <h1 style={{ fontWeight: "bold" }}>REFERENCES</h1>
          {referencesSection}
        </div>
      </>
    );
  };

  useEffect(() => {
    if (profileFetchError) {
      handleError(
          "Please log in and provide a valid OpenAI key in your profile to use this feature."
      );
    }
  }, [profileFetchError]);

  const preparePublications = (paper_data: any) => {
    //console.log('Prepare publications')
    const publicationsToUseInChatBot: string[] = [];
    const publicationsToUseInChatBotTitles: string[] = [];
    const publicationsToUseInChatBotIds: string[] = [];

    // Truncate full texts of publications to a max number of tokens/characters to not exceed the context window of the LLM
    const numberOfRetrievedPublications = 5;
    // 128,000 tokens max context window
    const maxNumberOfTokensPerFullTextForLLM = 100000 / numberOfRetrievedPublications;
    // 1 token ~= 4 chars in English
    const maxNumberOfCharactersPerFullTextForLLM = maxNumberOfTokensPerFullTextForLLM * 4;

    for (
      let i = 0;
      i < Math.min(5, paper_data?.publications.length || 0);
      i++
    ) {
      const publicationTitle =
        paper_data?.publications[i]?.properties.publicationTitle;
      let fullText = paper_data?.publications[i]?.properties.fullText;
      const elementId = paper_data?.publications[i]?.elementId;

      var publication_text_to_use = "";
      if (publicationTitle !== undefined) {
        publicationsToUseInChatBotTitles.push(publicationTitle);
        publication_text_to_use = "title: " + publicationTitle;
      }

      if (fullText !== undefined) {
        if (fullText.length > maxNumberOfCharactersPerFullTextForLLM) {
          fullText = fullText.substring(0, maxNumberOfCharactersPerFullTextForLLM);
        }
        publication_text_to_use = publication_text_to_use + " fullText: " + fullText;
      }

      if (publication_text_to_use !== "") {
        publicationsToUseInChatBot.push(publication_text_to_use);
      }

      if (elementId !== undefined) {
        publicationsToUseInChatBotIds.push(elementId);
      }
    }
    return {
      publicationsToUseInChatBot,
      publicationsToUseInChatBotTitles,
      publicationsToUseInChatBotIds,
    };
  };

  const generateChitChatResponse = async () => {
    setLoadingTextState("generating response")
    //console.log('Generating chit-chat response')
    const fetchResponse = async () => {
      try {
        const openApiMessages = [
          ...conversationHistory.map(
              (h) => ({
                role: h.sender === "bot" ? "assistant" : h.sender,
                content: h.text,
              })
          ),
          {role: "user", content: newMessage},
        ];
        // Ensure numberOfConversationSteps doesn't exceed the length of openApiMessages
        const lastIndex = Math.max(openApiMessages.length - 1, 0);
        const startIndex = Math.max(lastIndex - (numberOfConversationSteps - 1), 0);

        // Select the last numberOfConversationSteps messages
        const selectedMessages = openApiMessages.slice(startIndex, lastIndex + 1);
        const response = await useOpenApiFetch(
            selectedMessages,
            `${profile_data?.openaikey}`
        );

        const m = {
          text: response,
          sender: "bot",
          conceptFromOpenApi: "",
          publicationIds: [],
          publicationTitles: [],
          publications: [],
        };

        if (selectedConversation && selectedConversation.chatid === activeQuestionChatId) {
          // only keep the full texts for the last message to prevent API rate limit errors
          const updatedMessages = messages.map((message, index) => {
            // Check if this the lasmessage
            if (index >= messages.length - 1) {
              // If it is, keep the publication arrays as they are
              return message;
            } else {
              // If it's not, set the publication arrays to empty arrays
              return {
                ...message,
                publications: []
              };
            }
          });
          updateChat({
            ...selectedConversation,
            type: "-",
            date: new Date(),
            message: [...updatedMessages, m],
          });
          setMessages([...updatedMessages, m]);
        }
      } catch (error) {
        handleError(error);
      } finally {
        setIsChatLoading(false); // Reset loading state regardless of success or failure
      }
    };
    fetchResponse();
  };


  const generateRAGResponse = async (publications: any) => {
    setLoadingTextState("generating response")
    const publicationsToUseInChatBot = publications.publicationsToUseInChatBot.map((string, index) => `Paper Number ${index + 1}: ${string}`);
    const publicationsToUseInChatBotTitles =
      publications.publicationsToUseInChatBotTitles;
    const publicationsToUseInChatBotIds =
      publications.publicationsToUseInChatBotIds;

    const fetchResponse = async () => {
      if (
        isChatLoading &&
        publicationsToUseInChatBotIds &&
        conceptFromOpenApi &&
        profile_data?.openaikey
      ) {
        // Find the index of the last message sent by the user
        let lastIndex = -1;
        for (let i = conversationHistory.length - 1; i >= 0; i--) {
          if (conversationHistory[i].sender === "user") {
            lastIndex = i;
            break;
          }
        }

        // If a message sent by the user is found, get its content
        let lastUserMessage = null;
        if (lastIndex !== -1) {
          lastUserMessage = conversationHistory[lastIndex].text;
        }
        //console.log('lastUserMessage:', lastUserMessage); // This will log the content of the last message sent by the user
        //console.log('ConceptFromOpenAPi:', conceptFromOpenApi)
        const lastUpdatedQuestion =
            "Respond to the follwing user query: " +
            lastUserMessage +
            ".\nUse the information from the provided papers. Some papers include full texts, while others only have titles. Papers include position numbers like 'Paper Number 1:' and are separated by '##############'. Here are the papers: " +
          publicationsToUseInChatBot.join(" ############## ") +
            "\nYour response should directly address the user query, without individually explaining each paper. The user should not be aware of the specific papers used in formulating your answer. Focus on explaining the concept rather than detailing the papers themselves. Aim for a response that is approximately 150 words in length. Include inline citations like [1] for the first paper, [2] for the second, and so on, corresponding to the order in which the papers were provided and the position numbers. If citing from multiple sources, list them in seperate square brackets, like [1][2]. Cite the sentences influenced by these papers, not the paper names directly. Do not list the references as '[1] paper name, [2] paper name, etc.' at the end of your response. Cite each paper in an independent sentence and not together in the same sentence. Refrain from including the referenced papers in the last sentence.";

        try {
          const openApiMessages = [
            ...conversationHistory.map(
              (h) =>
                ({
                  role: h.sender === "bot" ? "assistant" : h.sender,
                  content: h.text,
                } as const)
            ),
            { role: "user", content: lastUpdatedQuestion } as const,
          ];
          // Ensure numberOfConversationSteps doesn't exceed the length of openApiMessages
          const lastIndex = Math.max(openApiMessages.length - 1, 0);
          const startIndex = Math.max(lastIndex - (numberOfConversationSteps - 1), 0);

          // Select the last numberOfConversationSteps messages
          const selectedMessages = openApiMessages.slice(startIndex, lastIndex + 1);
          //console.log("openApiMessages:", openApiMessages);
          //console.log("Selected messages:", selectedMessages);
          const response = await useOpenApiFetch(
              selectedMessages,
            `${profile_data?.openaikey}`
          );

          const adjustedResponse = removeNonUsedReferences(
            response,
            publicationsToUseInChatBot,
            publicationsToUseInChatBotTitles,
            publicationsToUseInChatBotIds
          );
          const m: Message = {
            text: adjustedResponse.adjustedResponse,
            sender: "bot",
            conceptFromOpenApi: conceptFromOpenApi,
            publicationIds: adjustedResponse.publicationsToUseInChatBotIds,
            publicationTitles:
              adjustedResponse.publicationsToUseInChatBotTitles,
            publications: adjustedResponse.publicationsToUseInChatBot,
          };

          if (
            selectedConversation &&
            selectedConversation.chatid === activeQuestionChatId
          ) {
            // only keep the full texts for the last message to prevent API rate limit errors
            const updatedMessages = messages.map((message, index) => {
              // Check if this the last message
              if (index >= messages.length - 1) {
                // If it is, keep the publication arrays as they are
                return message;
              } else {
                // If it's not, set the publication arrays to empty arrays
                return {
                  ...message,
                  publications: []
                };
              }
            });
            updateChat({
              ...selectedConversation,
              type: "-",
              date: new Date(),
              message: [...updatedMessages, m],
            });
            setMessages([...updatedMessages, m]);
          }
        } catch (error) {
          handleError(error);
        } finally {
          setIsChatLoading(false);
          //setMessageFromOpenApi("");
        }
      }
    };
    fetchResponse();
  };

  useEffect(() => {
    //console.log("Set publications")
    if (isChatLoading && paper_data && conceptFromOpenApi) {
      const publications = preparePublications(paper_data);
      generateRAGResponse(publications);
      setPreparedPublications(publications);
    }
  }, [paper_data, conceptFromOpenApi]);

  useEffect(() => {
    if (isChatLoading) {
      handleError("Unable to generate a response");
    }
  }, [paper_error]);

  useEffect(() => {
    if (isChatLoading && generationState === "fetched response") {
      //console.log('Decide on chat behaviour (new)')
      if (messageFromOpenApi && messageFromOpenApi === "No Answer Found") {
        handleError("Unable to generate a response");
      } else if (messageFromOpenApi && messageFromOpenApi === "chit-chat query") {
        generateChitChatResponse();
      } else if (messageFromOpenApi && messageFromOpenApi === "follow-up" && preparedPublications == null) {
        generateChitChatResponse();
      } else if (messageFromOpenApi && messageFromOpenApi !== "follow-up") {
        setLoadingTextState("retrieve context")
        setConceptFromOpenApi(messageFromOpenApi);
        paper_refetch(); // Reload paper data
      } else if (preparedPublications) {
        generateRAGResponse(preparedPublications);
      }
      setGenerationState("generated response")
    }
  }, [generationState]);

  useEffect(() => {
    const fetchResponse = async () => {
      if (messageToSend && isChatLoading && generationState === "new message") {
        //console.log("Fetch Response")
        try {
          const openApiMessages = [
            ...conversationHistory.map(
              (h) =>
                ({
                  role: h.sender === "bot" ? "assistant" : h.sender,
                  content: h.text,
                } as const)
            ),
            { role: "user", content: messageToSend } as const,
          ];
          // Ensure numberOfConversationSteps doesn't exceed the length of openApiMessages
          const lastIndex = Math.max(openApiMessages.length - 1, 0);
          const startIndex = Math.max(lastIndex - (numberOfConversationSteps - 1), 0);

          // Select the last numberOfConversationSteps messages
          const selectedMessages = openApiMessages.slice(startIndex, lastIndex + 1);
          const response = await useOpenApiFetch(
              selectedMessages,
            `${profile_data?.openaikey}`
          );
          setMessageFromOpenApi(response);
          setGenerationState("fetched response");
          //console.log("Sucessfully fetched response")
        } catch (error) {
          handleError(error);
        }
      }
    };
    fetchResponse();
  }, [generationState]);

  const handleSendMessage = () => {
    //console.log('Handle new message')
    setLoadingTextState("new user query")
    if (newMessage.trim() !== "") {
      const updatedMessage =
          "A user has submitted a new query to a database that inlcudes NLP related research papers: " +
        newMessage +
          "\nBased on this input, please provide a succinct and relevant search query, specifically optimized for keyword-based semantic search within an NLP paper database. The response should consist only of the query, formulated as a set of keywords rather than a complete sentence. For instance, if the user's input is 'What is attention?' or 'Tell me about attention', respond with 'attention' as the search query. Avoid using longer phrases like 'Give me papers about attention' or appending terms such as 'NLP', like in 'attention NLP'. Also do not include the terms 'definition', 'concepts', 'mechanisms', 'approach', 'fundamentals', 'basics', 'techniques', 'applications', 'overview' or similar in the search terms. Keep the query straightforward. Refrain from using quotation marks at the beginning and end of the query. The search query should not exceed 5 words and should not include terms like 'NLP paper', 'paper', or 'research', as the database exclusively contains NLP papers." +
          "\nIn case the user input is chit-chat related, like 'Hello', 'What can you do for me?', 'What is your purpose?', 'What is your name?', 'What can you help me with?', or similar, do not provide a search query. Instead, reply with: 'chit-chat query'" +
          "\nIn case the user input is a follow-up question related to the previous chat, like 'Tell me more', 'Explain the second paper', or 'Tell me more about the third paper', do not provide a new search query. Instead, reply with: 'follow-up'";

      // Reload user data to gain access to users OpenAI API key
      profile_refetch();
      setIsChatLoading(true);

      try {
        const m: Message = {text: newMessage, sender: "user"};
        if (selectedConversation) {
          // only keep the full texts for the last message to prevent API rate limit errors
          const updatedMessages = messages.map((message, index) => {
            // Check if this the last message
            if (index >= messages.length - 1) {
              // If it is, keep the publication arrays as they are
              return message;
            } else {
              // If it's not, set the publication arrays to empty arrays
              return {
                ...message,
                publications: []
              };
            }
          });
          updateChat({
            ...selectedConversation,
            type: "-",
            date: new Date(),
            message: [...updatedMessages, m],
          });
        } else {
          createChat({
            name: newMessage,
            type: "-",
            date: new Date(),
            message: [...messages, m],
          });
        }
        setMessages([...messages, m]);
      } catch (error) {
        handleError(error);
      }
      setMessageToSend(updatedMessage);
      setNewMessage("");
      setGenerationState("new message");
      //console.log(newMessage);
      //console.log(updatedMessage);
      //console.log(isChatLoading);
      //console.log(messageToSend);
      //console.log("New Message processed");
    }
  };

  const isActionLoading = isLoadingPublicationChat || isLoadingSaveSummary;

  return (
    <div className="grid h-[90vh] grid-cols-11 overflow-auto bg-white">
      <ChatHistory
        setMessages={setMessages}
        setSelectedConversation={setSelectedConversation}
        setConversations={setConversations}
        handleError={handleError}
        conversations={conversations}
        selectedConversation={selectedConversation}
        setIsLoadingPublicationChat={setIsLoadingPublicationChat}
        setIsLoadingSaveSummary={setIsLoadingSaveSummary}
        setConceptFromOpenApi={setConceptFromOpenApi}
        setPreparedPublications={setPreparedPublications}
      />
      <div ref={chatContainerRef} className="col-span-9 col-start-3 mr-4 h-[90vh] overflow-auto rounded-lg bg-gray-100">
        <Container
          fluid
          className="flex h-[87vh] flex-col justify-between overflow-auto border border-gray-300 bg-gray-100"
        >
          <Row className="d-flex flex-column flex-grow-1 overflow-auto">
            <Col
              sm={12}
              className="chat-messages d-flex flex-column flex-grow-1"
            >
              <div className="flex-grow-1 flex flex-col overflow-auto">
                {isActionLoading ? (
                    <div className="flex h-[80vh] flex-col items-center justify-center">
                      <div
                          className="flex h-20 w-20 animate-spin flex-col items-center justify-center rounded-full border-8 border-gray-300 border-t-blue-600"/>
                      <span className="mt-2 text-2xl text-gray-500">
                      Redirecting you to{" "}
                        {isLoadingPublicationChat
                            ? "publication"
                            : "bookmark list"}{" "}
                        page ...
                    </span>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-[80vh] flex-col items-center justify-center">
                      {
                        <div className="flex h-[80vh] flex-col items-center justify-center">
                        <span className="text-5xl font-bold text-gray-700">
                          NLP-KG
                        </span>
                          <span className="text-2xl text-gray-500">
                          How can I help you today?
                        </span>
                        </div>
                      }
                    </div>
                ) : (
                    messages.map((message, index) => (
                        <div
                            key={index}
                            className="align-items-center m-4 rounded-lg "
                            style={{
                              maxWidth: "90vw",
                              display: "flex",
                              flexDirection: "row",
                              position: "relative",
                              justifyContent:
                                  message.sender === "bot" ||
                                  message.sender === "system"
                                      ? "flex-start"
                                      : "flex-end",
                            }}
                        >
                          {(message.sender === "bot" ||
                              message.sender === "system") && (
                              <div className="p-5">
                                <svg
                                    className="bubble-left"
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    style={{
                                      position: "absolute",
                                      bottom: 10,
                                      left: 0,
                                    }}
                                >
                                  -{" "}
                                  <path
                                      d="M20,2H4C2.9,2,2,2.9,2,4v12c0,1.1,0.9,2,2,2h4l4,4l4-4h4c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M20,16h-4.17L12,19.17L8.17,16H4V4h16V16z"/>
                                  <circle cx="14.5" cy="10.5" r="1.5"/>
                                  <circle cx="9.5" cy="10.5" r="1.5"/>
                                </svg>
                              </div>
                          )}

                          <div
                              className={`d-flex ml-4 mr-4 max-w-4xl rounded-lg p-4 shadow-md ${
                                  message.sender === "user"
                                      ? "user"
                                      : message.sender === "bot"
                                          ? "bot"
                                          : "system"
                              }`}
                          >
                              <span>
                                {message.sender === "bot" && message.publicationIds?.length > 0
                                    ? convertReferencesToLinks(
                                        message.text,
                                        message.publicationTitles,
                                        message.publicationIds
                                    )
                                    : message.text // Render plain text if publicationIds are empty
                                }
                                {/*Text: {message.text}, Sender: {message.sender}, Titles: {message.publicationTitles}, publicationIds: {message.publicationIds}, messageType: {message.messageType}*/}
                            </span>
                          </div>

                          {message.sender === "user" && (
                              <div className="p-5">
                                <svg
                                    className="bubble-right"
                                    width="40"
                                    height="40"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    style={{
                                      position: "absolute",
                                      bottom: 7,
                                      right: 0,
                                    }}
                                >
                                  <path
                                      d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                </svg>
                              </div>
                          )}
                        </div>
                    ))
                )}
                {isChatLoading && (
                    <div
                        className="align-items-center m-4 rounded-lg "
                        style={{
                          maxWidth: "fit-content",
                          display: "flex",
                          flexDirection: "row",
                          position: "relative",
                          justifyContent: "flex-start", // This aligns the flex container to the start, which is the left side
                        }}
                    >
                      <div className="p-5">
                        <svg
                            className="bubble-left"
                            width="40"
                            height="40"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            style={{position: "absolute", bottom: 10, left: 0}}
                        >
                          <path
                              d="M20,2H4C2.9,2,2,2.9,2,4v12c0,1.1,0.9,2,2,2h4l4,4l4-4h4c1.1,0,2-0.9,2-2V4C22,2.9,21.1,2,20,2z M20,16h-4.17L12,19.17L8.17,16H4V4h16V16z"/>
                          <circle cx="14.5" cy="10.5" r="1.5"/>
                          <circle cx="9.5" cy="10.5" r="1.5"/>
                        </svg>
                      </div>
                      <div className="bot ml-4 w-full max-w-sm justify-start rounded-md border p-4">
                        <div className="flex items-center">
                          <div style={{marginRight: "12px"}}>
                            <span className="text-gray-600">
                              {/* Conditionally render different loading text based on generationState */}
                              {loadingTextState === "new user query" && "Processing user query"}
                              {loadingTextState === "retrieve context" && "Retrieving context"}
                              {loadingTextState === "generating response" && "Generating response"}
                            </span>
                          </div>
                          {/* Conditionally render different loading animations based on loadingTextState */}
                          {loadingTextState === "new user query" || loadingTextState === "retrieve context" ? (
                              <div className="flex space-x-1 items-center">
                                <svg aria-hidden="true"
                                     className="w-6 h-6 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600"
                                     viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path
                                      d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                                      fill="currentColor"/>
                                  <path
                                      d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                                      fill="currentFill"/>
                                </svg>
                              </div>
                          ) : (
                              <div className="flex space-x-1 items-center animate-pulse" style={{marginTop: "8px"}}>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                     style={{animationDelay: "-0.3s"}}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                                     style={{animationDelay: "-0.15s"}}></div>
                                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                              </div>
                          )}
                        </div>
                      </div>
                    </div>
                )}
                <div ref={endOfMessagesRef}/>
              </div>
            </Col>
          </Row>
          <Form
              className="flex w-full flex-row items-center gap-2 px-2 py-1"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
          >
            <Form.Group className="flex-grow">
              <Form.Control
                  type="text"
                  className="w-full rounded-lg border border-gray-300 p-2.5"
                  placeholder="Message NLP-KG..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
              />
            </Form.Group>
            <Button
                variant="primary"
                type="submit"
              className={`items-center rounded-lg px-4 py-2 text-sm font-medium text-white
              ${
                isChatLoading
                  ? "bg-gray-400"
                  : "bg-primary hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
              }`}
              disabled={isChatLoading}
            >
              Send
            </Button>
          </Form>
        </Container>
          <span className="ml-4 text-xs text-center text-gray-500">NLP-KG can make mistakes. Consider checking important information.</span>
      </div>
    </div>
  );
};

export default Chat;