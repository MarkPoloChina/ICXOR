<script setup lang="ts">
import { CircleCheck, Picture } from '@element-plus/icons-vue'
import type { IllustObj } from '@render/ts/interface/illustObj'
import { UrlGenerator } from '@render/ts/util/path'
import { onActivated, onDeactivated, ref, watch } from 'vue'

const props = defineProps({
  tableData: Array as () => IllustObj[],
  loading: Boolean,
  currentSelected: Object as () => IllustObj | null,
})

const emit = defineEmits([
  'selectChange',
  'selectsChange',
  'popupContext',
  'starChange',
])
const currentIndex = ref(0)
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
watch(
  () => props.currentSelected,
  (val) => {
    if (props.currentSelected)
      currentIndex.value = props.tableData.findIndex(v => v.id === val.id)
  },
  {
    deep: false,
    immediate: true,
  },
)
watch(
  () => currentIndex.value,
  () => {
    emit('selectChange', props.tableData[currentIndex.value])
    scrollToCurrent()
  },
  {
    deep: false,
  },
)
function handleRightClick(event: MouseEvent, obj: IllustObj) {
  event.preventDefault()
  emit('popupContext', obj)
}
function handleSelect(obj: IllustObj, index: number) {
  currentIndex.value = index
  emit('selectChange', obj)
}
function handleIndexChange(action: 'up' | 'down') {
  if (action === 'up') {
    if (currentIndex.value < props.tableData.length - 1)
      currentIndex.value++
  }
  else if (action === 'down') {
    if (currentIndex.value > 0)
      currentIndex.value--
  }
}
function scrollToCurrent() {
  try {
    document.getElementById(`img-focus-${currentIndex.value}`).scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }
  catch {}
}
onActivated(() => {
  addKeyboardListener()
})
onDeactivated(() => {
  removeKeyboardListener()
})
function keyboardHandler(event) {
  event.preventDefault()
  switch (event.key) {
    case 'ArrowRight':
      handleIndexChange('up')
      break
    case 'ArrowLeft':
      handleIndexChange('down')
      break
    case '1':
      emit('starChange', 1)
      break
    case '2':
      emit('starChange', 2)
      break
    case '3':
      emit('starChange', 3)
      break
    case '4':
      emit('starChange', 4)
      break
    case '5':
      emit('starChange', 5)
      break
    default:
      break
  }
}
function addKeyboardListener() {
  document.addEventListener('keyup', keyboardHandler)
}
function removeKeyboardListener() {
  document.removeEventListener('keyup', keyboardHandler)
}

defineExpose({ handleIndexChange })
</script>

<template>
  <div v-loading="loading" class="v-focus-container">
    <div class="focus-container">
      <el-image
        v-if="tableData[currentIndex]"
        class="viewer-img"
        :src="
          image404s[tableData[currentIndex].id]
            ? UrlGenerator.getBlobUrl(tableData[currentIndex], 'original')
            : UrlGenerator.getBlobUrl(
              tableData[currentIndex], 's_large',
            )
        "
        :preview-src-list="[
          UrlGenerator.getBlobUrl(tableData[currentIndex], 'original'),
        ]"
        fit="contain"
      >
        <template #error>
          <div class="image-slot">
            <el-icon><Picture /></el-icon>
          </div>
        </template>
      </el-image>
    </div>
    <el-scrollbar ref="table" class="flow-container">
      <div
        v-for="(obj, index) in tableData"
        :id="`img-focus-${index}`"
        :key="index"
        class="viewer-flow-container"
      >
        <div class="expo" />
        <div v-if="obj.checked" class="selected-mask">
          <CircleCheck />
        </div>
        <el-image
          class="viewer-img"
          :src="image404s[obj.id]
            ? UrlGenerator.getBlobUrl(obj, 'original')
            : UrlGenerator.getBlobUrl(obj, 'square_medium')"
          fit="cover"
          loading="lazy"
          @error="image404s[obj.id] = true"
          @click="handleSelect(obj, index)"
          @contextmenu.prevent="handleRightClick($event, obj)"
        >
          <template #error>
            <div class="image-slot">
              <el-icon><Picture /></el-icon>
            </div>
          </template>
        </el-image>
      </div>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" scoped>
.v-focus-container {
  height: 100%;
  position: relative;
  display: flex;
  flex-direction: row;
  .focus-container {
    height: 100%;
    width: 85%;
    .viewer-img {
      border-radius: 5px;
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 50px;
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
  .flow-container {
    height: 100%;
    position: relative;
    width: calc(15% - 10px);
    margin-left: 10px;
    .viewer-flow-container {
      display: inline-block;
      position: relative;
      width: calc((100% - 10px));
      .expo {
        position: relative;
        width: 100%;
        height: 0;
        padding: 0;
        padding-bottom: 100%;
      }
      .selected-mask {
        border-radius: 5px;
        position: absolute;
        width: calc(100% - 10px);
        height: calc(100% - 10px);
        top: 5px;
        left: 5px;
        padding: 0;
        background: rgba(255, 255, 255, 0.6);
        color: $color-stdblue-1;
        z-index: 1;
        pointer-events: none;
      }
      .viewer-img {
        border-radius: 5px;
        position: absolute;
        top: 5px;
        right: 5px;
        bottom: 5px;
        left: 5px;
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
      }
    }
  }
}
</style>
