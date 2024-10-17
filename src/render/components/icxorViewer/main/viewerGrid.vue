<script setup lang="ts">
import type { IllustObj } from '@render/ts/interface/illustObj'
import { CircleCheck, Picture } from '@element-plus/icons-vue'
import { UrlGenerator } from '@render/ts/util/path'
import { ref, watch } from 'vue'

const props = defineProps({
  tableData: Array as () => IllustObj[],
  selections: Array,
  loading: Boolean,
  currentSelected: Object as () => IllustObj | null,
})
const emit = defineEmits(['update:selections', 'popupContext', 'selectChange', 'starChange'])
const table = ref()
const image404s = ref({})

watch(
  () => props.tableData,
  () => {
    table.value.setScrollTop(0)
  },
  {
    deep: false,
  },
)
function handleRightClick(event: MouseEvent, obj: IllustObj) {
  event.preventDefault()
  emit('popupContext', obj)
}
function scrollToCurrent() {
  try {
    document
      .getElementById(`img-grid-${props.currentSelected.id}`)
      .scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  catch {}
}
watch(
  () => props.currentSelected,
  () => {
    if (props.currentSelected)
      scrollToCurrent()
  },
  {
    deep: false,
    immediate: true,
  },
)
function openViwer() {
  document.getElementById('img-fixed').click()
}
defineExpose({
  openViwer,
})
</script>

<template>
  <el-scrollbar
    ref="table"
    style="border-radius: 5px"
    class="grid-container"
  >
    <div
      v-loading="loading"
      class="grid-group"
    >
      <div
        v-for="(obj, index) in tableData"
        :id="`img-grid-${obj.id}`"
        :key="index"
        :span="8"
        class="viewer-grid-container"
      >
        <div class="expo" />
        <div
          v-if="obj.checked"
          class="selected-mask"
          :class="props.currentSelected && props.currentSelected.id === obj.id ? 'current' : ''"
        >
          <CircleCheck />
        </div>
        <el-image
          class="viewer-img"
          :class="`${
            props.currentSelected && props.currentSelected.id === obj.id ? 'current' : ''
          }`"
          :src="
            image404s[obj.id]
              ? UrlGenerator.getBlobUrl(obj, 'original')
              : UrlGenerator.getBlobUrl(obj, 'large')
          "
          fit="cover"
          loading="lazy"
          @error="image404s[obj.id] = true"
          @contextmenu="handleRightClick($event, obj)"
          @dblclick="openViwer"
          @click="emit('selectChange', obj)"
        >
          <template #error>
            <div class="image-slot">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
      </div>
    </div>
  </el-scrollbar>
  <div
    v-if="currentSelected"
    style="display: none"
  >
    <el-image
      id="img-fixed"
      :src="
        image404s[currentSelected.id]
          ? UrlGenerator.getBlobUrl(currentSelected, 'original')
          : UrlGenerator.getBlobUrl(currentSelected, 'large')
      "
      :preview-src-list="[
        image404s[currentSelected.id]
          ? UrlGenerator.getBlobUrl(currentSelected, 'original')
          : UrlGenerator.getBlobUrl(currentSelected, 's_large'),
      ]"
      preview-teleported
      fit="cover"
    >
      <template #error>
        <div class="image-slot">
          <el-icon><Picture /></el-icon>
        </div>
      </template>
    </el-image>
  </div>
</template>

<style lang="scss" scoped>
.grid-container {
  height: 100%;
  position: relative;
  .grid-group {
    display: grid;
    justify-content: space-around;
    grid-template-columns: repeat(auto-fill, 220px);
    .viewer-grid-container {
      position: relative;
      .expo {
        position: relative;
        width: 100%;
        height: 0;
        padding: 0;
        padding-bottom: 100%;
      }
      .selected-mask {
        position: absolute;
        border-radius: 5px;
        width: calc(100% - 140px);
        height: calc(100% - 140px);
        top: 10px;
        left: 10px;
        padding: 60px;
        background: rgba(255, 255, 255, 0.6);
        color: $color-stdblue-1;
        z-index: 1;
        pointer-events: none;
        &.current {
          width: calc(100% - 120px);
          height: calc(100% - 120px);
          top: 0;
          left: 0;
        }
      }
      .viewer-img {
        border-radius: 5px;
        position: absolute;
        top: 10px;
        right: 10px;
        bottom: 10px;
        left: 10px;
        width: 200px;
        height: 200px;
        cursor: pointer;
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
        &.current {
          border: 3px solid $color-stdblue-1;
          top: 0px;
          right: 0px;
          bottom: 0px;
          left: 0px;
          width: calc(220px - 6px);
          height: calc(220px - 6px);
        }
      }
    }
  }
}
</style>
