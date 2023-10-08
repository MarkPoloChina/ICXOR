<script setup lang="ts">
import PixivBookmark from '@render/components/icxorPixiv/pixivBookmark.vue'
import PixivIllust from '@render/components/icxorPixiv/pixivIllust.vue'
import PixivUser from '@render/components/icxorPixiv/pixivUser.vue'
import type { Ref } from 'vue'
import { onActivated, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

const currentTab = ref('illust')
const route = useRoute()
const illust: Ref<typeof PixivIllust> = ref()
const user: Ref<typeof PixivUser> = ref()
watch(() => route.fullPath, (v, oldV) => {
  if (v === oldV)
    return
  if (route.fullPath.startsWith('/pixiv/illust')) {
    currentTab.value = 'illust'
    illust.value.handleSearchByLink(route.params.pid, route.params.page)
  }
  else if (route.fullPath.startsWith('/pixiv/user')) {
    currentTab.value = 'user'
    user.value.handleSearchByLink(route.params.uid)
  }
})
onActivated(() => {
  if (route.fullPath.startsWith('/pixiv/illust')) {
    currentTab.value = 'illust'
    illust.value.handleSearchByLink(route.params.pid, route.params.page)
  }
  else if (route.fullPath.startsWith('/pixiv/user')) {
    currentTab.value = 'user'
    user.value.handleSearchByLink(route.params.uid)
  }
})
</script>

<template>
  <div class="importer-container">
    <div class="title">
      Pixiv
    </div>
    <el-tabs v-model="currentTab" class="tabs">
      <el-tab-pane label="插画" name="illust">
        <PixivIllust ref="illust" />
      </el-tab-pane>
      <el-tab-pane label="画师" name="user">
        <PixivUser ref="user" />
      </el-tab-pane>
      <el-tab-pane label="收藏" name="bookmark">
        <PixivBookmark />
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style lang="scss" scoped>
.importer-container {
  @include Uni-Main-Container;
  .title {
    @include Uni-Main-Title;
  }
  .tabs {
    padding: 0 10px 0 10px;
    height: calc(100% - 52px);
    :deep(.el-tabs__content) {
      height: calc(100% - 55px);
    }
    :deep(.el-tab-pane) {
      height: 100%;
    }
  }
}
</style>
