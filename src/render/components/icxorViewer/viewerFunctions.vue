<script setup lang="ts">
import { ArrowLeftBold, ArrowRightBold } from '@element-plus/icons-vue'
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  illustCount: Number,
  curPage: Number,
})

const emit = defineEmits([
  'update:curPage',
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
watch(viewerController, (val) => {
  emit('update:viewer-type', val.type)
})
</script>

<template>
  <div class="viewer-func">
    <div class="viewer-controller">
      <el-radio-group v-model="viewerController.type">
        <el-radio label="grid">
          网格
        </el-radio>
        <el-radio label="table">
          表格
        </el-radio>
        <el-radio label="focus">
          聚焦
        </el-radio>
      </el-radio-group>
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
      <el-pagination
        v-model:current-page="writableCurPage"
        background
        layout="total, prev, pager, next"
        :total="illustCount"
        :page-size="100"
        :pager-count="5"
        small
      />
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
    :deep(.el-radio) {
      margin-right: 10px;
    }
  }
}
</style>
