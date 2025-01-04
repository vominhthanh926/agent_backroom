// import { useAtomValue } from "jotai";
import React, {memo, useEffect, useRef, useState} from "react";
import io, {Socket} from "socket.io-client";
import * as dotenv from "dotenv";

import LeftMessage from "./LeftMessage";
import RightMessage from "./RightMessage";
import LoadingSpinner from "@/components/loading";

dotenv.config();

interface Message {
    _id: string;
    timestamp: string;
    role: string;
    content: string;
}


const BACKEND_URL: string = process.env.BACKEND_URL ? process.env.BACKEND_URL : "http://54.252.160.150:4000";

const ChatContainer = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const socketRef = useRef<typeof Socket | null>(null);
    const [isLoading, setIsLoading] = useState(true);
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
                setIsLoading(true);
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
            } finally {
                setIsLoading(false); // clear the loading state
            }
        };

        fetchDocuments().then(() => {
        });

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

        console.log("Connect socket server", BACKEND_URL)
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
        isLoading ?
            <div id="message-container"
                 className="max-w-4xl mt-[0] mx-auto p-4 bg-scroll rounded-lg overflow-y-auto h-96 center-screen">
                <LoadingSpinner/>
            </div> :
            (
                <div id="message-container"
                     className="max-w-4xl mt-[0] mx-auto p-4 bg-scroll rounded-lg overflow-y-auto h-96">
                    <div className="wrap-chat-container">
                        <div
                            ref={chatContainerRef}
                            id="chat-container"
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
                    </div>
                </div>
            )
    );
};

export default memo(ChatContainer);
