import { createRoot, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import {
  Mesh, MeshBasicMaterial, PerspectiveCamera, PlaneGeometry, SRGBColorSpace,
  TextureLoader, Vector2, WebGLRenderer,
} from 'three'

type Artwork = {
  button: HTMLButtonElement
  url: string
  width: number
  x: number
  y: number
  distance: number
  opacity: number
  order: number
  highlighted: boolean
}
type RenderFrame = (width: number, height: number, artwork: Artwork[]) => void

function Exhibition({ ready }: { ready: (draw: RenderFrame) => void }) {
  const { scene, camera, invalidate, setSize } = useThree()
  const perspective = camera as PerspectiveCamera
  const geometry = useMemo(() => new PlaneGeometry(1, 1), [])
  const loader = useMemo(() => new TextureLoader(), [])

  useLayoutEffect(() => {
    const cards = new Map<HTMLButtonElement, {
      mesh: Mesh<PlaneGeometry, MeshBasicMaterial>
      loaded: boolean
      ratio: number
      corner: { value: Vector2 }
    }>()
    let size = { width: 0, height: 0 }
    let latest: Artwork[] = []
    let disposed = false

    function draw(width: number, height: number, artwork: Artwork[]) {
      latest = artwork
      if (size.width !== width || size.height !== height) {
        size = { width, height }
        setSize(width, height)
        perspective.fov = 2 * Math.atan(height / 2700) * 180 / Math.PI
        perspective.updateProjectionMatrix()
      }
      const visible = new Set<HTMLButtonElement>()
      for (const item of artwork) {
        visible.add(item.button)
        let card = cards.get(item.button)
        if (!card) {
          const material = new MeshBasicMaterial({
            transparent: true, depthTest: false, depthWrite: false, toneMapped: false,
          })
          const mesh = new Mesh(geometry, material)
          const corner = { value: new Vector2() }
          material.onBeforeCompile = shader => {
            shader.uniforms.cornerRadiusUV = corner
            shader.fragmentShader = shader.fragmentShader
              .replace('void main() {', 'uniform vec2 cornerRadiusUV;\nvoid main() {')
              .replace('#include <map_fragment>', `#include <map_fragment>
                #ifdef USE_MAP
                  vec2 cornerPoint = max(abs(vMapUv - 0.5) - (0.5 - cornerRadiusUV), 0.0);
                  float edge = length(cornerPoint / cornerRadiusUV);
                  float feather = max(fwidth(edge), 0.001);
                  diffuseColor.a *= 1.0 - smoothstep(1.0 - feather, 1.0 + feather, edge);
                #endif`)
          }
          const entry = { mesh, loaded: false, ratio: 1, corner }
          card = entry
          cards.set(item.button, entry)
          scene.add(mesh)
          loader.load(item.url, texture => {
            if (disposed) { texture.dispose(); return }
            texture.colorSpace = SRGBColorSpace
            material.map = texture
            material.needsUpdate = true
            entry.ratio = texture.image.height / texture.image.width
            entry.loaded = true
            item.button.classList.add('has-webgl-art')
            draw(size.width, size.height, latest)
          }, undefined, () => {
            // The original image remains available when a texture fails to load.
          })
        }
        const { mesh, ratio, loaded } = card
        const baseWidth = parseFloat(item.button.style.width)
        card.corner.value.set(6 / baseWidth, 6 / (baseWidth * ratio))
        const hover = item.highlighted ? 1.055 : 1
        mesh.visible = loaded
        mesh.position.set(item.x, -item.y, -item.distance)
        mesh.scale.set(item.width * hover, item.width * ratio * hover, 1)
        mesh.renderOrder = item.order
        mesh.material.opacity = item.opacity

      }
      for (const [button, card] of cards) {
        if (!visible.has(button)) card.mesh.visible = false
      }
      invalidate()
    }

    ready(draw)
    return () => {
      disposed = true
      for (const [button, { mesh }] of cards) {
        button.classList.remove('has-webgl-art')
        scene.remove(mesh)
        mesh.material.map?.dispose()
        mesh.material.dispose()
      }
      geometry.dispose()
    }
  }, [scene, perspective, invalidate, setSize, ready, geometry, loader])
  return null
}

export async function mountExhibition(canvas: HTMLCanvasElement): Promise<RenderFrame> {
  const gl = new WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'high-performance' })
  const root = createRoot(canvas)
  await root.configure({
    gl, dpr: [1, 1.75], frameloop: 'demand',
    camera: { position: [0, 0, 0], near: 10, far: 5000 },
  })
  return new Promise(resolve => root.render(<Exhibition ready={resolve} />))
}
