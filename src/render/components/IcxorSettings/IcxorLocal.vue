<script setup lang="ts">
import { API } from '@render/ts/api'
import { Remove } from '@element-plus/icons-vue'
import { useStore } from 'vuex'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

const store = useStore()
onMounted(() => {
  initForm()
})
const tableData = ref([])
async function initForm() {
  tableData.value = (await API.getRemoteBase()).sort((a, b) => a.id - b.id).map((item) => {
    const origin_url_local = store.state.localDiskMap[item.name]?.original
    const thum_url_local = store.state.localDiskMap[item.name]?.thumbnail
    return { ...item, origin_url_local, thum_url_local }
  })
}
function revoke() {
  tableData.value.length = 0
  initForm()
}
function handleUpdateLocal(row) {
  store.commit('reviseMapByName', { name: row.name, original: row.origin_url_local, thumbnail: row.thum_url_local })
  ElMessage.success('修改成功')
  row.editing = false
}
</script>

<template>
  <div class="config">
    <div class="title-block">
      本地磁盘基
    </div>
    <div class="form-block">
      <el-table :data="tableData" style="width: 100%">
        <el-table-column prop="id" label="ID" width="50" />
        <el-table-column prop="type" label="类型" width="150" />
        <el-table-column prop="name" label="标识符" width="150" />
        <el-table-column label="原图URL">
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.origin_url_local }}</span>
            <span v-else><el-input v-model="scope.row.origin_url_local" /></span>
          </template>
        </el-table-column>
        <el-table-column label="缩略图URL">
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.thum_url_local }}</span>
            <span v-else><el-input v-model="scope.row.thum_url_local" /></span>
          </template>
        </el-table-column>
        <el-table-column fixed="right" label="操作" width="80">
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
        :icon="Remove"
        circle
        @click="revoke"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.config {
  @include Flex-C;
  height: 100%;
  .title-block {
    padding: 10px 0 10px 0;
    font-size: 18px;
    color: $color-greengray-1;
    flex: none;
  }
  .form-block {
    @include Flex-C-AC;
    overflow: hidden;
    flex: auto;
  }
  .btn-block {
    @include Flex-R-JC;
    flex: none;
    margin: 20px 0 10px 0;
  }
}
</style>
