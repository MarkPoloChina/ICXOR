<script setup lang="ts">
import type { PixivIllust } from '@markpolochina/pixiv.ts'
import { API } from '@render/ts/api'
import type { IllustObj } from '@render/ts/interface/illustObj'
import { ElMessage } from 'element-plus'
import { computed, reactive, watch } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  currentOperating: Object,
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const baseInfo = reactive({
  date: null,
  tags: [],
  char: null,
})
const dialogVisible = computed({
  get: () => {
    return props.modelValue
  },
  set: (value) => {
    emit('update:modelValue', value)
  },
})
function initForm() {
  baseInfo.date = null
  baseInfo.tags = []
  baseInfo.char = null
}
function handleConfirm() {
  if (!baseInfo.date) {
    ElMessage.error('必须为IT赋时间')
    return
  }
  dialogVisible.value = false
  emit('confirm', baseInfo)
}
watch(() => props.currentOperating, async (val: IllustObj) => {
  if (val && val.meta) {
    const info: PixivIllust = await API.getPixivInfo(val.meta.pid)
    baseInfo.tags = info.tags.map(item => item.name)
  }
})
defineExpose({ initForm })
</script>

<template>
  <div>
    <el-dialog v-model="dialogVisible" title="IT表单" width="60%">
      <el-form :model="baseInfo" label-width="100px" style="width: 100%">
        <el-form-item label="日期">
          <el-date-picker
            v-model="baseInfo.date"
            value-format="YYYY-MM-DD"
            type="date"
            placeholder="Pick a day"
          />
        </el-form-item>
        <el-form-item label="角色">
          <el-select
            v-model="baseInfo.char"
            filterable
            allow-create
            placeholder="从标签中选择角色"
          >
            <el-option
              v-for="item in baseInfo.tags"
              :key="item"
              :label="item"
              :value="item"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="handleConfirm"> Confirm </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped></style>
