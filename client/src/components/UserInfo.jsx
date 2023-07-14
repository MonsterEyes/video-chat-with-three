import React, { useContext } from "react";
import { Text } from "@react-three/drei";

import { SocketContext } from "../Context";

function UsersInfo({ userId, renderMode }) {
    const { usersInfo } = useContext(SocketContext);

    const user = usersInfo[userId];

    if (!user) {
        return null;
    }

    const { name, color } = user;

    return renderMode === "three" ? (
        <Text color={color} anchorX="center" anchorY="middle">
            {name}
        </Text>
    ) : (
        <div style={{ color: color }}>{name}</div>
    );
}

export default UsersInfo;
