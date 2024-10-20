<script setup lang="ts">
import { Check, Refresh } from '@element-plus/icons-vue'
import store from '@render/store/index'
import { API } from '@render/ts/api'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const diskRoot = ref('')
onMounted(() => {
  initForm()
  diskRoot.value = store.state.diskRoot
})
const tableData = ref([])
async function initForm() {
  tableData.value = (await API.getRemoteBase())
    .sort((a, b) => a.id - b.id)
    .map((item) => {
      const origin_url_local = store.state.diskMap[item.name]?.original
      const thum_url_local = store.state.diskMap[item.name]?.thumbnail
      return { ...item, origin_url_local, thum_url_local }
    })
}
function revoke() {
  tableData.value.length = 0
  initForm()
}
function handleUpdateLocal(row) {
  store.commit('reviseMapByName', {
    name: row.name,
    original: row.origin_url_local,
    thumbnail: row.thum_url_local,
  })
  ElMessage.success('修改成功')
  row.editing = false
}
async function handleUpdateDiskRoot() {
  store.commit('reviseByKey', { key: 'diskRoot', value: diskRoot.value })
  ElMessage.success('修改成功')
}
</script>

<template>
  <div class="sufs-container">
    <div class="title-block">
      本地磁盘基
    </div>
    <div class="form-block">
      <el-form
        style="width: 100%"
        label-width="100px"
      >
        <el-form-item label="公共前缀">
          <el-input v-model="diskRoot">
            <template #append>
              <el-button
                :icon="Check"
                @click="handleUpdateDiskRoot"
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
          prop="type"
          label="类型"
          width="150"
        />
        <el-table-column
          prop="name"
          label="标识符"
          width="150"
        />
        <el-table-column label="原图目录">
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.origin_url_local }}</span>
            <span v-else><el-input v-model="scope.row.origin_url_local" /></span>
          </template>
        </el-table-column>
        <el-table-column label="缩略图目录">
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.thum_url_local }}</span>
            <span v-else><el-input v-model="scope.row.thum_url_local" /></span>
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
              @click="handleUpdateLocal(scope.row)"
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
