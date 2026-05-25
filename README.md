# vue-effect

A lightweight Vue 3 library starter using Vite library mode.

## Scripts

```bash
npm install
npm run dev
npm run build
```

## Usage

```ts
import { createApp } from 'vue'
import VueEffect, { VueEffect as VueEffectComponent } from 'vue-effect'
import 'vue-effect/style.css'

const app = createApp(App)

app.use(VueEffect)
app.component('VueEffectComponent', VueEffectComponent)
```
