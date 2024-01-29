<script setup lang="ts">
import PixivBatch from '@render/components/icxorPixiv/pixivBatch.vue'
import PixivBookmark from '@render/components/icxorPixiv/pixivBookmark.vue'
import PixivIllust from '@render/components/icxorPixiv/pixivIllust.vue'
import PixivUser from '@render/components/icxorPixiv/pixivUser.vue'
import type { Ref } from 'vue'
import { onActivated, ref } from 'vue'
import { useRoute } from 'vue-router'

const currentTab = ref('illust')
const route = useRoute()
const illust: Ref<typeof PixivIllust> = ref()
const user: Ref<typeof PixivUser> = ref()
onActivated(() => {
  switch (route.query.redirect) {
    case 'illust':
      currentTab.value = 'illust'
      illust.value.handleSearchByLink(route.query.pid, route.query.page)
      break
    case 'user':
      currentTab.value = 'user'
      user.value.handleSearchByLink(route.query.uid)
      break
    default:
      break
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
        <PixivIllust
          ref="illust" @to-user="($event) => {
            currentTab = 'user'
            user.handleSearchByLink($event.uid)
          }"
        />
      </el-tab-pane>
      <el-tab-pane label="画师" name="user">
        <PixivUser
          ref="user" @to-illust="($event) => {
            currentTab = 'illust'
            illust.handleSearchByLink($event.pid, $event.page)
          }"
        />
      </el-tab-pane>
      <el-tab-pane label="收藏" name="bookmark">
        <PixivBookmark
          @to-illust="($event) => {
            currentTab = 'illust'
            illust.handleSearchByLink($event.pid, $event.page)
          }"
        />
      </el-tab-pane>
      <el-tab-pane label="批处理" name="batch">
        <PixivBatch
          @to-illust="($event) => {
            currentTab = 'illust'
            illust.handleSearchByLink($event.pid, $event.page)
          }"
        />
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
