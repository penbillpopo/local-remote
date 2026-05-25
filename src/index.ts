import type { App } from 'vue'
import VueEffect from './components/VueEffect.vue'
import './style.css'

export { VueEffect }

export default {
  install(app: App) {
    app.component('VueEffect', VueEffect)
  }
}
