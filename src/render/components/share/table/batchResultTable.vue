<script setup lang="ts">
import type { RespListObjDto } from '@render/ts/dto/respList'
import { computed } from 'vue'

const props = defineProps({
  dto: Array,
  resp: Array<RespListObjDto>,
})

const resultTable = computed(() => {
  return props.resp.map((ele) => {
    return {
      ...ele,
      dto: props.dto[ele.bid],
    }
  })
})

const elTagStatusAdapter = {
  success: 'success',
  ignore: 'info',
  error: 'danger',
  conflict: 'warning',
}
</script>

<template>
  <el-table
    :data="resultTable"
    class="result-table"
    max-height="400"
  >
    <el-table-column
      prop="bid"
      label="流水ID"
      width="80"
    />
    <el-table-column
      prop="dto.id"
      label="基ID"
      width="80"
    />
    <el-table-column
      label="末端或PID"
      width="150"
    >
      <template #default="scope">
        {{ scope.row.dto.remote_endpoint || scope.row.dto.meta.pid }}
      </template>
    </el-table-column>
    <el-table-column
      prop="status"
      label="状态"
      width="100"
    >
      <template #default="scope">
        <el-tag :type="elTagStatusAdapter[scope.row.status]">
          {{ scope.row.status }}
        </el-tag>
      </template>
    </el-table-column>
    <el-table-column
      prop="message"
      label="说明"
      :min-width="200"
      show-overflow-tooltip
    />
  </el-table>
</template>

<style lang="scss" scoped>
.result-table {
    width: 100%;
}
</style>
