<script setup lang="tsx">
import { Filter } from '@element-plus/icons-vue'
import { computed, reactive, ref } from 'vue'
import { ElButton, ElCheckbox, ElIcon, ElPopover } from 'element-plus'
import type { BatchLog } from '@render/ts/interface/batchLog'

const props = defineProps({
  loading: Boolean,
  list: Array as () => BatchLog[],
  selected: Array,
})
const pageSize = 100
const writableCurPage = ref(1)
const shouldFilter = reactive({
  ready: true,
  conflict: true,
  ignore: true,
  success: true,
  fault: true,
})
const writableList = computed({
  get: () => {
    const l = []
    const f = []
    Object.keys(shouldFilter).forEach((key) => {
      if (shouldFilter[key])
        f.push(key)
    })
    props.list.forEach((ele) => {
      if (f.includes(ele.status))
        l.push(ele)
    })
    return l
  },
  set: () => {},
})
const showList = computed(() => {
  return writableList.value.slice(
    (writableCurPage.value - 1) * pageSize,
    writableCurPage.value * pageSize,
  )
})

function SelectionCell({ value, intermediate = false, onChange, disabled }) {
  return (
    <ElCheckbox
      onChange={onChange}
      modelValue={value}
      indeterminate={intermediate}
      disabled={disabled}
    />
  )
}

const popoverRef = ref()

function onReset() {
  Object.keys(shouldFilter).forEach((key) => {
    shouldFilter[key] = true
  })
}

defineExpose({ onReset })
</script>

<template>
  <div>
    <el-table
      v-loading="loading"
      :data="showList"
      style="width: 100%; height: calc(100% - 38px)"
      :row-class-name="
        ({ rowIndex }) => {
          switch (showList[rowIndex].status) {
          case 'ready':
            return 'success-row';
          case 'success':
            return 'success-row';
          case 'fault':
            return 'danger-row';
          case 'ignore':
            return 'danger-row';
          case 'conflict':
            return 'warning-row';
          default:
            return '';
          }
        }
      "
    >
      <template #empty>
        <el-empty :image-size="120" />
      </template>
      <el-table-column :width="50">
        <template #default="{ row }">
          <SelectionCell
            :value="row.checked"
            :disabled="row.status !== 'ready' && row.status !== 'conflict'"
            @change="
              (value) => {
                if (row.status === 'ready' || row.status === 'conflict') {
                  row.checked = value;
                }
              }
            "
          />
        </template>
        <template #header>
          <SelectionCell
            :value="
              writableList.every((row) => row.checked)
                && writableList.length !== 0
            "
            :intermediate="
              writableList.some((row) => row.checked)
                && !(
                  writableList.every((row) => row.checked)
                  && writableList.length !== 0
                )
            "
            :disabled="writableList.length === 0"
            @change="
              (value) => {
                writableList.forEach((log) => {
                  if (log.status === 'ready' || log.status === 'conflict') {
                    log.checked = value;
                  }
                });
              }
            "
          />
        </template>
      </el-table-column>
      <el-table-column prop="filename" label="文件名" :width="350" />
      <el-table-column prop="status" label="状态" :width="100">
        <template #header>
          <div
            style="display: flex; align-items: center; justify-content: space-between"
          >
            状态
            <ElPopover ref="popoverRef" trigger="click" width="150">
              <div class="filter-wrapper">
                <div class="filter-group">
                  <ElCheckbox v-model="shouldFilter.ready">
                    Ready
                  </ElCheckbox>
                  <ElCheckbox v-model="shouldFilter.conflict">
                    Conflict
                  </ElCheckbox>
                  <ElCheckbox v-model="shouldFilter.ignore">
                    Ignore
                  </ElCheckbox>
                  <ElCheckbox v-model="shouldFilter.success">
                    Success
                  </ElCheckbox>
                  <ElCheckbox v-model="shouldFilter.fault">
                    Fault
                  </ElCheckbox>
                </div>
                <div
                  style="
                    border-top: 1px solid #4c4d4f;
                    margin: 12px -12px -12px;
                    padding: 0 12px;
                    display: flex;
                    justify-content: center;
                  "
                >
                  <ElButton text @click="onReset">
                    Reset
                  </ElButton>
                </div>
              </div>
              <template #reference>
                <ElIcon style="cursor: pointer">
                  <Filter />
                </ElIcon>
              </template>
            </ElPopover>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="message" label="说明" />
    </el-table>
    <el-pagination
      v-model:current-page="writableCurPage"
      style="justify-content: center; margin-top: 10px"
      background
      layout="total, prev, pager, next"
      :total="writableList.length"
      :page-size="pageSize"
      :pager-count="5"
      small
    />
  </div>
</template>

<style lang="scss" scoped>
:deep(.warning-row) {
  background-color: var(--el-color-warning-light-9);
}
:deep(.success-row) {
  background-color: var(--el-color-success-light-9);
}
:deep(.danger-row) {
  background-color: var(--el-color-danger-light-9);
}
</style>
