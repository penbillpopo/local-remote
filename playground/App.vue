<script setup lang="ts">
import { computed } from 'vue';
import { VueEffect } from '../src';
import '../src/style.css';

const links = [
  { label: 'Projects', href: '/projects' },
  { label: 'Fragments', href: '/fragments' },
  { label: 'News', href: '/news' },
  { label: 'About', href: '/about' },
];

const pages = {
  '/': {
    eyebrow: 'Vue library component',
    title: 'Floating navigation dock',
    tone: 'home',
  },
  '/projects': {
    eyebrow: 'Projects',
    title: 'Orbital identity system',
    tone: 'dark',
  },
  '/fragments': {
    eyebrow: 'Fragments',
    title: 'Type motion archive',
    tone: 'pink',
  },
  '/news': {
    eyebrow: 'News',
    title: 'A stage for generations',
    tone: 'black',
  },
  '/about': {
    eyebrow: 'About',
    title: 'Physical and virtual presence',
    tone: 'light',
  },
};

const currentPage = computed(() => {
  const path = window.location.pathname;
  return pages[path as keyof typeof pages] ?? pages['/'];
});

const cards = [
  {
    eyebrow: 'Project',
    title: 'Orbital identity system',
    text: 'A compact scroll test section with a large image-like panel and dense reading rhythm.',
  },
  {
    eyebrow: 'Fragment',
    title: 'Type motion archive',
    text: 'Scroll down to collapse the dock into one block, then scroll up to reveal the middle state.',
  },
  {
    eyebrow: 'News',
    title: 'A stage for generations',
    text: 'Return to the very top to bring back the intro block and all three visible sections.',
  },
  {
    eyebrow: 'About',
    title: 'Physical and virtual presence',
    text: 'The page is intentionally tall so the component can be tested with real scroll gestures.',
  },
];
</script>

<template>
  <main class="playground">
    <section
      class="playground-hero"
      :class="`playground-hero--${currentPage.tone}`"
    >
      <div>
        <p>{{ currentPage.eyebrow }}</p>
        <h1>{{ currentPage.title }}</h1>
      </div>
    </section>

    <section class="playground-grid">
      <article v-for="card in cards" :key="card.title" class="playground-card">
        <div>
          <p>{{ card.eyebrow }}</p>
          <h2>{{ card.title }}</h2>
        </div>
        <span>{{ card.text }}</span>
      </article>
    </section>

    <section class="playground-band playground-band--pink">
      <p>Fragments</p>
      <h2>Scroll direction controls the dock.</h2>
    </section>

    <section class="playground-band playground-band--dark">
      <p>News</p>
      <h2>Down shows one block. Up in the middle shows two.</h2>
    </section>

    <section class="playground-band playground-band--light">
      <p>About</p>
      <h2>At the top, the introduction returns for three blocks.</h2>
    </section>

    <VueEffect
      title="Local Remote"
      :links="links"
      description="We work with brands at the forefront of change, through experimental, experiential, and multi-sensory storytelling across virtual and physical presence."
    />
  </main>
</template>
