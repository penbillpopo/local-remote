<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

export interface VueEffectLink {
  label: string
  href: string
}

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    homeHref?: string
    links?: VueEffectLink[]
    socialLinks?: VueEffectLink[]
    timezone?: string
    activeHref?: string
    defaultOpen?: boolean
    showIntro?: boolean
    showThemeToggle?: boolean
    collapseOnScroll?: boolean
  }>(),
  {
    title: 'Local Remote',
    description:
      'We work with brands at the forefront of change, through experimental, experiential, and multi-sensory storytelling across virtual and physical presence.',
    homeHref: '/',
    links: () => [
      { label: 'Projects', href: '/projects' },
      { label: 'Fragments', href: '/fragments' },
      { label: 'News', href: '/news' },
      { label: 'About', href: '/about' }
    ],
    socialLinks: () => [
      { label: 'Instagram', href: 'https://www.instagram.com/local.remote' },
      { label: 'Facebook', href: 'https://www.facebook.com/local.remotedesign' }
    ],
    timezone: 'Asia/Taipei',
    activeHref: '',
    defaultOpen: false,
    showIntro: true,
    showThemeToggle: true,
    collapseOnScroll: true
  }
)

const isOpen = ref(props.defaultOpen)
const isDark = ref(false)
const displayLevel = ref(3)
const scrollDirection = ref<'up' | 'down'>('up')
const currentHref = ref('')
const now = ref(new Date())
let timer: number | undefined
let lastScrollY = 0
let accumulatedDelta = 0
let frame = 0

const formattedTime = computed(() => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: props.timezone,
    timeZoneName: 'shortOffset'
  })

  return formatter.format(now.value).replace('AM', 'AM').replace('PM', 'PM')
})

const rootClasses = computed(() => [
  `vue-effect--level-${displayLevel.value}`,
  `vue-effect--scroll-${scrollDirection.value}`,
  {
    'vue-effect--open': isOpen.value,
    'vue-effect--dark': isDark.value
  }
])

const activeTarget = computed(() => props.activeHref || currentHref.value)

function getCurrentHref() {
  if (typeof window === 'undefined') return ''
  return window.location.hash || window.location.pathname
}

function normalizeHref(href: string) {
  if (href.startsWith('#')) return href

  try {
    const url = new URL(href, window.location.origin)
    return url.hash || url.pathname
  } catch {
    return href
  }
}

function isActiveLink(href: string) {
  return normalizeHref(href) === normalizeHref(activeTarget.value)
}

function isHomeLocation() {
  if (typeof window === 'undefined') return true
  return !window.location.hash && window.location.pathname === '/'
}

function setDisplayLevel(nextLevel: number) {
  displayLevel.value = isHomeLocation() ? nextLevel : Math.min(nextLevel, 2)
}

function updateCurrentHref() {
  currentHref.value = getCurrentHref()
  setDisplayLevel(displayLevel.value)
}

function onLinkClick(event: MouseEvent, href: string) {
  if (!props.activeHref) {
    currentHref.value = normalizeHref(href)
  }

  if (!href.startsWith('#')) return

  const target = document.querySelector(href)
  if (!target) return

  event.preventDefault()
  window.history.pushState(null, '', href)
  setDisplayLevel(displayLevel.value)
  target.scrollIntoView({ block: 'start', behavior: 'smooth' })
}

function updateScrollState() {
  const currentY = window.scrollY
  const delta = currentY - lastScrollY
  accumulatedDelta += delta

  if (currentY <= 24) {
    scrollDirection.value = 'up'
    setDisplayLevel(3)
    accumulatedDelta = 0
  } else if (accumulatedDelta > 18) {
    scrollDirection.value = 'down'
    setDisplayLevel(1)
    accumulatedDelta = 0
  } else if (accumulatedDelta < -18) {
    scrollDirection.value = 'up'
    setDisplayLevel(2)
    accumulatedDelta = 0
  }

  lastScrollY = currentY
  frame = 0
}

