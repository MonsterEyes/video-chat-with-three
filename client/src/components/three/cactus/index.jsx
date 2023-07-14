import { MeshWobbleMaterial, useGLTF } from "@react-three/drei";
import { useBox } from "@react-three/cannon";

export default function Cactus({ position }) {
    const { nodes, materials } = useGLTF("/level-react-draco.glb");
    const [ref] = useBox(() => ({
        mass: 1,
        position: position,
        rotation: [Math.PI / 2, 0, 0],
        args: [0.7, 0.5, 0.5],
    }));

    return (
        <mesh ref={ref} geometry={nodes.Cactus.geometry}>
            <MeshWobbleMaterial factor={0.4} map={materials.Cactus.map} />
        </mesh>
    );
}
