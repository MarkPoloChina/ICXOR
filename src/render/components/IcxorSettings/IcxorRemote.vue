<script setup lang="ts">
import { Plus, Refresh } from '@element-plus/icons-vue'
import { API } from '@render/ts/api'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

onMounted(() => {
  initForm()
})
const tableData = ref([])
async function initForm() {
  tableData.value = (await API.getRemoteBase()).sort((a, b) => a.id - b.id)
}
function revoke() {
  tableData.value.length = 0
  initForm()
}
function addRow() {
  tableData.value.push({
    id: null,
    name: '',
    origin_url: '',
    thum_url: '',
    type: '',
  })
}
function handleUpdateRemote(row) {
  API.coverRemoteBase(row)
    .then(() => {
      ElMessage.success('更改成功')
      row.editing = false
    })
    .catch((err) => {
      ElMessage.error(`错误: ${err}`)
    })
}
</script>

<template>
  <div class="sufs-container">
    <div class="title-block">
      远程基
    </div>
    <div class="main-block">
      <el-table
        :data="tableData"
        style="width: 100%; height: 100%"
      >
        <el-table-column
          label="类型"
          width="150"
        >
          <template #default="scope">
            <el-select
              v-model="scope.row.type"
              placeholder="选择类型"
              :disabled="!scope.row.editing"
            >
              <el-option
                v-for="item in ['pixiv', 'mpihs', 'cos']"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column
          label="标识符"
          width="150"
        >
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.name }}</span>
            <span v-else><el-input v-model="scope.row.name" /></span>
          </template>
        </el-table-column>
        <el-table-column label="原图URL">
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.origin_url }}</span>
            <span v-else><el-input v-model="scope.row.origin_url" /></span>
          </template>
        </el-table-column>
        <el-table-column label="缩略图URL">
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.thum_url }}</span>
            <span v-else><el-input v-model="scope.row.thum_url" /></span>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="80"
        >
          <template #default="scope">
            <el-button
              v-if="!scope.row.editing"
              link
              type="primary"
              size="small"
              @click="scope.row.editing = true"
            >
              Edit
            </el-button>
            <el-button
              v-else
              link
              type="primary"
              size="small"
              @click="handleUpdateRemote(scope.row)"
            >
              Fin
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="btn-block">
      <el-button
        type="success"
        :icon="Plus"
        circle
        @click="addRow"
      />
      <el-button
        type="danger"
        :icon="Refresh"
        circle
        @click="revoke"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@include Uni-SUFS-Container;
</style>
