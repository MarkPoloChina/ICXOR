<script setup lang="ts">
import { Picture } from '@element-plus/icons-vue'
import { UrlGenerator } from '@render/ts/util/path'
import { ref, watch } from 'vue'

const props = defineProps({
  tableData: Array<any>,
  selections: Array,
  loading: Boolean,
  currentSelected: Object,
})
const emit = defineEmits(['update:selections', 'popupContext'])
const table = ref()

watch(
  () => props.tableData,
  () => {
    table.value.setScrollTop(0)
  },
  {
    deep: false,
  },
)
function handleRightClick(event, obj) {
  event.preventDefault()
  emit('popupContext', obj)
}
</script>

<template>
  <el-scrollbar ref="table" style="border-radius: 5px" class="grid-container">
    <el-row v-loading="loading">
      <el-col
        v-for="(obj, index) in tableData"
        :key="index"
        :span="8"
        class="viewer-grid-container"
      >
        <div class="expo" />
        <el-image
          class="viewer-img"
          :class="`${obj.checked ? 'with-border' : ''} ${
            props.currentSelected && props.currentSelected.id === obj.id
              ? 'bigger'
              : ''
          }`"
          :src="UrlGenerator.getBlobUrl(obj, 'large')"
          :preview-src-list="[UrlGenerator.getBlobUrl(obj, 's_large')]"
          fit="cover"
          lazy
          @contextmenu="handleRightClick($event, obj)"
        >
          <template #error>
            <div class="image-slot">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
      </el-col>
    </el-row>
  </el-scrollbar>
</template>

<style lang="scss" scoped>
.grid-container {
  height: 100%;
  position: relative;
  .viewer-grid-container {
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
      &.with-border {
        border: 3px solid $color-stdblue-1;
      }
      &.bigger {
        top: 0px;
        right: 0px;
        bottom: 0px;
        left: 0px;
      }
    }
  }
}
</style>
