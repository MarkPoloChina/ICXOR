import { createApp } from 'vue'
import '@render/style/element.scss'
import ElementPlus from 'element-plus'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import router from '@render/router'
import store from '@render/store'
import App from './App.vue'

createApp(App).use(store).use(router).use(ElementPlus, { locale: zhCN }).mount('#app')
