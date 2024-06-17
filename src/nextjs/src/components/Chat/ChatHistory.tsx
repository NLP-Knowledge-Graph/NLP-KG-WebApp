import React, {useEffect, useState} from "react";
import ChatCardPopUp from "~/components/Chat/ChatCardPopUp";
import {BsPencilSquare} from "react-icons/bs";
import {api} from "~/utils/api";
import {useSession} from "next-auth/react";
import Link from "next/link";
import {useRouter} from "next/router";

export interface Message {
  text: string;
  sender: "bot" | "system" | "user";
  conceptFromOpenApi?: string;
  publicationIds?: string[];
  publicationTitles?: string[];
  publications?: string[];
}

export interface Conversation {
  chatid: string;
  type: string;
  date: Date;
  name: string;
  message: Message[];
}

export interface Position {
  top: number;
  left: number;
}

interface ChatHistoryProps {
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setSelectedConversation: React.Dispatch<
    React.SetStateAction<Conversation | null>
  >;
  selectedConversation: Conversation | null;
  setConversations: React.Dispatch<React.SetStateAction<Conversation[]>>;
  setIsLoadingPublicationChat: React.Dispatch<React.SetStateAction<boolean>>;
  setIsLoadingSaveSummary: React.Dispatch<React.SetStateAction<boolean>>;
  conversations: Conversation[];
  handleError: React.Dispatch<React.SetStateAction<unknown>>;
  setConceptFromOpenApi: React.Dispatch<React.SetStateAction<string>>;
  setPreparedPublications: React.Dispatch<React.SetStateAction<unknown>>;
}

