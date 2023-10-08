<script setup lang="ts">
import { useDark } from '@vueuse/core'
import {
  House,
  MessageBox,
  PictureRounded,
  Setting,
  Upload,
} from '@element-plus/icons-vue'
import { useStore } from 'vuex'

import { onMounted } from 'vue'
import { useRouter } from 'vue-router'

const { ipcInvoke, ipcOn } = window.electron

const isDark = useDark()
const router = useRouter()
onMounted(() => {
  ipcInvoke('dark-mode:get').then(value => (isDark.value = value))
  ipcOn('dark-mode:updated', (message) => {
    isDark.value = message
  })
  ipcOn('router:go', (message) => {
    router.push(message)
  })
  useStore().commit('initStore')
})
</script>

<template>
  <div class="index-container">
    <div class="index-menu-container">
      <el-menu :default-active="$route.path" class="index-menu" collapse router>
        <el-menu-item index="/home">
          <el-icon><House /></el-icon>
          <template #title>
            主页
          </template>
        </el-menu-item>
        <el-menu-item index="/view">
          <el-icon><PictureRounded /></el-icon>
          <template #title>
            视图
          </template>
        </el-menu-item>
        <el-menu-item index="/poly">
          <el-icon><MessageBox /></el-icon>
          <template #title>
            聚合
          </template>
        </el-menu-item>
        <el-menu-item index="/importer">
          <el-icon><Upload /></el-icon>
          <template #title>
            导入
          </template>
        </el-menu-item>
        <el-menu-item index="/pixiv">
          <el-icon>
            <img
              src="@render/assets/img/pixiv_icon.svg"
              style="user-select: none; width: 30px"
            >
          </el-icon>
          <template #title>
            Pixiv
          </template>
        </el-menu-item>
        <div style="flex-grow: 1" />
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="index-main">
      <router-view v-slot="{ Component }">
        <keep-alive>
          <component :is="Component" />
        </keep-alive>
      </router-view>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.index-container {
  @include Flex-R;
  width: 100%;
  height: 100%;
  // background-image: url("@render/assets/img/avatar.jpg");
  // background-size: cover;
  background-color: var(--color-bg);

  .index-menu-container {
    height: 100%;
    background-color: $color-stdblue-1;
    flex: none;
    .index-menu {
      @include Flex-C;
      height: 100%;
      border-right: none;
      --el-menu-bg-color: transparent;
      --el-menu-active-color: white;
      --el-menu-text-color: white;
      --el-menu-hover-bg-color: #5dabdc;
      .el-menu-item.is-active {
        background-color: var(--el-menu-hover-bg-color);
      }
      .el-menu-item [class^="el-icon"] {
        font-size: 30px;
      }
    }
  }
  .index-main {
    flex: auto;
    overflow: hidden;
    // background-color: var(--color-bg-alpha);
  }
}
</style>
