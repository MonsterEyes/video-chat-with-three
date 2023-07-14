// Chat.js
import React, { useState, useEffect, useContext } from "react";
import { SocketContext } from "../Context";

function Chat({ roomId }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState("");
    const { socketClient, usersInfo } = useContext(SocketContext);

    useEffect(() => {
        socketClient.on("receive_message", ({ userId, userName, message }) => {
            setMessages((prevMessages) => [
                ...prevMessages,
                { userId, userName, message },
            ]);
        });

        return () => {
            socketClient.off("receive_message");
        };
    }, [socketClient]);

    const sendMessage = (event) => {
        event.preventDefault();
        if (inputMessage.trim() !== "") {
            socketClient.emit("send_message", {
                roomId,
                message: inputMessage,
            });
            setInputMessage("");
        }
    };

    return (
        <div id="chat">
            <div>
                {messages.map((message, index) => (
                    <div key={index}>
                        <strong
                            style={{ color: usersInfo[message.userId]?.color }}
                        >
                            {message.userName || message.userId}:
                        </strong>{" "}
                        {message.message}
                    </div>
                ))}
            </div>
            <form onSubmit={sendMessage}>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Type your message"
                />
                <button type="submit">Send</button>
            </form>
        </div>
    );
}

export default Chat;