const ChatHistory: React.FC<ChatHistoryProps> = ({
  setMessages,
  setSelectedConversation,
  setConversations,
  setIsLoadingPublicationChat,
  setIsLoadingSaveSummary,
  handleError,
  setConceptFromOpenApi,
  setPreparedPublications,
  selectedConversation,
  conversations,
}) => {
  const [popupPosition, setPopupPosition] = useState<Position>({
    top: 0,
    left: 0,
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [isDeleted, setIsDeleted] = useState(false);
  const [showPublicationChats, setShowPublicationChats] = useState(false);
  const router = useRouter();

  const { mutate: deleteChat } = api.chat.delete.useMutation({
    onError: () => {
      throw new Error("Error occurred while deleting");
    },
  });
  const { mutate: updateChat } = api.chat.update.useMutation({
    onError: () => {
      throw new Error("Error occurred while updating");
    },
  });
  const { mutate: saveSummary } = api.chat.saveSummaryToNotes.useMutation({
    onSuccess: (listid) => {
      router.push(`/list/${listid}`);
    },
    onError: () => {
      throw new Error("Error occurred while updating");
    },
    onSettled: () => {
      setIsLoadingSaveSummary(false);
    },
  });

  const { data: session, status: sessionStatus } = useSession();
  const conversationsToUse = conversations.filter((c) =>
    showPublicationChats ? c.type !== "-" : c.type === "-"
  );

  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      // Handle the error when the user is not authenticated
      handleError(
          "Please log in and provide a valid OpenAI key in your profile to use this feature."
      );
    }
  }, [sessionStatus]);

  const { data: history, error: fetchHistoryError } =
    api.chat.getChatHistories.useQuery(undefined, {
      enabled: session !== undefined && session !== null,
    });

  useEffect(() => {
    if (fetchHistoryError) {
      handleError("Error occurred while fetching history");
    }
  }, [fetchHistoryError]);

  useEffect(() => {
    if (history) {
      setConversations(history);
    }
  }, [history]);

  const handleSelectConversation = (
    conversation: Conversation,
    position: Position
  ) => {
    setMessages(conversation.message);
    setSelectedConversation(conversation);
    setPopupPosition(position);

    const lastMessage = conversation.message[conversation.message.length - 1];
    if (lastMessage) {
      setConceptFromOpenApi(lastMessage.conceptFromOpenApi || "");
      setPreparedPublications({
        publicationsToUseInChatBot: lastMessage.publications,
        publicationsToUseInChatBotTitles: lastMessage.publicationTitles,
        publicationsToUseInChatBotIds: lastMessage.publicationIds,
      });
    }
  };

  const handleStartNewChat = () => {
    setMessages([]);
    setSelectedConversation(null);
    setConceptFromOpenApi("");
    setPreparedPublications(null);
  };

  const handleDelete = () => {
    if (selectedConversation) {
      setConversations(
        conversations.filter((c) => c.chatid !== selectedConversation.chatid)
      );
      deleteChat({ chatid: selectedConversation.chatid });
      setIsDeleted(true);
    }
  };

  const handleSaveSummaryToNotes = () => {
    if (selectedConversation) {
      setIsLoadingSaveSummary(true);
      saveSummary({
        chatid: selectedConversation.chatid,
        name: selectedConversation.name,
      });
    }
  };

  const handleSelectConversationForPublicationConversations = (
    conversation: Conversation,
    position: Position
  ) => {
    setIsLoadingPublicationChat(true);
    setSelectedConversation(conversation);
    setPopupPosition(position);
  };

  useEffect(() => {
    if (isDeleted) {
      handleStartNewChat();
      setIsDeleted(false);
    }
  }, [conversations]);

  const handleRename = () => {
    setIsEditing(true);
    const conversationToRename = conversations.find(
      (c) => c.chatid === selectedConversation?.chatid
    );
    if (conversationToRename) {
      setNewName(conversationToRename.name);
    }
  };
  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(event.target.value);
  };

  const saveNewName = (conversation: Conversation) => {
    const updatedConversation = { ...conversation, name: newName };
    updateChat(updatedConversation);
    setSelectedConversation(updatedConversation);
    setConversations(
      conversations.map((c) => {
        if (c.chatid === conversation.chatid) {
          return updatedConversation;
        }
        return c;
      })
    );
    setIsEditing(false);
    setNewName("");
  };

  const renderConversationName = (conversation: Conversation) => {
    if (isEditing && selectedConversation?.chatid === conversation.chatid) {
      return (
        <input
          type="text"
          value={newName}
          onChange={handleNameChange}
          onBlur={() => saveNewName(conversation)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              saveNewName(conversation);
            }
          }}
          autoFocus
        />
      );
    } else if (conversation.type != "-") {
      return (
        <Link
          href={`/publications/${encodeURIComponent(
            conversation.type + "---" + conversation.chatid
          )}`}
          className="link-hover link tooltip text-left text-blue-800 before:z-50 before:content-[attr(data-tip)]"
        >
          <span>{conversation.name}</span>
        </Link>
      );
    } else {
      return <span>{conversation.name}</span>;
    }
  };

  const divideConversations = (conversations: Conversation[]) => {
    const sortedConversations = conversations.sort(
      (a, b) => b.date.getTime() - a.date.getTime()
    );
    const today = new Date();
    return {
      todayConversations: sortedConversations.filter(
        (conv) => conv.date.getTime() >= today.getTime() - 86400000
      ),
      lastSevenDaysConversations: sortedConversations.filter(
        (conv) =>
          conv.date.getTime() > today.getTime() - 86400000 * 7 &&
          conv.date.getTime() <= today.getTime() - 86400000
      ),
      lastThirtyDaysConversations: sortedConversations.filter(
        (conv) =>
          conv.date.getTime() > today.getTime() - 86400000 * 30 &&
          conv.date.getTime() <= today.getTime() - 86400000 * 7
      ),
      olderConversations: sortedConversations.filter(
        (conv) => conv.date.getTime() <= today.getTime() - 86400000 * 30
      ),
    };
  };

  const renderConversation = () => {
    const {
      todayConversations,
      lastSevenDaysConversations,
      lastThirtyDaysConversations,
      olderConversations,
    } = divideConversations(conversationsToUse);
    return (
      <>
        {renderConversationSection("Today", todayConversations)}
        {renderConversationSection(
          "Previous 7 Days",
          lastSevenDaysConversations
        )}
        {renderConversationSection(
          "Previous 30 Days",
          lastThirtyDaysConversations
        )}
        {renderConversationSection("Older Conversations", olderConversations)}
      </>
    );
  };

  const renderConversationSection = (
    title: string,
    conversations: Conversation[]
  ) => {
    if (conversations.length === 0) return null;
    return (
      <div className="pb-4">
        <h5 className="text-xl text-gray-400">{title}</h5>
        {conversations.map((conversation, index) =>
          conversation.type === "-" ? (
            // Existing logic for conversations with type "-"
            <div
              key={index}
              className={`ml-1 mr-1 cursor-pointer rounded-lg p-2 hover:bg-gray-100 ${
                selectedConversation?.chatid === conversation.chatid
                  ? "bg-gray-200"
                  : ""
              }`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                handleSelectConversation(conversation, {
                  top: rect.top + window.scrollY,
                  left: rect.right + window.scrollX,
                });
              }}
            >
              <div className="ml-1 flex items-center justify-between">
                {renderConversationName(conversation)}
                {selectedConversation?.chatid === conversation.chatid && (
                  <ChatCardPopUp
                    position={popupPosition}
                    handleRename={handleRename}
                    handleDelete={handleDelete}
                    chatId={conversation.chatid}
                    handleSaveSummaryToNotes={handleSaveSummaryToNotes}
                  />
                )}
              </div>
            </div>
          ) : (
            <div
              key={index}
              className={`ml-1 mr-1 cursor-pointer rounded-lg p-2 hover:bg-gray-100 ${
                selectedConversation?.chatid === conversation.chatid
                  ? "bg-gray-200"
                  : ""
              }`}
            >
              <div
                className="ml-1 flex items-center justify-between"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  handleSelectConversationForPublicationConversations(
                    conversation,
                    {
                      top: rect.top + window.scrollY,
                      left: rect.right + window.scrollX,
                    }
                  );
                }}
              >
                {renderConversationName(conversation)}
                {
                  <ChatCardPopUp
                    position={popupPosition}
                    handleRename={handleRename}
                    handleDelete={handleDelete}
                    chatId={conversation.chatid}
                    handleSaveSummaryToNotes={handleSaveSummaryToNotes}
                  />
                }
              </div>
            </div>
          )
        )}
      </div>
    );
  };

  return (
    <div className="col-span-2 col-start-1 ml-4 mr-1 flex h-[90vh] flex-col rounded-lg border border-gray-300 p-4">
      <div className="border-b border-gray-200 text-center text-sm font-medium text-gray-500 dark:border-gray-700 dark:text-gray-400">
        <ul className="-mb-px flex flex-wrap">
          <li className="me-2">
            <input
              type="button"
              className={
                  "inline-block rounded-t-lg border-b-2 border-transparent p-4 hover:border-blue-600 hover:text-blue-600 dark:hover:text-gray-300 cursor-pointer" +
                (showPublicationChats
                  ? ""
                  : " border-blue-600 text-blue-600 dark:border-blue-500")
              }
              value="Chats"
              onClick={() => setShowPublicationChats(false)}
            />
          </li>
          <li className="me-2">
            <input
              type="button"
              className={
                  "inline-block rounded-t-lg border-b-2 border-transparent p-4 hover:border-blue-600 hover:text-blue-600 dark:hover:text-gray-300 cursor-pointer" +
                (showPublicationChats
                  ? " border-blue-600 text-blue-600 dark:border-blue-500"
                  : "")
              }
              value="Ask This Paper"
              aria-current="page"
              onClick={() => setShowPublicationChats(true)}
            />
          </li>
        </ul>
      </div>

      <button
        onClick={handleStartNewChat}
        className="mb-4 flex w-full cursor-pointer items-center justify-between rounded-lg border border-gray-300 bg-white p-2 text-xl hover:bg-gray-200"
      >
        <span>New chat</span>
        <BsPencilSquare />
      </button>
      <div className="flex-grow overflow-auto">{renderConversation()}</div>
    </div>
  );
};

export default ChatHistory;