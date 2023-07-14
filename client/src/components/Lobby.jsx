import React, { useState } from "react";
import { useHistory } from "react-router-dom";

const Lobby = ({ rooms, handleCreateRoom, handleJoinRoom }) => {
    const [roomName, setRoomName] = useState("");
    const history = useHistory();

    const handleRoomNameChange = (e) => {
        setRoomName(e.target.value);
    };

    const handleRoomClick = (roomId) => {
        history.push(`/room/${roomId}`);
    };

    return (
        <div>
            <h2>Rooms:</h2>
            <ul>
                {Object.keys(rooms).map((roomId) => (
                    <li key={roomId} onClick={() => handleRoomClick(roomId)}>
                        {rooms[roomId].name} ({rooms[roomId].users.length})
                    </li>
                ))}
            </ul>
            <h2>Create Room:</h2>
            <div>
                <input
                    type="text"
                    placeholder="Room Name"
                    value={roomName}
                    onChange={handleRoomNameChange}
                />
                <button onClick={() => handleCreateRoom(roomName)}>
                    Create Room
                </button>
            </div>
            <h2>Join Room:</h2>
            <div>
                <select>
                    {Object.keys(rooms).map((roomId) => (
                        <option key={roomId} value={roomId}>
                            {rooms[roomId].name}
                        </option>
                    ))}
                </select>
                <button onClick={() => handleJoinRoom()}>Join Room</button>
            </div>
        </div>
    );
};

export default Lobby;
