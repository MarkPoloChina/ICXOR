<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { computed, reactive } from 'vue'

const props = defineProps({
  modelValue: Boolean,
})

const emit = defineEmits(['update:modelValue', 'confirm'])
const baseInfo = reactive({
  date: null,
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
}
function handleConfirm() {
  if (!baseInfo.date) {
    ElMessage.error('必须为IT赋时间')
    return
  }
  dialogVisible.value = false
  emit('confirm', baseInfo)
}

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
