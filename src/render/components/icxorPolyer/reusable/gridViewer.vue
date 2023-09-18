<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue'
import { UrlGenerator } from '@render/ts/util/path'

defineProps({
  list: Array<any>,
})

const emit = defineEmits(['showInfo', 'remove'])

const { ipcRemoveAll, ipcOnce, ipcSend } = window.electron

function handleRightClick(event, obj) {
  if (event.stopPropagation)
    event.stopPropagation()

  ipcRemoveAll('context:click')
  ipcOnce('context:click', (event, item) => {
    switch (item) {
      case '详情':
        emit('showInfo', obj)
        break
      case '移除':
        emit('remove', obj)
        break
      default:
        break
    }
  })
  ipcSend('context:popup', [{ label: '详情' }, { label: '移除' }])
}
</script>

<template>
  <div class="viewer-main">
    <el-scrollbar style="border-radius: 5px">
      <el-row>
        <el-col
          v-for="(obj, index) in list"
          :key="index"
          :span="6"
          class="viewer-img-container"
        >
          <div class="expo" />
          <el-image
            class="viewer-img"
            :src="UrlGenerator.getBlobUrl(obj, 'square_medium')"
            :preview-src-list="[UrlGenerator.getBlobUrl(obj, 'original')]"
            fit="cover"
            lazy
            @contextmenu.prevent="handleRightClick($event, obj)"
          />
          <template #error>
            <div class="image-slot">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-col>
      </el-row>
    </el-scrollbar>
    <div class="viewer-info">
      共{{ list.length }}张插画
    </div>
  </div>
</template>

<style lang="scss" scoped>
.viewer-main {
  height: 100%;
  @include Flex-C;
  .viewer-img-container {
    position: relative;
    .expo {
      position: relative;
      width: 100%;
      height: 0;
      padding: 0;
      padding-bottom: 100%;
    }
    .viewer-img {
      border-radius: 5px;
      position: absolute;
      top: 10px;
      right: 10px;
      bottom: 10px;
      left: 10px;
      .image-slot {
        display: flex;
        justify-content: center;
        align-items: center;
        width: 100%;
        height: 100%;
        background: var(--el-fill-color-light);
        color: var(--el-text-color-secondary);
        font-size: 30px;
      }
    }
  }
  .viewer-info {
    height: 50px;
    @include Flex-R-AC;
    color: $color-greengray-2;
    margin-left: 10px;
  }
}
</style>
@render/ts/util/path
