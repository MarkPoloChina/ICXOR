<script setup lang="ts">
defineProps({
  modelValue: Boolean,
  info: Object,
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="详细信息"
    width="70%"
    :before-close="() => emit('update:modelValue', false)"
  >
    <el-descriptions :column="3" border>
      <template #extra>
        <!-- <el-button type="primary">Operation</el-button> -->
      </template>
      <el-descriptions-item>
        <template #label>
          来源
        </template>
        {{ info.remote_base.name }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          PID
        </template>
        {{ info.meta.pid }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          Page
        </template>
        {{ info.meta.page }}
      </el-descriptions-item>
      <el-descriptions-item>
        <template #label>
          标题
        </template>
        {{ info.meta.title }}
      </el-descriptions-item>
    </el-descriptions>
    <!-- <template #footer>
      <span class="dialog-footer">
        <el-button @click="emit('update:modelValue', false)">Cancel</el-button>
        <el-button type="primary" @click="emit('update:modelValue', false)"
          >Confirm</el-button
        >
      </span>
    </template> -->
  </el-dialog>
</template>

<style lang="scss" scoped></style>
