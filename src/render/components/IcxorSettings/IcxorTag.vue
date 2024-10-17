<script setup lang="ts">
import { Remove } from '@element-plus/icons-vue'
import { API } from '@render/ts/api'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

onMounted(() => {
  initForm()
})
const tableData = ref([])
async function initForm() {
  tableData.value = (await API.getTags())
    .filter(ele => ele.type !== 'author')
    .sort((a, b) => a.id - b.id)
}
function revoke() {
  tableData.value.length = 0
  initForm()
}
function handleUpdateTag(row) {
  API.updateTag(row)
    .then(() => {
      ElMessage.success('更改成功')
      row.editing = false
    })
    .catch((err) => {
      ElMessage.error(`错误: ${err}`)
    })
}
function handleDeleteTag(row) {
  ElMessageBox.confirm('删除本标签，确认？', 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      API.deleteTag(row.id)
        .then(() => {
          ElMessage.success('删除成功')
          revoke()
        })
        .catch((err) => {
          ElMessage.error(`错误: ${err}`)
        })
    })
    .catch(() => {})
}
</script>

<template>
  <div class="config">
    <div class="title-block">
      标签
    </div>
    <div class="form-block">
      <el-table
        :data="tableData"
        style="width: 100%"
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
                v-for="item in ['simple', 'works']"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column
          label="标识符"
          min-width="150"
        >
          <template #default="scope">
            <span v-if="!scope.row.editing">{{ scope.row.name }}</span>
            <span v-else><el-input v-model="scope.row.name" /></span>
          </template>
        </el-table-column>
        <el-table-column
          fixed="right"
          label="操作"
          width="180"
        >
          <template #default="scope">
            <el-button
              link
              type="danger"
              size="small"
              @click="handleDeleteTag(scope.row)"
            >
              Delete
            </el-button>
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
              @click="handleUpdateTag(scope.row)"
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
