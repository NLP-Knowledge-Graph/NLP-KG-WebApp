import Modal from "react-modal";
import React, { useState } from 'react';
import { BsThreeDots, BsPencil, BsTrash, BsSave } from 'react-icons/bs';
Modal.setAppElement("#__next");

interface Position {
  top: number;
  left: number;
};

interface ChatCardPopUpProps {
  position: Position;
  handleRename: React.Dispatch<React.SetStateAction<void>>;
  handleDelete: (chatid: string) => void;
  chatId: string;
  handleSaveSummaryToNotes: React.Dispatch<React.SetStateAction<void>>;
};

const ChatCardPopUp: React.FC<ChatCardPopUpProps> = ({ position, handleRename, handleDelete, handleSaveSummaryToNotes, chatId }) => {
  const [modalIsOpen, setModalIsOpen] = useState<boolean>(false);

  const customStyles = {
    content: {
      top: position.top,
      left: position.left,
      right: 'auto',
      bottom: 'auto',
      width: 'fit-content', // This will make the modal only as wide as its content
      padding: '10px', // Adjust padding as needed
      borderRadius: '8px', // if you want rounded corners
    },
  };

  const closeModal = () => setModalIsOpen(false);

  return (
    <div>
      <button
        className="p-1 mr-1 rounded-full hover:bg-gray-300"
        onClick={() => setModalIsOpen(true)}>
        <BsThreeDots />
      </button>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={() => setModalIsOpen(false)}
        contentLabel="MessageCard Modal"
        style={customStyles}
      >
        <div className="flex flex-col"> {/* This div wraps the modal content */}
          <button className="flex rounded-lg items-center p-2 hover:bg-gray-100"
            onClick={() => { handleRename(); closeModal(); }}>
            <BsPencil className="mr-2" /> Rename
          </button>
          <button className="flex rounded-lg items-center p-2 hover:bg-gray-100"
            onClick={() => { handleSaveSummaryToNotes(); closeModal(); }}>
            <BsSave className="mr-2" /> Save Summary to Notes
          </button>
          <button className="flex rounded-lg items-center p-2 text-red-500 hover:bg-gray-100"
            onClick={() => { handleDelete(chatId); closeModal(); }}>
            <BsTrash className="mr-2" /> Delete chat
          </button>
        </div>
      </Modal>
    </div>
  );
}
export default ChatCardPopUp;