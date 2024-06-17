import React, { useState } from "react";
import Modal from "react-modal";
import ChatBot from "./Chatbot";

// If you have a root element with id 'root', this line sets it as the app element for accessibility purposes.
Modal.setAppElement("#__next");

interface ChatBotPopUpProps {
  publications: (string | undefined)[];
  openaikey: string | undefined;
}

function ChatBotPopUp(props: ChatBotPopUpProps) {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  const modalStyles = {
    content: {
      width: "23%",
      height: "53%",
      top: "62%",
      left: "82%",
      right: "auto",
      bottom: "auto",
      marginRight: "-20%",
      transform: "translate(-50%, -50%)",
      padding: "20px",
      borderRadius: "20px",
      border: "solid #ccc",
    },
    overlay: {
      backgroundColor: "rgba(0, 0, 0, 0.1)",
    },
  };

  return (
    <div>
      <button
        className="fixed bottom-10 right-10 z-50 cursor-pointer rounded bg-primary p-2 text-white hover:opacity-90 focus:ring-blue-300"
        onClick={() => setModalIsOpen(true)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="h-6 w-6"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
          />
        </svg>
      </button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="Chatbot Modal"
        style={modalStyles}
      >
        <ChatBot
          publications={props.publications}
          openaikey={props.openaikey}
        />
      </Modal>
    </div>
  );
}

export default ChatBotPopUp;
