import React, { createContext, useState, useEffect } from "react";
import { io } from "socket.io-client";

const SocketContext = createContext();

const ContextProvider = ({ children }) => {
    const [me, setMe] = useState("");
    const [socketClient, setSocketClient] = useState(null);
    const [currentRoom, setCurrentRoom] = useState(null);
    const [roomId, setRoomId] = useState("");
    const [roomUsers, setRoomUsers] = useState({});
    const [usersInfo, setUsersInfo] = useState({});

    useEffect(() => {
        const clientSocket = io("http://localhost:3000");
        setSocketClient(clientSocket);

        clientSocket.on("me", (id) => setMe(id));

        clientSocket.on("user_data", (data) => {
            setUsersInfo((prev) => ({ ...prev, ...data }));
        });

        return () => {
            if (clientSocket) {
                clientSocket.disconnect();
            }
        };
    }, []);

    const createRoom = (roomId) => {
        console.log("Creating room:", roomId);
        if (socketClient) {
            socketClient.emit("create_room", roomId);
            joinRoom(roomId, socketClient);
        }
    };

    const joinRoom = (roomId) => {
        console.log("Joining room:", roomId);
        setCurrentRoom(roomId);

        if (socketClient) {
            socketClient.emit("join_room", roomId);
        }
    };

    // // Add the handleMove function
    const handleMove = (updatedClientsData) => {
        const updatedRoomUsers = updatedClientsData.reduce((acc, user) => {
            acc[user.id] = {
                position: user.position,
                rotation: user.rotation,
            };
            return acc;
        }, {});

        setRoomUsers(updatedRoomUsers);
    };

    // Add the useEffect to subscribe to the "move" event
    useEffect(() => {
        if (socketClient) {
            socketClient.on("move", handleMove);

            return () => {
                socketClient.off("move", handleMove);
            };
        }
    }, [socketClient]);

    return (
        <SocketContext.Provider
            value={{
                me,
                socketClient,
                setSocketClient,
                joinRoom,
                createRoom,
                roomId,
                setRoomId,
                currentRoom,
                setCurrentRoom,
                roomUsers,
                usersInfo,
                setUsersInfo,
            }}
        >
            {children}
        </SocketContext.Provider>
    );
};

export { ContextProvider, SocketContext };
