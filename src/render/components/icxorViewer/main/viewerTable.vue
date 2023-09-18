<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps({
  tableData: Array<any>,
  loading: Boolean,
  currentSelected: Object,
})

const emits = defineEmits(['selectChange', 'popupContext'])
const table = ref()
watch(
  () => props.tableData,
  (val) => {
    val.forEach((ele) => {
      table.value.toggleRowSelection(ele, !!ele.checked)
    })
  },
  {
    deep: true,
    immediate: true,
  },
)
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
    if (!val)
      return
    table.value.setCurrentRow(val)
  },
  {
    deep: false,
  },
)
function handleCurrentChange(val) {
  emits('selectChange', val)
}
function handleContextDeteched(row) {
  emits('popupContext', row)
}
function handleSelect(selection, row) {
  row.checked = selection.length !== 0
}
function handleSelectAll(selection) {
  props.tableData.forEach((item) => {
    item.checked = selection.length !== 0
  })
}
</script>

<template>
  <div class="table-container">
    <el-table
      ref="table"
      v-loading="loading"
      :data="tableData"
      height="100%"
      class="table"
      :flexible="true"
      highlight-current-row
      @current-change="handleCurrentChange"
      @select="handleSelect"
      @select-all="handleSelectAll"
      @row-contextmenu="handleContextDeteched"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="remote_base.name" label="类型" :min-width="80" />
      <el-table-column prop="meta.pid" label="PID" :min-width="120" />
      <el-table-column prop="meta.page" label="页号" :min-width="50" />
      <el-table-column label="标题/末端" :min-width="280" show-overflow-tooltip>
        <template #default="scope">
          {{
            scope.row.meta ? scope.row.meta.title : scope.row.remote_endpoint
          }}
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<style lang="scss" scoped>
.table-container {
  height: 100%;
  .table {
    border-radius: 5px;
  }
}
</style>
