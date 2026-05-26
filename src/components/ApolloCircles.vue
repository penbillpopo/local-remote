<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

const W = 340
const H = 320

interface Circle {
  x: number
  y: number
  r: number
  label: string
}

const canvasRef = ref<HTMLCanvasElement | null>(null)
let rafId = 0
let dirty = true

const circles: Circle[] = [
  { x: 148, y: 148, r: 42, label: 'TEXT' },
  { x: 248, y: 188, r: 26, label: 'RADIUS' },
  { x: 182, y: 218, r: 20, label: '' },
]

let drag: { i: number; ox: number; oy: number } | null = null

function toCanvas(clientX: number, clientY: number): [number, number] {
  const cvs = canvasRef.value!
  const rect = cvs.getBoundingClientRect()
  return [
    (clientX - rect.left) * (W / rect.width),
    (clientY - rect.top) * (H / rect.height),
  ]
}

function hitTest(mx: number, my: number): number {
  for (let i = circles.length - 1; i >= 0; i--) {
    const { x, y, r } = circles[i]
    if ((mx - x) ** 2 + (my - y) ** 2 <= r * r) return i
  }
  return -1
}

function onMouseDown(e: MouseEvent) {
  const [mx, my] = toCanvas(e.clientX, e.clientY)
  const i = hitTest(mx, my)
  if (i >= 0) drag = { i, ox: mx - circles[i].x, oy: my - circles[i].y }
}

function onMouseMove(e: MouseEvent) {
  if (!drag) return
  const [mx, my] = toCanvas(e.clientX, e.clientY)
  circles[drag.i].x = mx - drag.ox
  circles[drag.i].y = my - drag.oy
  dirty = true
}

function onMouseUp() { drag = null }

function onTouchStart(e: TouchEvent) {
  e.preventDefault()
  const t = e.touches[0]
  const [mx, my] = toCanvas(t.clientX, t.clientY)
  const i = hitTest(mx, my)
  if (i >= 0) drag = { i, ox: mx - circles[i].x, oy: my - circles[i].y }
}

function onTouchMove(e: TouchEvent) {
  e.preventDefault()
  if (!drag) return
  const t = e.touches[0]
  const [mx, my] = toCanvas(t.clientX, t.clientY)
  circles[drag.i].x = mx - drag.ox
  circles[drag.i].y = my - drag.oy
  dirty = true
}

function onTouchEnd() { drag = null }

/**
 * Minimum enclosing circle for two circles A and B.
 * This circle is internally tangent to both A and B (contains them both).
 *
 * Derivation:
 *   Far point of A (away from B) = A.center - rA * unit(B-A)
 *   Far point of B (away from A) = B.center + rB * unit(B-A)
 *   Enclosing center = midpoint of those two far points
 *   Enclosing radius = dist(farA, farB) / 2 = (d + rA + rB) / 2
 */
function enclosingCircle(a: Circle, b: Circle): { x: number; y: number; r: number } {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const d = Math.sqrt(dx * dx + dy * dy)

  // One circle already contains the other
  if (d + a.r <= b.r) return { x: b.x, y: b.y, r: b.r }
  if (d + b.r <= a.r) return { x: a.x, y: a.y, r: a.r }

  const ux = dx / d
  const uy = dy / d
  const r = (d + a.r + b.r) / 2
  const cx = (a.x + b.x + (b.r - a.r) * ux) / 2
  const cy = (a.y + b.y + (b.r - a.r) * uy) / 2
  return { x: cx, y: cy, r }
}

function draw() {
  const cvs = canvasRef.value
  if (!cvs) return
  const ctx = cvs.getContext('2d')!

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // --- Layer 1: Three pairwise enclosing circles ---
  const pairs: [number, number][] = [[0, 1], [0, 2], [1, 2]]
  ctx.save()
  ctx.strokeStyle = 'rgba(160,160,160,0.75)'
  ctx.lineWidth = 1
  for (const [i, j] of pairs) {
    const enc = enclosingCircle(circles[i], circles[j])
    ctx.beginPath()
    ctx.arc(enc.x, enc.y, enc.r, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.restore()

  // --- Layer 2: Three main draggable circles ---
  for (let i = 0; i < circles.length; i++) {
    const c = circles[i]
    const active = drag?.i === i

    ctx.save()
    ctx.beginPath()
    ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(210,210,210,0.65)'
    ctx.fill()
    ctx.strokeStyle = active ? '#555' : '#999'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    if (c.label) {
      ctx.save()
      ctx.font = '11px "Helvetica Neue", Helvetica, Arial, sans-serif'
      ctx.fillStyle = '#555'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(c.label, c.x, c.y)
      ctx.restore()
    }
  }
}

function loop() {
  if (dirty) {
    draw()
    dirty = false
  }
  rafId = requestAnimationFrame(loop)
}

onMounted(() => {
  dirty = true
  loop()

  const cvs = canvasRef.value!
  cvs.addEventListener('mousedown', onMouseDown)
  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
  cvs.addEventListener('touchstart', onTouchStart, { passive: false })
  cvs.addEventListener('touchmove', onTouchMove, { passive: false })
  cvs.addEventListener('touchend', onTouchEnd)
})

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId)
  const cvs = canvasRef.value
  if (!cvs) return
  cvs.removeEventListener('mousedown', onMouseDown)
  window.removeEventListener('mousemove', onMouseMove)
  window.removeEventListener('mouseup', onMouseUp)
  cvs.removeEventListener('touchstart', onTouchStart)
  cvs.removeEventListener('touchmove', onTouchMove)
  cvs.removeEventListener('touchend', onTouchEnd)
})
</script>

<template>
  <canvas
    ref="canvasRef"
    :width="W"
    :height="H"
    class="apollo-canvas"
  />
</template>

<style scoped>
.apollo-canvas {
  width: 100%;
  height: auto;
  display: block;
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}
</style>
