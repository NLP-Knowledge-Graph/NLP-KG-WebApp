import React from 'react'
import {useRouter} from "next/router";


function ChatButton() {
    const router = useRouter();

    const handleChatClick = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        router.push("/chat");
      };

  return (
    <button 
    className="w-[78.14px] h-[36px] rounded-lg bg-primary py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300"
    onClick={
      handleChatClick
    } data-tip="Go to chat">
    <div>Chat</div>
  </button>
  )
}

export default ChatButton
