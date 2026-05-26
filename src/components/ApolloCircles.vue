<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

// 背景亮度 0=黑 128=灰 255=白，驅動 body 背景色與 canvas 底色
let currentBg = 255

function applyBgColor(dist: number) {
  const l = Math.round(Math.max(0, Math.min(255, 128 - dist * 0.85)))
  currentBg = l
  const h = l.toString(16).padStart(2, '0')
  document.body.style.backgroundColor = `#${h}${h}${h}`
  document.body.style.color = l < 128 ? '#e8eaf0' : '#111'
  dirty = true
}

// border-radius: 動態注入 style 標籤，用 CSS 變數驅動
let brStyleEl: HTMLStyleElement | null = null

function applyRadius(dist: number) {
  if (!brStyleEl) {
    brStyleEl = document.createElement('style')
    brStyleEl.textContent = '* { border-radius: var(--apollo-br) !important; transition: border-radius 0.15s !important; }'
    document.head.appendChild(brStyleEl)
  }
  // dist 負 = 視覺上方，越遠 radius 越大；dist 正 = 下方，越遠越小
  const br = Math.max(0, Math.min(16, 4 - dist * 0.06))
  document.documentElement.style.setProperty('--apollo-br', `${br.toFixed(1)}px`)
}

// font-size: 快取元素，每次只更新 style（無 transition，拖曳本身提供平滑感）
const FONT_SEL = 'h1,h2,h3,h4,h5,h6,p,a,li,span,button,label,td,th,figcaption,blockquote,nav'
let fontCache: { el: HTMLElement; base: number }[] | null = null

function applyFont(dist: number) {
  if (!fontCache) {
    fontCache = []
    document.querySelectorAll<HTMLElement>(FONT_SEL).forEach(el => {
      const base = parseFloat(window.getComputedStyle(el).fontSize)
      if (base > 0) fontCache!.push({ el, base })
    })
  }
  const scale = Math.max(0.93, Math.min(1.07, 1 - dist * 0.0004))
  fontCache.forEach(({ el, base }) => { el.style.fontSize = `${(base * scale).toFixed(1)}px` })
}

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

function checkOnLine() {
  const A = circles[0], B = circles[1], P = circles[2]
  const abx = B.x - A.x, aby = B.y - A.y
  const abLen = Math.sqrt(abx * abx + aby * aby)
  if (abLen === 0) return
  applyBgColor((abx * (P.y - A.y) - aby * (P.x - A.x)) / abLen)
}

function checkRadiusSide() {
  const A = circles[0], B = circles[2], P = circles[1]
  const abx = B.x - A.x, aby = B.y - A.y
  const abLen = Math.sqrt(abx * abx + aby * aby)
  if (abLen === 0) return
  applyRadius((abx * (P.y - A.y) - aby * (P.x - A.x)) / abLen)
}

function checkFontSide() {
  const A = circles[1], B = circles[2], P = circles[0]
  const abx = B.x - A.x, aby = B.y - A.y
  const abLen = Math.sqrt(abx * abx + aby * aby)
  if (abLen === 0) return
  applyFont((abx * (P.y - A.y) - aby * (P.x - A.x)) / abLen)
}

function onMouseMove(e: MouseEvent) {
  if (!drag) return
  const [mx, my] = toCanvas(e.clientX, e.clientY)
  circles[drag.i].x = Math.max(0, Math.min(W, mx - drag.ox))
  circles[drag.i].y = Math.max(0, Math.min(H, my - drag.oy))
  if (drag.i === 2) checkOnLine()
  if (drag.i === 1) checkRadiusSide()
  if (drag.i === 0) checkFontSide()
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
  circles[drag.i].x = Math.max(0, Math.min(W, mx - drag.ox))
  circles[drag.i].y = Math.max(0, Math.min(H, my - drag.oy))
  if (drag.i === 2) checkOnLine()
  if (drag.i === 1) checkRadiusSide()
  if (drag.i === 0) checkFontSide()
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
  const l = currentBg  // 0=黑 255=白
  const inv = 255 - l  // 反色，用於筆觸與文字

  ctx.clearRect(0, 0, W, H)
  ctx.fillStyle = `rgb(${l},${l},${l})`
  ctx.fillRect(0, 0, W, H)

  // --- Layer 1: Three pairwise enclosing circles ---
  const pairs: [number, number][] = [[0, 1], [0, 2], [1, 2]]
  ctx.save()
  ctx.strokeStyle = `rgba(${inv},${inv},${inv},0.13)`
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
    ctx.fillStyle = `rgba(${inv},${inv},${inv},0.06)`
    ctx.fill()
    ctx.strokeStyle = active
      ? `rgba(${inv},${inv},${inv},0.9)`
      : `rgba(${inv},${inv},${inv},0.35)`
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()

    if (c.label) {
      ctx.save()
      ctx.font = '11px "Helvetica Neue", Helvetica, Arial, sans-serif'
      ctx.fillStyle = `rgba(${inv},${inv},${inv},0.55)`
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
  document.body.style.removeProperty('background-color')
  document.body.style.removeProperty('color')
  brStyleEl?.remove(); brStyleEl = null
  document.documentElement.style.removeProperty('--apollo-br')
  fontCache?.forEach(({ el, base }) => { el.style.removeProperty('font-size') })
  fontCache = null
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
  aspect-ratio: 340 / 320;
  display: block;
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}
</style>

