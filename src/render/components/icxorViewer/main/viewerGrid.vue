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
      @error="image404s[currentSelected.id] = true"
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
  @include Viewer-Grid;
}
</style>
