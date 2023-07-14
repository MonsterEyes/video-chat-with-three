const express = require("express");
const http = require("http");
const cors = require("cors");
const path = require("path");
const app = express();
const server = http.createServer(app);
const { randAnimal, randHex } = require("@ngneat/falso");

const io = require("socket.io")(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
    },
});

// Middleware for development environment
if (process.env.NODE_ENV === "development") {
    const proxy = require("http-proxy-middleware");
    app.use("/static", proxy({ target: "http://localhost:3001" }));
    app.use("/sockjs-node", proxy({ target: "http://localhost:3001" }));
} else {
    // Serve static files from the React app in production environment
    app.use(express.static(path.join(__dirname, "client/build")));
}

app.use(cors());

const PORT = 3000;

app.get("/", (req, res) => {
    res.send("Running");
});

const rooms = {};

io.on("connection", (socket) => {
    console.log(
        `User ${socket.id} connected, there are currently ${io.engine.clientsCount} users connected`
    );

    socket.emit("me", socket.id);

    socket.on("create_room", (roomId) => {
        socket.join(roomId);
        console.log(`Room ${roomId} created.`);
    });

    socket.on("join", ({ roomId }) => {
        socket.join(roomId);

        // Get the room users
        const roomUsers = Array.from(io.sockets.adapter.rooms.get(roomId));

        // Send the room users back to the client
        socket.emit(
            "room_users_ids",
            roomUsers.filter((id) => id !== socket.id)
        );

        // Send a signal event to other users in the room
        roomUsers
            .filter((id) => id !== socket.id)
            .forEach((userID) =>
                io.to(userID).emit("new_user_joined", { id: socket.id })
            );

        socket.on("return_signal", (data) => {
            io.to(data.id).emit("return_signal", {
                id: socket.id,
                signal: data.signal,
            });
        });

        socket.on("signal", (data) => {
            io.to(data.id).emit("signal", {
                id: socket.id,
                signal: data.signal,
            });
        });

        socket.on("disconnect", () => {
            io.to(roomId).emit("user-disconnected", socket.id);
        });
    });

    socket.on("join_room", (roomId) => {
        if (!rooms[roomId]) {
            rooms[roomId] = { users: {} };
        }

        rooms[roomId].users[socket.id] = {
            socket: socket,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            color: randHex(),
            name: randAnimal(),
        };
        socket.join(roomId);
        console.log(`User ${socket.id} joined room ${roomId}`);

        // Emit the updated users list to all users in the room
        const roomUsers = Object.keys(rooms[roomId].users).reduce(
            (acc, userId) => {
                acc[userId] = { ...rooms[roomId].users[userId] };
                delete acc[userId].socket; // We don't want to send the socket object to the clients
                return acc;
            },
            {}
        );
        io.to(roomId).emit("room_users", roomUsers);
        socket.to(roomId).emit("user_joined", { id: socket.id });

        // Emit the initial clients data to the new user
        const initialClientsData = Object.values(rooms[roomId].users).map(
            (user) => ({
                id: user.socket.id,
                position: user.position,
                rotation: user.rotation,
            })
        );

        io.to(roomId).emit("move", initialClientsData);

        const usersData = Object.entries(rooms[roomId].users).reduce(
            (acc, [id, { name, color }]) => {
                acc[id] = { name, color };
                return acc;
            },
            {}
        );

        io.to(roomId).emit("user_data", usersData);

        socket.on("move", ({ id, rotation, position }) => {
            if (rooms[roomId].users[id]) {
                rooms[roomId].users[id].position = position;
                rooms[roomId].users[id].rotation = rotation;

                // Emit the updated clients data to all users in the room
                const updatedClientsData = Object.values(
                    rooms[roomId].users
                ).map((user) => ({
                    id: user.socket.id,
                    position: user.position,
                    rotation: user.rotation,
                }));

                io.to(roomId).emit("move", updatedClientsData);
            } else {
                console.warn(
                    `Client with id ${id} not found in clients object`
                );
            }
        });

        socket.on("update_user_info", ({ name, color, roomId }) => {
            console.log(
                `User ${socket.id} updated name to ${name} and color to ${color} in room ${roomId}.`
            );

            // Access the users object within the room object
            const users = rooms[roomId].users;

            // Find the user by socket.id
            const user = Object.values(users).find(
                (user) => user.socket.id === socket.id
            );

            if (user) {
                user.name = name;
                user.color = color;

                // Determine team based on the current number of users
                const userCount = Object.keys(users).length;
                if (userCount % 4 === 0) {
                    user.team = 4;
                } else if (userCount % 3 === 0) {
                    user.team = 3;
                } else if (userCount % 2 === 0) {
                    user.team = 2;
                } else {
                    user.team = 1;
                }
            }

            // Emit the updated user data to the room
            const usersData = Object.entries(users).reduce(
                (acc, [id, { name, color, team }]) => {
                    acc[id] = { name, color, team };
                    return acc;
                },
                {}
            );

            io.to(roomId).emit("user_data", usersData);
        });

        socket.on("send_message", ({ roomId, message }) => {
            const users = rooms[roomId].users;
            const user = Object.values(users).find(
                (user) => user.socket.id === socket.id
            );

            if (!user) {
                console.error(`User not found: ${socket.id}`);
                return;
            }

            const userName = user.name;

            // Broadcast the message to everyone in the room, including the sender
            io.in(roomId).emit("receive_message", {
                userId: socket.id,
                userName,
                message,
            });
        });

        socket.on("newProjectile", (newProjectile) => {
            // Broadcast the new projectile to all other clients in the room
            socket.broadcast.to(roomId).emit("newProjectile", newProjectile);
        });

        // Handle disconnect
        socket.on("disconnect", () => {
            console.log(`User ${socket.id} disconnected from room ${roomId}`);
            if (rooms[roomId]) {
                delete rooms[roomId].users[socket.id];

                if (Object.keys(rooms[roomId].users).length === 0) {
                    delete rooms[roomId];
                } else {
                    io.to(roomId).emit(
                        "room_users",
                        Object.keys(rooms[roomId].users)
                    );
                    socket.to(roomId).emit("user_left", socket.id);
                }
            }
        });
    });
});

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
