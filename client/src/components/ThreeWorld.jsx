import React, {
    useEffect,
    useContext,
    Suspense,
    useState,
    useRef,
} from "react";
import { Canvas, useThree, useLoader } from "@react-three/fiber";
import { Physics, usePlane, useBox, useSphere } from "@react-three/cannon";
import * as THREE from "three";

import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader";
import { MTLLoader } from "three/examples/jsm/loaders/MTLLoader";

import { OrbitControls, Text, Box, Sphere } from "@react-three/drei";
import { PerspectiveCamera, GradientTexture } from "@react-three/drei";

import Scene from "./three/scene";
import Cactus from "./three/cactus";
import { SocketContext } from "../Context";

// Create a Rocket component to load the model and material
const Rocket = ({ color }) => {
    const mtl = useLoader(MTLLoader, "/rocket/CartoonRocket.mtl");
    const obj = useLoader(OBJLoader, "/rocket/CartoonRocket.obj", (loader) => {
        mtl.preload();
        loader.setMaterials(mtl);
    });

    const clonedObj = obj.clone();

    return <primitive object={clonedObj} />;
};

const UserWrapper = React.forwardRef(
    ({ position, rotation, id, usersInfo }, ref) => {
        const user = usersInfo[id];

        return (
            <group>
                <mesh position={position} rotation={rotation}>
                    {/* <Text
                        position={[0, 0, -6]}
                        color="black"
                        anchorX="center"
                        anchorY="middle"
                    >
                        {user?.name}
                    </Text> */}
                    <group position={[0, -1, -3]}>
                        <group
                            ref={ref}
                            rotation={[-1, rotation[1], 0]}
                            scale={[0.3, 0.3, 0.3]}
                        >
                            <Rocket color={user?.color} />
                        </group>
                    </group>

                    {/* <Box position={[0, -1, -5]} rotation={rotation}>
                        <meshStandardMaterial
                            attach="material"
                            color={user?.color}
                        />
                    </Box> */}

                    {/* <Cube position={[0, -1, -2]} rotation={rotation} /> */}
                </mesh>
            </group>
        );
    }
);

const CustomCamera = ({ setCamera }) => {
    const { camera } = useThree();
    const { me: id, socketClient, usersInfo } = useContext(SocketContext);
    const [moveLeft, setMoveLeft] = useState(false);
    const [moveRight, setMoveRight] = useState(false);

    useEffect(() => {
        camera.position.set(0, 3, -8);
        setCamera(camera);
    }, [setCamera, camera]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === "a") {
                setMoveLeft(true);
            } else if (event.key === "d") {
                setMoveRight(true);
            }
        };

        const handleKeyUp = (event) => {
            if (event.key === "a") {
                setMoveLeft(false);
            } else if (event.key === "d") {
                setMoveRight(false);
            }
        };

        const handleWindowKeyDown = (event) => {
            handleKeyDown(event);
        };

        const handleWindowKeyUp = (event) => {
            handleKeyUp(event);
        };

        window.addEventListener("keydown", handleWindowKeyDown);
        window.addEventListener("keyup", handleWindowKeyUp);

        return () => {
            window.removeEventListener("keydown", handleWindowKeyDown);
            window.removeEventListener("keyup", handleWindowKeyUp);
        };
    }, []);

    useEffect(() => {
        const moveCamera = () => {
            if (moveLeft) {
                camera.position.x -= 0.2;
            } else if (moveRight) {
                camera.position.x += 0.2;
            }
        };

        const intervalId = setInterval(moveCamera, 16); // Move the camera every 16ms

        return () => clearInterval(intervalId);
    }, [camera, moveLeft, moveRight]);

    const handleControlsChange = () => {
        const posArray = [];
        const rotArray = [];

        camera.position.toArray(posArray);
        camera.rotation.toArray(rotArray);

        socketClient.emit("move", {
            id,
            position: posArray,
            rotation: rotArray,
        });
    };

    return (
        <>
            <PerspectiveCamera
                ref={camera}
                fov={50}
                aspect={1}
                near={0.1}
                far={1000}
                position={[0, 0, 10]}
            ></PerspectiveCamera>
            <OrbitControls
                camera={camera}
                onChange={handleControlsChange}
                // enableRotate={false}
                enablePan={false}
            />
        </>
    );
};

function Plane(props) {
    const [ref] = usePlane(() => ({
        rotation: [-Math.PI / 2, 0, 0],
        ...props,
    }));
    return (
        <mesh receiveShadow ref={ref}>
            <planeGeometry args={[50, 50]} />
            <meshBasicMaterial>
                <GradientTexture
                    stops={[0.1, 0.9]} // As many stops as you want
                    colors={["#be7361", "#ffba80"]} // Colors need to match the number of stops
                />
            </meshBasicMaterial>
        </mesh>
    );
}

