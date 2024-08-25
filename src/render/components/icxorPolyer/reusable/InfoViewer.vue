<script setup lang="ts">
import type { IllustObj } from '@render/ts/interface/illustObj'

defineProps({
  modelValue: Boolean,
  info: Object as () => IllustObj,
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="详细信息"
    width="80%"
    :before-close="() => emit('update:modelValue', false)"
  >
    <el-descriptions
      v-if="info"
      style="margin-bottom: 10px"
      title="基准"
      border
    >
      <el-descriptions-item label="ID">
        {{ info.id }}
      </el-descriptions-item>
      <el-descriptions-item label="类型">
        {{ info.remote_base.name }}
      </el-descriptions-item>
      <el-descriptions-item v-if="info.remote_endpoint" label="末端">
        {{ info.remote_endpoint }}
      </el-descriptions-item>
      <el-descriptions-item label="评分">
        <el-rate :model-value="info.star" :disabled="true" clearable />
      </el-descriptions-item>
      <el-descriptions-item label="入库时间">
        <el-date-picker
          :model-value="info.date"
          style="width: 180px"
          value-format="YYYY-MM-DD"
          type="date"
          placeholder="选择入库时间"
          :disabled="true"
        />
      </el-descriptions-item>
      <el-descriptions-item label="标签">
        <el-tag v-for="tag in info.tag" :key="tag.id">
          {{ tag.name }}
        </el-tag>
        {{ !info.tag || info.tag.length === 0 ? "-" : "" }}
      </el-descriptions-item>
    </el-descriptions>
    <el-descriptions
      v-if="info && info.meta"
      class="info"
      title="元数据"
      border
    >
      <el-descriptions-item label="PId">
        {{ info.meta.pid }}
      </el-descriptions-item>
      <el-descriptions-item label="页号">
        {{ info.meta.page }}
      </el-descriptions-item>
      <el-descriptions-item label="限制级">
        <el-tag
          v-if="info.meta.limit === 'R-18G'"
          type="danger"
        >
          {{ info.meta.limit }}
        </el-tag>
        <el-tag
          v-else-if="info.meta.limit === 'R-18'"
          type="warning"
        >
          {{ info.meta.limit }}
        </el-tag>
        <el-tag
          v-else-if="info.meta.limit === 'normal'"
          type="success"
        >
          全年龄
        </el-tag>
        <el-tag
          v-else
          type="info"
        >
          未知
        </el-tag>
      </el-descriptions-item>
      <el-descriptions-item label="作者">
        {{
          info.meta.author_id && info.meta.author
            ? `[${info.meta.author_id}] ${info.meta.author}`
            : "-"
        }}
      </el-descriptions-item>
      <el-descriptions-item label="收藏数">
        {{ info.meta.book_cnt ?? "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="标题">
        {{ info.meta.title ?? "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="宽度">
        {{ info.meta.width ?? "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="高度">
        {{ info.meta.height ?? "-" }}
      </el-descriptions-item>
      <el-descriptions-item label="pixiv标签">
        <div v-if="info.meta.tags_str">
          <el-tag
            v-for="tag in info.meta.tags_str.split(',')"
            :key="tag"
          >
            {{ tag }}
          </el-tag>
        </div>
        <div v-else>
          -
        </div>
      </el-descriptions-item>
    </el-descriptions>
  </el-dialog>
</template>

<style lang="scss" scoped></style>
