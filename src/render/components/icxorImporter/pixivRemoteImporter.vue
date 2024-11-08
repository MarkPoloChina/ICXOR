<script setup lang="ts">
import type { PixivIllust } from '@markpolochina/pixiv.ts'
import { Check, Download, Remove } from '@element-plus/icons-vue'
import { API } from '@render/ts/api'
import { BatchDto } from '@render/ts/dto/batch'
import { PathHelper } from '@render/ts/util/path'
import { ElMessage, ElMessageBox, type ElTable } from 'element-plus'
import { reactive, ref } from 'vue'

const resultTable = ref([])
const selectedList = ref([])
const loading = ref(false)
const tableRef = ref<InstanceType<typeof ElTable>>()
const importOption = reactive({
  type: 'public',
  addition: {
    remote_base: {
      name: 'Pixiv',
    },
    date: undefined,
    remote_endpoint: false,
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
      resultTable.value = data.reverse()
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
  ElMessageBox.confirm(`将${selectedList.value.length}个项目进行上传，确认？`, 'Warning', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      loading.value = true
      const dto = new BatchDto()
      dto.control.updatePolicy = 'onlyAdd'
      let curBid = 0
      selectedList.value.forEach((ele: PixivIllust) => {
        for (let i = 0; i < ele.page_count; i++) {
          const ou
            = ele.meta_single_page.original_image_url || ele.meta_pages[i].image_urls.original
          dto.dtos.push({
            dto: {
              remote_base: importOption.addition.remote_base,
              date: importOption.addition.date,
              remote_endpoint: importOption.addition.remote_endpoint
                ? ele.type === 'ugoira'
                  ? `${ele.id}.gif`
                  : PathHelper.getBasename(ou)
                : undefined,
              meta: {
                pid: ele.id,
                page: i,
                type: ele.type,
                title: ele.title,
                original_url: ou,
                limit: ele.x_restrict === 1 ? 'R-18' : ele.x_restrict === 2 ? 'R-18G' : 'normal',
                author: ele.user.name,
                author_id: ele.user.id,
                book_cnt: ele.total_bookmarks,
                width: ele.width,
                height: ele.height,
                tags_str: ele.tags.map(tag => tag.name).join(','),
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
          tableRef.value.clearSelection()
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
  <div class="sufs-container">
    <div class="form-block">
      <el-alert
        type="info"
        show-icon
        :closable="false"
        style="margin-bottom: 10px"
      >
        <template #title>
          导入Pixiv收藏。
        </template>
      </el-alert>
      <el-form
        :model="importOption"
        label-width="80px"
        :inline="true"
        style="width: 100%"
        label-position="left"
      >
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
        <el-form-item>
          <el-checkbox
            v-model="importOption.addition.remote_endpoint"
            label="导入末端"
          />
        </el-form-item>
        <el-form-item label="入库时间">
          <el-date-picker
            v-model="importOption.addition.date"
            value-format="YYYY-MM-DD"
            type="date"
            placeholder="选择入库时间"
          />
        </el-form-item>
      </el-form>
    </div>
    <div class="main-block">
      <el-table
        ref="tableRef"
        v-loading="loading"
        :data="resultTable"
        style="height: 100%"
        @selection-change="handleSelectionChange"
      >
        <el-table-column
          type="selection"
          width="55"
          :selectable="
            (row) => {
              return row.visible
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
        <el-table-column
          prop="title"
          label="标题"
          show-overflow-tooltip
        />
      </el-table>
    </div>
    <div class="btn-block">
      <el-button
        type="primary"
        :icon="Download"
        circle
        @click="startAction"
      />
      <el-button
        type="success"
        :icon="Check"
        circle
        @click="handleUpload"
      />
      <el-button
        type="danger"
        :icon="Remove"
        circle
        @click="initTab"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
@include Uni-SUFS-Container;
</style>
