<script setup lang="ts">
import { Check, Refresh } from '@element-plus/icons-vue'
import store from '@render/store/index'
import { API } from '@render/ts/api'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const diskBase = ref('')
const ihsBase = ref('')
onMounted(() => {
  initForm()
})
const tableData = ref([])
async function initForm() {
  diskBase.value = store.state.picoltDiskBase
  ihsBase.value = store.state.picoltIHSBase
  const data = await API.getPoly('picolt')
  tableData.value = [...data]
}
function revoke() {
  tableData.value.length = 0
  initForm()
}
async function handleUpdate(row) {
  await API.updateRemotePoly(row)
  ElMessage.success('修改成功')
  row.editing = false
}
async function handleUpdateIhsBase() {
  store.commit('reviseByKey', { key: 'picoltIHSBase', value: ihsBase.value })
  ElMessage.success('修改成功')
}
async function handleUpdateDiskBase() {
  store.commit('reviseByKey', { key: 'picoltDiskBase', value: diskBase.value })
  ElMessage.success('修改成功')
}
</script>

<template>
  <div class="sufs-container">
    <div class="title-block">
      PICOLT聚合基
    </div>
    <div class="form-block">
      <el-form
        style="width: 100%"
        label-width="100px"
      >
        <el-form-item label="IHS中缀">
          <el-input v-model="ihsBase">
            <template #append>
              <el-button
                :icon="Check"
                @click="handleUpdateIhsBase"
              />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="磁盘前缀">
          <el-input v-model="diskBase">
            <template #append>
              <el-button
                :icon="Check"
                @click="handleUpdateDiskBase"
              />
            </template>
          </el-input>
        </el-form-item>
      </el-form>
    </div>
    <div class="main-block">
      <el-table
        :data="tableData"
        style="width: 100%; height: 100%"
      >
        <el-table-column
          prop="parent"
          label="父标识符"
          width="100px"
        />
        <el-table-column
          prop="name"
          label="标识符"
          width="100px"
        />
        <el-table-column label="原图目录">
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.remote_base }}</span>
            <span v-else><el-input v-model="scope.row.remote_base" /></span>
          </template>
        </el-table-column>
        <el-table-column label="2x目录">
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.remote2x_base }}</span>
            <span v-else><el-input v-model="scope.row.remote2x_base" /></span>
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
              @click="handleUpdate(scope.row)"
            >
              Fin
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    <div class="btn-block">
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
