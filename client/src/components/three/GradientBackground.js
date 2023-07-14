import { SphereGeometry, ShaderMaterial, BackSide, Mesh } from "three";
import * as THREE from "three";

export default function GradientBackground() {
    const vertexShader = `
        varying vec3 vWorldPosition;

        void main() {
            vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
            vWorldPosition = worldPosition.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

    const fragmentShader = `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;

        void main() {
            float h = normalize( vWorldPosition + offset ).y;
            gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max(h, 0.0), exponent ), 0.0 ) ), 1.0 );
        }
    `;

    // #343f5f #538a93

    // #665d77 #8a8c9c
    // #2b3053 #556b8c
    // #405871 #559298

    const geometry = new SphereGeometry(500, 32, 32);
    const material = new ShaderMaterial({
        side: BackSide,
        vertexShader,
        fragmentShader,
        uniforms: {
            topColor: { value: new THREE.Color("#528b93") },
            bottomColor: { value: new THREE.Color("#528b93") },
            offset: { value: 33 },
            exponent: { value: 0.6 },
        },
    });
    const mesh = new Mesh(geometry, material);

    return <primitive object={mesh} />;
}