function Cube(props) {
    const [ref] = useBox(() => ({ mass: 1, ...props }));
    return (
        <mesh castShadow ref={ref}>
            <boxGeometry />
            <meshStandardMaterial color="orange" />
        </mesh>
    );
}

const PhySphere = ({ position, direction, color = "#f55951", ...props }) => {
    const [ref, api] = useSphere(() => ({ args: [0.1], mass: 5, position }));

    useEffect(() => {
        if (direction) {
            api.applyImpulse(direction, [0, 0, 0]);
        }
    }, [api, direction]);

    return (
        <Sphere args={[0.1]} ref={ref}>
            <meshStandardMaterial color={color} />
        </Sphere>
    );
};

const ThreeWorld = () => {
    const {
        me: id,
        usersInfo,
        socketClient,
        roomUsers,
    } = useContext(SocketContext);
    const [projectiles, setProjectiles] = useState([]);

    const [camera, setCamera] = useState(null);

    const userRefs = useRef({});

    useEffect(() => {
        const onClick = (event) => {
            if (!camera) return;

            const rocketRef = userRefs.current[id];
            if (!rocketRef.current) return;

            const rocketPosition = new THREE.Vector3();
            rocketRef.current.getWorldPosition(rocketPosition);

            const direction = new THREE.Vector3();
            camera.getWorldDirection(direction);
            direction.multiplyScalar(120);

            // Add randomness to the direction
            const randomness = 7; // Adjust this to add more or less randomness
            direction.x += (Math.random() - 0.5) * randomness;
            direction.y += (Math.random() - 0.5) * randomness;
            direction.z += (Math.random() - 0.5) * randomness;

            // Always add a little upward component to the direction
            const upwardComponent = new THREE.Vector3(0, 50, 0);
            direction.add(upwardComponent);
            // Get the current user's color
            const userColor = usersInfo[id]?.color || "#ffffff";

            const newProjectile = {
                id: Math.random(),
                position: rocketPosition.toArray(),
                direction: direction.toArray(),
                color: userColor,
                createdAt: Date.now(),
            };

            setProjectiles((oldProjectiles) => [
                ...oldProjectiles,
                newProjectile,
            ]);

            // Emit a new event for the new projectile
            socketClient.emit("newProjectile", newProjectile);
        };

        window.addEventListener("click", onClick);
        return () => window.removeEventListener("click", onClick);
    }, [camera, usersInfo, setProjectiles, socketClient, id]);

    useEffect(() => {
        // Cleanup projectiles every second
        const intervalId = setInterval(() => {
            setProjectiles((oldProjectiles) => {
                return oldProjectiles.filter(
                    (p) => Date.now() - p.createdAt < 10000 // Keep projectiles that are less than 5 seconds old
                );
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        const handleNewProjectile = (newProjectile) => {
            setProjectiles((oldProjectiles) => [
                ...oldProjectiles,
                newProjectile,
            ]);
        };

        socketClient.on("newProjectile", handleNewProjectile);
        return () => socketClient.off("newProjectile", handleNewProjectile);
    }, [socketClient, setProjectiles]);

    return (
        <div id="world">
            <Suspense>
                <Canvas camera={{ position: [0, 1, -5], near: 0.1, far: 1000 }}>
                    <ambientLight intensity={0.5} />
                    <pointLight position={[10, 10, 10]} />
                    <gridHelper rotation={[0, 0, 0]} />

                    <Physics>
                        {Object.entries(roomUsers).map(([userId, user]) => {
                            if (!userRefs.current[userId]) {
                                userRefs.current[userId] = React.createRef();
                            }
                            return (
                                <UserWrapper
                                    key={userId}
                                    id={userId}
                                    position={user.position}
                                    rotation={user.rotation}
                                    color={user.color}
                                    usersInfo={usersInfo}
                                    ref={userRefs.current[userId]}
                                />
                            );
                        })}
                        {/* <PhySphere position={[0, 2, 5]} /> */}
                        {projectiles.map((proj) => (
                            <PhySphere
                                key={proj.id}
                                position={proj.position}
                                direction={proj.direction}
                                color={proj.color}
                            />
                        ))}
                        <CustomCamera setCamera={setCamera} />
                        <Plane />

                        <Cube position={[0, 2, -8]} />
                        <Cube position={[0, 2, 8]} />
                        <Cube position={[-8, 2, 0]} />
                        <Cube position={[8, 2, 0]} />
                        <Suspense fallback={null}>
                            {[...Array(20)].map((_, i) => (
                                <Cactus
                                    key={i}
                                    position={[
                                        Math.random() * 30 - 15,
                                        0,
                                        Math.random() * 30 - 15,
                                    ]}
                                />
                            ))}
                        </Suspense>
                    </Physics>
                    <Scene />
                </Canvas>
            </Suspense>
        </div>
    );
};

export default ThreeWorld;
