<script setup lang="ts">
import { useDark } from '@vueuse/core'
import {
  House,
  PictureRounded,
  Setting,
  SuitcaseLine,
  Upload,
} from '@element-plus/icons-vue'
import { useStore } from 'vuex'

import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const { ipcInvoke, ipcOn } = window.electron

const isDark = useDark()
const router = useRouter()
const store = useStore()
onMounted(async () => {
  await store.dispatch('initStoreAsync')
  const theme: 'system' | 'light' | 'dark' = store.state.theme
  if (theme === 'system') {
    ipcInvoke('dark-mode:get').then(value => (isDark.value = value))
    ipcOn('dark-mode:updated', (message) => {
      isDark.value = message
    })
  }
  else if (theme === 'dark') {
    isDark.value = true
  }
  else if (theme === 'light') {
    isDark.value = false
  }
  ipcOn('app:message', (type, message) => {
    ElMessage({
      type,
      message,
    })
  })
  ipcOn('router:push', (message) => {
    router.push(message)
  })
})
</script>

<template>
  <div class="index-container">
    <div class="index-menu-container">
      <el-menu :default-active="$route.path" class="index-menu" collapse router>
        <el-menu-item index="/home">
          <el-icon><House /></el-icon>
          <template #title>
            欢迎
          </template>
        </el-menu-item>
        <el-menu-item index="/view">
          <el-icon><PictureRounded /></el-icon>
          <template #title>
            视图
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
        <el-menu-item index="/tool">
          <el-icon><SuitcaseLine /></el-icon>
          <template #title>
            工具
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

  .index-menu-container {
    height: 100%;
    flex: none;
    .index-menu {
      @include Flex-C;
      height: 100%;
      border-right: none;
      --el-menu-bg-color: #{$color-stdblue-1};
      --el-menu-active-color: white;
      --el-menu-text-color: white;
      --el-menu-hover-bg-color: #{$color-stdblue-2};
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
