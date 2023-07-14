import React, { useContext } from "react";
import { SocketContext } from "./Context";

import Peers from "./components/peers";
import ThreeWorld from "./components/ThreeWorld";
import Chat from "./components/chat";

const App = () => {
    const { joinRoom, socket, currentRoom, socketClient, roomId, setRoomId } =
        useContext(SocketContext);

    const handleJoinRoom = () => {
        joinRoom(roomId, socketClient);
    };

    const createRoom = (roomId) => {
        if (socket) {
            socket.emit("create_room", roomId, (created) => {
                if (created) {
                    setRoomId(roomId);
                    joinRoom(roomId, socketClient);
                }
            });
        }
    };

    return (
        <>
            {!currentRoom && (
                <div>
                    <input
                        type="text"
                        placeholder="Enter room ID"
                        value={roomId}
                        onChange={(e) => setRoomId(e.target.value)}
                    />
                    <button onClick={handleJoinRoom}>Join Room</button>
                    <button onClick={() => createRoom(roomId)}>
                        Create Room
                    </button>
                </div>
            )}
            {currentRoom && (
                <>
                    <h4>Current Room: {currentRoom}</h4>
                    <Peers />
                    <Chat roomId={currentRoom} id="chat" />
                    <ThreeWorld id="world" />
                </>
            )}
        </>
    );
};

export default App;
