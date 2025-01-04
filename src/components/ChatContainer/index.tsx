// import { useAtomValue } from "jotai";
import React, { memo, useEffect, useRef, useState } from "react";
import io,{ Socket } from "socket.io-client";

import LeftMessage from "./LeftMessage";
import RightMessage from "./RightMessage";

interface Message {
  _id: string;
  timestamp: string;
  role: string;
  content: string;
}

const BACKEND_URL : string = process.env.BACKEND_URL ? process.env.BACKEND_URL : "http://localhost:4000";

const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const socketRef = useRef<typeof Socket | null>(null);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/messages');
        const jsonString = await response.json();
        const data = JSON.parse(jsonString);
        setMessages(data.map((doc: Message) => ({
          _id: doc._id,
          timestamp: JSON.stringify(doc.timestamp),
          role: JSON.stringify(doc.role),
          content: JSON.stringify(doc.content)
        })));
      } catch (error) {
        console.error('Failed to fetch documents:', error);
      }
    };

    fetchDocuments().then(() => {});

    // Clean up function to handle component unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // This useEffect only handles fetchDocuments

  // Separate useEffect for socket connection
  useEffect(() => {
    const existingSessionId = localStorage.getItem('sessionId');
    
    // Only create socket if it doesn't exist
    if (!socketRef.current) {
      const socket = io(BACKEND_URL, {
        auth: {
          sessionId: existingSessionId
        },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        transports: ['websocket']
      });

      socket.on('connect', () => {
        console.log('Connected with session ID:', existingSessionId || socket.id);
        if (!existingSessionId) {
          localStorage.setItem('sessionId', socket.id);
        }
      });

      socket.on('newDocument', (timestamp: string, content: string, role: string) => {
        setMessages(prevMessages => [
          ...prevMessages,
          {
            _id: timestamp,
            timestamp,
            role: role,
            content
          }
        ]);
      });

      socketRef.current = socket;
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, []); // Empty dependency array

  useEffect(() => {
    scrollToBottom();
  }, [messages]);


  return (
    <div
      ref={chatContainerRef}
      className="chat-container"
    >
      {messages.map((msg) => 
        msg.role === '"Gandalf"' ? (
          <LeftMessage
            key={msg._id}
            messages={[`${JSON.parse(msg.content)}`]}
          />
        ) : (
          <RightMessage
            key={msg._id} 
            messages={[`${JSON.parse(msg.content)}`]}
          />
        )
      )}
    </div>
  );
};

export default memo(ChatContainer);
