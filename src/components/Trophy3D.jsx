import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { COLORS } from '../data/board.js'

function Pawn({ color, angle, radius }) {
  const ref = useRef()
  useFrame(({ clock }) => {
    if (!ref.current) return
    ref.current.position.y = -0.25 + Math.sin(clock.elapsedTime * 1.4 + angle) * 0.04
  })
  const x = Math.cos(angle) * radius
  const z = Math.sin(angle) * radius
  return (
    <group ref={ref} position={[x, -0.25, z]}>
      <mesh position={[0, -0.08, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.08, 24]} />
        <meshPhysicalMaterial color={color} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh position={[0, 0.16, 0]}>
        <coneGeometry args={[0.16, 0.42, 24]} />
        <meshPhysicalMaterial color={color} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.09, 16, 16]} />
        <meshPhysicalMaterial color={color} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
    </group>
  )
}

function Medal() {
  const ref = useRef()
  useFrame((_, dt) => { if (ref.current) ref.current.rotation.y += dt * 0.7 })
  return (
    <group ref={ref} position={[0, 0.1, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.34, 0.07, 16, 40]} />
        <meshPhysicalMaterial color="#f0b40c" metalness={1} roughness={0.25} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.27, 32]} />
        <meshPhysicalMaterial color="#ffd558" metalness={0.85} roughness={0.22} side={2} emissive="#7a4a00" emissiveIntensity={0.25} />
      </mesh>
    </group>
  )
}

export default function Trophy3D({ winnerSeat }) {
  const seats = COLORS.map((c, i) => ({ ...c, i })).filter((c) => c.i !== winnerSeat)
  const order = [winnerSeat, ...seats.map((s) => s.i)]
  return (
    <div className="trophy3d-stage">
      <Canvas camera={{ position: [0, 1.1, 2.4], fov: 36 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.65} />
        <directionalLight position={[2, 3, 2]} intensity={1.5} />
        <directionalLight position={[-2, 1.5, -1]} intensity={0.5} color="#ffd9a0" />
        <pointLight position={[0, 2, 1.5]} intensity={0.7} color="#fff6e0" />
        <Medal />
        {order.map((seat, k) => (
          <Pawn key={seat} color={COLORS[seat].hex} angle={(k / order.length) * Math.PI * 2 - Math.PI / 2} radius={0.72} />
        ))}
      </Canvas>
    </div>
  )
}
