import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import router from '@render/router'
import store from '@render/store'
import App from './App.vue'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

import '@render/style/element.css'

createApp(App).use(store).use(router).use(ElementPlus).mount('#app')
