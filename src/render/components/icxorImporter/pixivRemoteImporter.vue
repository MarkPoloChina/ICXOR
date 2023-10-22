<script setup lang="ts">
import { API } from '@render/ts/api'
import { BatchDto } from '@render/ts/dto/batch'
import { Check, Download, Remove } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { reactive, ref } from 'vue'
import type { PixivIllust } from '@markpolochina/pixiv.ts'

const resultTable = ref([])
const selectedList = ref([])
const loading = ref(false)
const table = ref()
const importOption = reactive({
  type: 'public',
  addition: {
    remote_base: {
      id: 2,
      name: 'Pixiv',
    },
    date: undefined,
  },
})
function initTab() {
  importOption.type = 'public'
  resultTable.value.length = 0
  selectedList.value.length = 0
}
function startAction() {
  loading.value = true
  API.getBookmark(importOption.type === 'private')
    .then((data) => {
      resultTable.value = data
    })
    .catch((err) => {
      ElMessage.error(`抓取出错:${err}`)
    })
    .finally(() => {
      loading.value = false
    })
}
function handleUpload() {
  if (selectedList.value.length === 0) {
    ElMessage.error('未选择任何项目')
    return
  }
  if (!importOption.addition.date) {
    ElMessage.error('必须填写入库时间, 否则无法跟踪导入')
    return
  }
  ElMessageBox.confirm(
    `将${selectedList.value.length}个项目进行上传，确认？`,
    'Warning',
    {
      confirmButtonText: 'OK',
      cancelButtonText: 'Cancel',
      type: 'warning',
    },
  )
    .then(() => {
      loading.value = true
      const dto = new BatchDto()
      dto.control.addIfNotFound = true
      let curBid = 0
      selectedList.value.forEach((ele: PixivIllust) => {
        for (let i = 0; i < ele.page_count; i++) {
          dto.dtos.push({
            dto: {
              remote_base: importOption.addition.remote_base,
              date: importOption.addition.date,
              meta: {
                pid: ele.id,
                page: i,
                title: ele.title,
                original_url:
                  ele.meta_single_page.original_image_url
                  || ele.meta_pages[i].image_urls.original,
                thumb_url:
                  ele.page_count === 1
                    ? ele.image_urls.large
                    : ele.meta_pages[i].image_urls.large,
                limit:
                  ele.x_restrict === 1
                    ? 'R-18'
                    : ele.x_restrict === 2
                      ? 'R-18G'
                      : 'normal',
                author: ele.user.name,
                author_id: ele.user.id,
                book_cnt: ele.total_bookmarks,
                width: ele.width,
                height: ele.height,
              },
            },
            bid: curBid,
          })
          curBid++
        }
      })
      API.updateIllusts(dto)
        .then(() => {
          selectedList.value.length = 0
          table.value.clearSelection()
          ElMessage.success('完成操作')
        })
        .catch((err) => {
          ElMessage.error(`错误: ${err}`)
        })
        .finally(() => {
          loading.value = false
        })
    })
    .catch(() => {})
}
function handleSelectionChange(val) {
  if (val)
    selectedList.value = val
}
</script>

<template>
  <div class="importer-main">
    <el-alert type="info" show-icon :closable="false" style="flex: none">
      <template #title>
        导入Pixiv收藏。
      </template>
    </el-alert>
    <div class="import-area">
      <div class="title-block">
        导入选项
      </div>
      <div class="form-block">
        <el-form :model="importOption" label-width="100px" style="width: 100%">
          <el-form-item label="收藏类型">
            <el-radio-group v-model="importOption.type">
              <el-radio label="public">
                公开(Public)
              </el-radio>
              <el-radio label="private">
                不公开(Private)
              </el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="入库时间">
            <el-date-picker
              v-model="importOption.addition.date"
              value-format="YYYY-MM-DD"
              type="date"
              placeholder="Pick a day"
            />
          </el-form-item>
        </el-form>
      </div>
    </div>
    <div class="result-area">
      <div class="title-block">
        筛选器
      </div>
      <el-table
        ref="table"
        v-loading="loading"
        :data="resultTable"
        class="fliter-table"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
          :selectable="
            (row) => {
              return row.visible;
            }
          "
        />
        <el-table-column
          prop="id"
          label="PID"
          width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="page_count"
          label="总页数"
          width="100"
          show-overflow-tooltip
        />
        <el-table-column
          prop="user.name"
          label="作者"
          width="150"
          show-overflow-tooltip
        />
        <el-table-column prop="title" label="标题" show-overflow-tooltip />
      </el-table>
    </div>
    <div class="btn-area">
      <el-button type="primary" :icon="Download" circle @click="startAction" />
      <el-button type="success" :icon="Check" circle @click="handleUpload" />
      <el-button type="danger" :icon="Remove" circle @click="initTab" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.importer-main {
  height: 100%;
  @include Flex-C;
}
.import-area {
  padding: 0 10px 0 10px;
  flex: none;
  .form-block {
    @include Flex-C-AC;
  }
}
.result-area {
  padding: 0 10px 0 10px;
  flex: auto;
  overflow: hidden;
  :deep(.warning-row) {
    background-color: var(--el-color-warning-light-9);
  }
  :deep(.success-row) {
    background-color: var(--el-color-success-light-9);
  }
  .fliter-table {
    height: calc(100% - 45px) !important;
    width: 100%;
  }
}
.btn-area {
  margin: 10px 0 5px 0;
  flex: none;
  @include Flex-R-JC;
  .el-button + .el-button {
    margin-left: 30px;
  }
}
.title-block {
  padding: 10px 0 10px 0;
  font-size: 18px;
  color: $color-greengray-1;
}
</style>