function onScroll() {
  if (!props.collapseOnScroll || frame) return
  frame = window.requestAnimationFrame(updateScrollState)
}

onMounted(() => {
  updateCurrentHref()
  lastScrollY = window.scrollY
  setDisplayLevel(lastScrollY <= 24 ? 3 : 2)

  timer = window.setInterval(() => {
    now.value = new Date()
  }, 30_000)

  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('hashchange', updateCurrentHref)
  window.addEventListener('popstate', updateCurrentHref)
})

onBeforeUnmount(() => {
  if (timer) window.clearInterval(timer)
  if (frame) window.cancelAnimationFrame(frame)
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('hashchange', updateCurrentHref)
  window.removeEventListener('popstate', updateCurrentHref)
})
</script>

<template>
  <aside class="vue-effect" :class="rootClasses">
    <section v-if="showIntro" class="vue-effect__intro" aria-label="Introduction" :aria-hidden="displayLevel < 3">
      <h2>We are {{ title }}.</h2>
      <p>{{ description }}</p>
    </section>

    <nav class="vue-effect__panel" aria-label="Primary">
      <div class="vue-effect__top">
        <button
          class="vue-effect__burger"
          type="button"
          :aria-expanded="isOpen"
          aria-label="Toggle menu"
          @click="isOpen = !isOpen"
        >
          <span></span>
          <span></span>
        </button>

        <a class="vue-effect__brand" :href="homeHref">{{ title }}</a>

        <button
          v-if="showThemeToggle"
          class="vue-effect__switch vue-effect__switch--mobile"
          type="button"
          :aria-pressed="isDark"
          aria-label="Toggle theme"
          @click="isDark = !isDark"
        >
          <span></span>
        </button>

        <span class="vue-effect__mark" aria-hidden="true">
          <svg width="35" height="18" viewBox="0 0 35 18" fill="none">
            <path
              d="M9.47 12.79h2.26l-2.92 3.9-2.9-3.9h2.26V0h1.3v12.79ZM17.14 18v-1.31H.5V18h16.64ZM31.86 15.16l-1.08-.89c-.66 1.11-1.96 2.35-4.15 2.35-2.63 0-4.69-1.43-4.69-6.03v-1.6h2.19l-2.9-3.91-2.9 3.91h2.14v1.63c0 5.4 2.8 7.38 6.11 7.38 2.7 0 4.47-1.46 5.28-2.84ZM32.1 12.94 35 9.04h-2.13V7.38C32.87 1.97 30.09 0 26.75 0c-2.7 0-4.47 1.46-5.27 2.84l1.08.89c.68-1.11 1.96-2.35 4.17-2.35 2.6 0 4.68 1.43 4.68 6.03v1.63h-2.2l2.89 3.9Z"
            />
          </svg>
        </span>
      </div>

      <div class="vue-effect__links" :aria-hidden="displayLevel < 2 && !isOpen">
        <a
          v-for="link in links"
          :key="link.href"
          :href="link.href"
          :class="{ 'vue-effect__link--active': isActiveLink(link.href) }"
          :aria-current="isActiveLink(link.href) ? 'page' : undefined"
          @click="onLinkClick($event, link.href)"
        >
          {{ link.label }}
        </a>
      </div>
    </nav>

    <footer class="vue-effect__footer" :aria-hidden="displayLevel < 2">
      <span class="vue-effect__time">{{ formattedTime }}</span>
      <a v-for="link in socialLinks" :key="link.href" :href="link.href" target="_blank" rel="noreferrer">
        {{ link.label }}
      </a>

      <button
        v-if="showThemeToggle"
        class="vue-effect__switch vue-effect__switch--desktop"
        type="button"
        :aria-pressed="isDark"
        aria-label="Toggle theme"
        @click="isDark = !isDark"
      >
        <span></span>
      </button>
    </footer>
  </aside>
</template>
