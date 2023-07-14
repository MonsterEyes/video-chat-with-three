import React, { useEffect, useRef, useState, useContext } from "react";
import { SocketContext } from "../Context";
import Peer from "simple-peer";
import UserSettings from "./UserSettings";
import UserInfo from "./UserInfo";

const Peers = () => {
    const { socketClient, roomId, me } = useContext(SocketContext);

    const [peers, setPeers] = useState([]);
    const userVideo = useRef();
    const peersRef = useRef({});

    useEffect(() => {
        navigator.mediaDevices
            .getUserMedia({ video: true, audio: true })
            .then((stream) => {
                userVideo.current.srcObject = stream;

                socketClient.emit("join", { roomId });

                const addPeer = (peerID, peer) => {
                    peersRef.current[peerID] = peer;
                    setPeers(Object.values(peersRef.current));
                };

                const removePeer = (peerID) => {
                    delete peersRef.current[peerID];
                    setPeers(Object.values(peersRef.current));
                };

                const createPeer = (id) => {
                    const peer = new Peer({
                        initiator: true,
                        trickle: false,
                        stream: userVideo.current.srcObject,
                        config: { channels: [{}] },
                    });

                    const newPeer = {
                        peerID: id,
                        peer,
                        stream: userVideo.current.srcObject,
                    };

                    peer.on("signal", (signal) => {
                        console.log("Signal event fired for peer:", id);
                        socketClient.emit("send_signal", { id, signal });
                    });

                    peer.on("stream", (stream) => {
                        newPeer.stream = stream;
                    });

                    addPeer(id, newPeer);
                };

                socketClient.on("new_user_joined", ({ id }) => {
                    if (peersRef.current[id]) {
                        removePeer(id);
                    }
                    createPeer(id);
                });

                socketClient.on("signal", ({ id, signal }) => {
                    peersRef.current[id]?.peer.signal(signal);
                });

                socketClient.on("return_signal", ({ id, signal }) => {
                    peersRef.current[id]?.peer.signal(signal);
                });

                socketClient.on("disconnect", (id) => {
                    console.warn(
                        "Disconnect event received. Use 'user_left' event instead."
                    );
                });

                socketClient.on("user_left", (id) => {
                    removePeer(id);
                });

                socketClient.on("room_users_ids", (roomUsers) => {
                    if (Array.isArray(roomUsers)) {
                        roomUsers.forEach(createPeer);
                    } else {
                        console.error(
                            "room_users_ids event received non-array data:",
                            roomUsers
                        );
                    }
                });
            })
            .catch((error) => {
                console.error("Error accessing media devices.", error);
            });
    }, [roomId, socketClient]);

    return (
        <div id="peers">
            <div>
                <video
                    style={{ width: "150px" }}
                    ref={userVideo}
                    autoPlay
                    muted
                />
                <UserSettings userId={me} />
            </div>
            {peers.map((peerObj) => {
                return (
                    <div key={peerObj.peerID}>
                        <Video
                            key={peerObj.peerID}
                            peerID={peerObj.peerID}
                            stream={peerObj.stream}
                        />
                        <UserInfo userId={peerObj.peerID} renderMode="div" />
                    </div>
                );
            })}
        </div>
    );
};

const Video = ({ stream }) => {
    const ref = useRef();

    useEffect(() => {
        if (stream) {
            ref.current.srcObject = stream;
        }
    }, [stream]);

    return <video style={{ width: "150px" }} ref={ref} autoPlay />;
};

export default Peers;
