import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { RoundedBox, ContactShadows } from '@react-three/drei'
import * as THREE from 'three'

// opposite faces sum to 7: +Y=1 -Y=6 +X=2 -X=5 +Z=3 -Z=4
const SETTLE = {
  1: [0, 0, 0],
  2: [0, 0, Math.PI / 2],
  3: [-Math.PI / 2, 0, 0],
  4: [Math.PI / 2, 0, 0],
  5: [0, 0, -Math.PI / 2],
  6: [Math.PI, 0, 0],
}

// pip layout per face, in a 3x3 grid of local offsets (±0.26)
const LAYOUT = {
  1: ['c'],
  2: ['tl', 'br'],
  3: ['tl', 'c', 'br'],
  4: ['tl', 'tr', 'bl', 'br'],
  5: ['tl', 'tr', 'c', 'bl', 'br'],
  6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'],
}
const OFF = { tl: [-0.26, 0.26], tr: [0.26, 0.26], ml: [-0.26, 0], mr: [0.26, 0], c: [0, 0], bl: [-0.26, -0.26], br: [0.26, -0.26] }

// face: value, normal axis, u-axis(local), v-axis(local) for pip placement
const FACES = [
  { value: 2, normal: [1, 0, 0], u: [0, 0, -1], v: [0, 1, 0] },   // +X
  { value: 5, normal: [-1, 0, 0], u: [0, 0, 1], v: [0, 1, 0] },   // -X
  { value: 1, normal: [0, 1, 0], u: [1, 0, 0], v: [0, 0, -1] },   // +Y
  { value: 6, normal: [0, -1, 0], u: [1, 0, 0], v: [0, 0, 1] },   // -Y
  { value: 3, normal: [0, 0, 1], u: [1, 0, 0], v: [0, 1, 0] },    // +Z
  { value: 4, normal: [0, 0, -1], u: [-1, 0, 0], v: [0, 1, 0] },  // -Z
]

function Pips() {
  const pips = []
  FACES.forEach((f) => {
    const keys = LAYOUT[f.value]
    const n = new THREE.Vector3(...f.normal)
    const u = new THREE.Vector3(...f.u)
    const v = new THREE.Vector3(...f.v)
    keys.forEach((k, i) => {
      const [ou, ov] = OFF[k]
      const pos = n.clone().multiplyScalar(0.515)
        .add(u.clone().multiplyScalar(ou))
        .add(v.clone().multiplyScalar(ov))
      pips.push(<mesh key={`${f.value}-${i}`} position={pos.toArray()}>
        <sphereGeometry args={[0.072, 16, 16]} />
        <meshStandardMaterial color="#fffdf5" roughness={0.3} />
      </mesh>)
    })
  })
  return <>{pips}</>
}

function Die({ color, value, rolling }) {
  const group = useRef()
  const t0 = useRef(0)
  const target = useMemo(() => new THREE.Euler(...SETTLE[value] || SETTLE[1]), [value])
  const spin = useMemo(() => new THREE.Vector3(
    6 + Math.random() * 3, 5 + Math.random() * 3, 4 + Math.random() * 3
  ), [rolling])

  useFrame((_, dt) => {
    if (!group.current) return
    if (rolling) {
      t0.current += dt
      group.current.rotation.x += spin.x * dt
      group.current.rotation.y += spin.y * dt
      group.current.rotation.z += spin.z * dt
      group.current.position.y = 0.55 + Math.max(0, 0.9 - t0.current * 2) * Math.abs(Math.sin(t0.current * 10))
    } else {
      t0.current = 0
      group.current.rotation.x = THREE.MathUtils.damp(group.current.rotation.x, target.x, 9, dt)
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, target.y, 9, dt)
      group.current.rotation.z = THREE.MathUtils.damp(group.current.rotation.z, target.z, 9, dt)
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, 0, 9, dt)
    }
  })

  return (
    <group ref={group} position={[0, 0.55, 0]}>
      <RoundedBox args={[1, 1, 1]} radius={0.12} smoothness={4}>
        <meshPhysicalMaterial color={color} roughness={0.12} clearcoat={1} clearcoatRoughness={0.08} metalness={0} />
      </RoundedBox>
      <Pips />
    </group>
  )
}

// Cup only exists on stage while `active` — it swoops in from the side,
// stands over the die, shakes, then tips away and lifts out of frame.
function Cup() {
  const ref = useRef()
  const t0 = useRef(0)
  useFrame((_, dt) => {
    if (!ref.current) return
    t0.current += dt
    const t = t0.current
    if (t < 0.18) {
      // swoop down from the side to cover the die
      const k = t / 0.18
      ref.current.position.set(THREE.MathUtils.lerp(-1.3, 0, k), THREE.MathUtils.lerp(1.6, 0.95, k), 0)
      ref.current.rotation.z = THREE.MathUtils.lerp(-0.6, 0, k)
    } else if (t < 0.55) {
      // shake in place over the die
      ref.current.position.set(Math.sin(t * 46) * 0.045, 0.95, 0)
      ref.current.rotation.z = Math.sin(t * 46) * 0.1
    } else {
      // tip over and lift away, releasing the die
      const k = Math.min(1, (t - 0.55) * 2.6)
      ref.current.rotation.z = THREE.MathUtils.lerp(0, -2.3, k)
      ref.current.position.x = THREE.MathUtils.lerp(0, -1.1, k)
      ref.current.position.y = THREE.MathUtils.lerp(0.95, 1.5, k)
    }
  })
  return (
    <group ref={ref} position={[-1.3, 1.6, 0]}>
      <mesh>
        <cylinderGeometry args={[0.44, 0.6, 0.95, 24, 1, true]} />
        <meshStandardMaterial color="#5a3420" roughness={0.55} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0.3, 0]}>
        <torusGeometry args={[0.52, 0.03, 8, 24]} />
        <meshStandardMaterial color="#2e1b0f" roughness={0.5} />
      </mesh>
    </group>
  )
}

export default function Dice3D({ value, rolling, color }) {
  const [shown, setShown] = useState(value || 1)
  const [cupActive, setCupActive] = useState(false)
  const prevRolling = useRef(rolling)

  useEffect(() => {
    if (rolling && !prevRolling.current) setCupActive(true)
    if (!rolling && prevRolling.current) {
      if (value) setShown(value)
      const t = setTimeout(() => setCupActive(false), 550)
      prevRolling.current = rolling
      return () => clearTimeout(t)
    }
    prevRolling.current = rolling
  }, [rolling, value])

  return (
    <div className="dice3d-stage">
      <Canvas camera={{ position: [1.9, 1.7, 2.6], fov: 30 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.55} />
        <directionalLight position={[2.2, 3.4, 2.4]} intensity={1.6} />
        <directionalLight position={[-2, 1.5, -1.5]} intensity={0.5} color="#ffd9a0" />
        <pointLight position={[-1.5, 1.2, 1.8]} intensity={0.6} color="#ffffff" />
        <mesh position={[0, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.4, 32]} />
          <meshStandardMaterial color="#d8ba7e" roughness={0.8} />
        </mesh>
        <Die color={color} value={shown} rolling={!!rolling} />
        {cupActive && <Cup />}
        <ContactShadows position={[0, -0.015, 0]} opacity={0.55} scale={3} blur={2.2} far={2} />
      </Canvas>
    </div>
  )
}
