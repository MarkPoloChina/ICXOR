import type { RouteRecordRaw, Router, RouterOptions } from 'vue-router'
import { createRouter, createWebHashHistory } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Index',
    redirect: 'home',
    component: () => import('@render/views/IcxorIndex.vue'),
    children: [
      {
        path: 'home',
        name: 'home',
        component: () => import('@render/views/basic/IcxorHome.vue'),
      },
      {
        path: 'importer',
        name: 'importer',
        component: () => import('@render/views/basic/IcxorImporter.vue'),
      },
      {
        path: 'view',
        name: 'viewer',
        component: () => import('@render/views/basic/IcxorViewer.vue'),
      },
      {
        path: 'poly',
        name: 'polyer',
        component: () => import('@render/views/basic/IcxorPolyer.vue'),
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@render/views/setting/IcxorSettings.vue'),
      },
      {
        path: 'about',
        name: 'about',
        component: () => import('@render/views/setting/IcxorSettings.vue'),
      },
      {
        path: 'pixiv',
        name: 'pixiv',
        component: () => import('@render/views/basic/IcxorPixiv.vue'),
      },
      {
        path: 'pixiv/illust/:pid/:page',
        name: 'pixivIllust',
        component: () => import('@render/views/basic/IcxorPixiv.vue'),
      },
      {
        path: 'pixiv/user/:uid',
        name: 'pixivUser',
        component: () => import('@render/views/basic/IcxorPixiv.vue'),
      },
    ],
  }]

const options: RouterOptions = {
  history: createWebHashHistory(),
  routes,
}

const router: Router = createRouter(options)

export default router
