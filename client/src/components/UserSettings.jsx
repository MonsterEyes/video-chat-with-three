import React, { useState, useEffect, useContext, useCallback } from "react";
import { SocketContext } from "../Context";

const UserSettings = (userId) => {
    const { socketClient, roomId, usersInfo, setUsersInfo } =
        useContext(SocketContext);

    const [name, setName] = useState(usersInfo[userId.userId]?.name || "");
    const [color, setColor] = useState(
        usersInfo[userId.userId]?.color || "#000000"
    );

    const updateUser = useCallback(
        (id, name, color) => {
            setUsersInfo((prevUsers) => ({
                ...prevUsers,
                [id]: { name, color, roomId },
            }));
        },
        [setUsersInfo, roomId]
    );

    const handleNameChange = (event) => {
        const updatedName = event.target.value;
        setName(updatedName);
        socketClient.emit("update_user_info", {
            name: updatedName,
            color,
            roomId,
        });
    };

    const handleColorChange = (event) => {
        const updatedColor = event.target.value;
        setColor(updatedColor);
        socketClient.emit("update_user_info", {
            name,
            color: updatedColor,
            roomId,
        });
    };

    useEffect(() => {
        socketClient.on("update_user_info", ({ name, color }) => {
            setName(name);
            setColor(color);
        });
    }, [socketClient]);

    useEffect(() => {
        const handleUserData = (usersData) => {
            const currentUserData = usersData[userId.userId];
            if (currentUserData) {
                setName(currentUserData.name);
                setColor(currentUserData.color);
                updateUser(
                    userId.userId,
                    currentUserData.name,
                    currentUserData.color
                );
            }
        };

        socketClient.on("user_data", handleUserData);

        // Request initial user data
        socketClient.emit("get_user_data", { roomId });

        return () => {
            socketClient.off("user_data", handleUserData);
        };
    }, [socketClient, userId, roomId, updateUser]);

    return (
        <div>
            <form>
                <label>
                    {/* Name: */}
                    <input
                        type="text"
                        value={name}
                        onChange={handleNameChange}
                        style={{ color: color }}
                    />
                </label>
                <br />
                <label>
                    {/* Color: */}
                    <input
                        type="color"
                        value={color}
                        onChange={handleColorChange}
                    />
                </label>
            </form>
        </div>
    );
};

export default UserSettings;
