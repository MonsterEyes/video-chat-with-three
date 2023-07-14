import { useThree } from "@react-three/fiber";
import { useEffect } from "react";
import * as THREE from "three";

// In your component
export default function Scene() {
    const { scene } = useThree();

    useEffect(() => {
        scene.background = new THREE.Color(0xffffff); // set to any color you like
    }, [scene]);

    return null; // Or return any children you want
}
