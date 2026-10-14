import { useEffect, useRef } from 'react'
import * as THREE from 'three'

export default function ThreeBackground() {
  const ref = useRef<HTMLCanvasElement>(null)
  const raf = useRef<number>(0)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x0a0a12, 12, 28)

    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100)
    camera.position.set(0, 1.5, 9)

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8))
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setClearColor(0x080a14, 1)

    // lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.6))
    const dir = new THREE.DirectionalLight(0xffffff, 0.9)
    dir.position.set(5, 8, 5)
    scene.add(dir)
    const point1 = new THREE.PointLight(0x7c3aed, 2.2, 20)
    point1.position.set(-4, 2, 2)
    scene.add(point1)
    const point2 = new THREE.PointLight(0x06b6d4, 1.8, 20)
    point2.position.set(4, -1, 3)
    scene.add(point2)

    // floating torus + icosahedron
    const torusGeo = new THREE.TorusGeometry(1.2, 0.32, 22, 48)
    const torusMat = new THREE.MeshStandardMaterial({ color: 0x7c3aed, metalness: 0.35, roughness: 0.35, emissive: 0x4c1d95, emissiveIntensity: 0.18 })
    const torus = new THREE.Mesh(torusGeo, torusMat)
    torus.position.set(-3.2, 0.6, -1)
    torus.rotation.set(0.6, 0.4, 0)
    scene.add(torus)

    const icoGeo = new THREE.IcosahedronGeometry(1.0, 1)
    const icoMat = new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.4, roughness: 0.3, emissive: 0x0e7490, emissiveIntensity: 0.15 })
    const ico = new THREE.Mesh(icoGeo, icoMat)
    ico.position.set(3.4, -0.4, -0.5)
    scene.add(ico)

    const knotGeo = new THREE.TorusKnotGeometry(0.7, 0.18, 90, 16)
    const knotMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.3, roughness: 0.4, emissive: 0x92400e, emissiveIntensity: 0.12 })
    const knot = new THREE.Mesh(knotGeo, knotMat)
    knot.position.set(0.2, -2.0, -2)
    scene.add(knot)

    // particles
    const count = 900
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 22
      pos[i * 3 + 1] = (Math.random() - 0.5) * 14
      pos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 2
    }
    const pGeo = new THREE.BufferGeometry()
    pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const pMat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.04, transparent: true, opacity: 0.55, sizeAttenuation: true })
    const points = new THREE.Points(pGeo, pMat)
    scene.add(points)

    // subtle grid plane
    const gridGeo = new THREE.PlaneGeometry(30, 30, 20, 20)
    const gridMat = new THREE.MeshBasicMaterial({ color: 0x1e293b, wireframe: true, transparent: true, opacity: 0.12 })
    const grid = new THREE.Mesh(gridGeo, gridMat)
    grid.rotation.x = -Math.PI / 2.35
    grid.position.y = -3.2
    grid.position.z = -2
    scene.add(grid)

    let mouseX = 0, mouseY = 0
    const onMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 1.2
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.6
    }
    window.addEventListener('mousemove', onMove)

    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    let t = 0
    const animate = () => {
      t += 0.008
      torus.rotation.y += 0.004
      torus.rotation.x += 0.002
      torus.position.y = 0.6 + Math.sin(t * 0.9) * 0.25
      ico.rotation.y += 0.006
      ico.rotation.z += 0.003
      ico.position.y = -0.4 + Math.sin(t * 1.1 + 1) * 0.22
      knot.rotation.y += 0.005
      knot.rotation.x += 0.003
      points.rotation.y += 0.0007
      // parallax
      camera.position.x += (mouseX * 1.2 - camera.position.x) * 0.02
      camera.position.y += (-mouseY * 0.8 + 1.5 - camera.position.y) * 0.02
      camera.lookAt(0, 0, -1)
      renderer.render(scene, camera)
      raf.current = requestAnimationFrame(animate)
    }
    animate()

    return () => {
      cancelAnimationFrame(raf.current)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
      torusGeo.dispose(); icoGeo.dispose(); knotGeo.dispose(); pGeo.dispose()
      ;(torusMat as any).dispose?.(); (icoMat as any).dispose?.(); (knotMat as any).dispose?.()
    }
  }, [])

  return <canvas ref={ref} className="fixed inset-0 -z-10 block" aria-hidden />
}
