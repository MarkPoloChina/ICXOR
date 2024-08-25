<script setup lang="ts">
import { ArrowLeftBold, ArrowRightBold, Grid, List, StarFilled } from '@element-plus/icons-vue'
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  illustCount: Number,
  selectionCount: Number,
  curPage: Number,
  pageSize: Number,
})

const emit = defineEmits([
  'update:curPage',
  'update:pageSize',
  'update:viewer-type',
  'focusUp',
  'focusDown',
])
const viewerController = reactive({
  type: 'table',
})
const writableCurPage = computed({
  get: () => {
    return props.curPage
  },
  set: (val) => {
    emit('update:curPage', val)
  },
})
const writablePageSize = computed({
  get: () => {
    return props.pageSize
  },
  set: (val) => {
    emit('update:pageSize', val)
  },
})
watch(viewerController, (val) => {
  emit('update:viewer-type', val.type)
})
</script>

<template>
  <div class="viewer-func">
    <div class="viewer-controller">
      <el-button-group
        style="margin-right: 5px"
      >
        <el-button
          :type="viewerController.type === 'grid' ? 'primary' : 'default'"
          :icon="Grid"
          size="small"
          @click="viewerController.type = 'grid'"
        />
        <el-button
          :type="viewerController.type === 'table' ? 'primary' : 'default'"
          :icon="List"
          size="small"
          @click="viewerController.type = 'table'"
        />
        <el-button
          :type="viewerController.type === 'focus' ? 'primary' : 'default'"
          :icon="StarFilled"
          size="small"
          @click="viewerController.type = 'focus'"
        />
      </el-button-group>
      <el-button-group
        v-if="viewerController.type === 'focus'"
        style="margin-right: 5px"
      >
        <el-button
          type="primary"
          :icon="ArrowLeftBold"
          size="small"
          @click="emit('focusDown')"
        />
        <el-button
          type="primary"
          :icon="ArrowRightBold"
          size="small"
          @click="emit('focusUp')"
        />
      </el-button-group>
      <div style="display: flex;align-items: center;">
        <div v-if="selectionCount" class="selection">
          {{ selectionCount }} 条已选&nbsp;/&nbsp;
        </div>
        <el-pagination
          v-model:current-page="writableCurPage"
          v-model:page-size="writablePageSize"
          background
          layout="total, sizes, prev, pager, next"
          :total="illustCount"
          :pager-count="5"
          :page-sizes="[100, 1000]"
          small
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.viewer-func {
  padding-top: 15px;
  width: 100%;
  height: calc(100% - 15px);
  .viewer-controller {
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    .selection {
      font-size: 12px;
      color: var(--el-text-color-regular);
    }
  }
}
</style>
