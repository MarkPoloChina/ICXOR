import router from '@render/router'
import store from '@render/store'
import ElementPlus from 'element-plus'
import zhCN from 'element-plus/es/locale/lang/zh-cn'
import { createApp } from 'vue'
import App from './App.vue'
import '@render/style/element.scss'

createApp(App).use(store).use(router).use(ElementPlus, { locale: zhCN }).mount('#app')
