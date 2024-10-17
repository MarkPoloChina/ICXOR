<script setup lang="ts">
import { Check, Remove } from '@element-plus/icons-vue'
import { API } from '@render/ts/api'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useStore } from 'vuex'

const store = useStore()
const localBase = ref('')
const remoteBase = ref('')
onMounted(() => {
  initForm()
})
const tableData = ref([])
async function initForm() {
  localBase.value = store.state.picoltLocalBase
  remoteBase.value = store.state.picoltRemoteBase
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
async function handleUpdateRemoteBase() {
  store.commit('reviseByKey', { key: 'picoltRemoteBase', value: remoteBase.value })
  ElMessage.success('修改成功')
}
async function handleUpdateLocalBase() {
  store.commit('reviseByKey', { key: 'picoltLocalBase', value: localBase.value })
  ElMessage.success('修改成功')
}
</script>

<template>
  <div class="config">
    <div class="title-block">
      PICOLT聚合基
    </div>
    <div class="form-block">
      <el-form
        style="width: 100%"
        label-width="60px"
      >
        <el-form-item label="远程基">
          <el-input v-model="remoteBase">
            <template #append>
              <el-button
                :icon="Check"
                @click="handleUpdateRemoteBase"
              />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="本地基">
          <el-input v-model="localBase">
            <template #append>
              <el-button
                :icon="Check"
                @click="handleUpdateLocalBase"
              />
            </template>
          </el-input>
        </el-form-item>
      </el-form>
      <el-table
        :data="tableData"
        style="width: 100%"
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
