<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { API } from '@render/ts/api'
import { ElMessage } from 'element-plus'

const props = defineProps({
  info: Object,
})

const emit = defineEmits(['update:info', 'upload'])
const showInfo = ref(false)
watch(() => props.info, (v, oldV) => {
  if (!oldV && v)
    showInfo.value = true
})
const writableInfo = computed({
  get: () => {
    return props.info
  },
  set: (value) => {
    emit('update:info', value)
  },
})
const writableTag = computed({
  get: () => {
    if (!writableInfo.value || !writableInfo.value.tag)
      return []
    return writableInfo.value.tag.map((value) => {
      return value.name
    })
  },
  set: (value) => {
    writableInfo.value.tag.length = 0
    writableInfo.value.tag.push(
      ...value.map((_value) => {
        return { name: _value }
      }),
    )
  },
})
const editable = ref(false)
const router = useRouter()
function toPixiv(pid, page) {
  router.push({
    name: 'pixiv',
    query: {
      redirect: 'illust',
      pid,
      page,
    },
  })
}
function toPixivUser(uid) {
  router.push({
    name: 'pixiv',
    query: {
      redirect: 'user',
      uid,
    },
  })
}
function handleStarChange(star) {
  if (!editable.value)
    return
  if (writableInfo.value.star === star)
    writableInfo.value.star = 0
  else writableInfo.value.star = star
  emit('upload', writableInfo.value)
}
function handleAddAuthorTag(tag: string) {
  API.addAuthorTag(tag).then(() => {
    ElMessage.success('添加成功')
  }).catch(() => {
    ElMessage.error('添加失败,可能已存在')
  })
}

defineExpose({ handleStarChange })
</script>

<template>
  <div class="info-container-block">
    <div class="arrow">
      <span @click="if (writableInfo) showInfo = !showInfo;">{{
        showInfo ? ">" : "<"
      }}</span>
    </div>
    <div class="main">
      <transition name="el-zoom-in-center">
        <el-scrollbar v-if="writableInfo && showInfo" class="info-container">
          <el-descriptions
            v-if="writableInfo"
            class="info"
            style="margin-bottom: 10px"
            title="基准"
            :column="1"
            border
            direction="vertical"
          >
            <template #extra>
              <span style="vertical-align: middle; margin-right: 10px">可编辑</span><el-switch v-model="editable" />
            </template>
            <el-descriptions-item label="ID">
              {{ writableInfo.id }}
            </el-descriptions-item>
            <el-descriptions-item label="类型">
              {{ writableInfo.remote_base.name }}
            </el-descriptions-item>
            <el-descriptions-item label="URL">
              {{ writableInfo.link ?? '-' }}
            </el-descriptions-item>
            <el-descriptions-item
              v-if="writableInfo.remote_endpoint"
              label="末端"
            >
              <div v-if="!editable">
                {{ writableInfo.remote_endpoint }}
              </div>
              <div v-else>
                <el-input v-model="writableInfo.remote_endpoint">
                  <template #append>
                    <el-button
                      :icon="Check"
                      @click="emit('upload', writableInfo)"
                    />
                  </template>
                </el-input>
              </div>
            </el-descriptions-item>
            <el-descriptions-item label="评分">
              <el-rate
                v-model="writableInfo.star"
                :disabled="!editable"
                clearable
                @change="emit('upload', writableInfo)"
              />
            </el-descriptions-item>
            <el-descriptions-item label="入库时间">
              <el-date-picker
                v-model="writableInfo.date"
                style="width: 180px"
                value-format="YYYY-MM-DD"
                type="date"
                placeholder="Pick a day"
                :disabled="!editable"
                @change="emit('upload', writableInfo)"
              />
            </el-descriptions-item>
            <el-descriptions-item label="标签">
              <div v-if="!editable">
                <el-tag v-for="tag in writableInfo.tag" :key="tag.id">
                  {{ tag.name }}
                </el-tag>
                {{
                  !writableInfo.tag || writableInfo.tag.length === 0 ? "-" : ""
                }}
              </div>
              <div v-else>
                <el-select
                  v-model="writableTag"
                  multiple
                  filterable
                  allow-create
                  placeholder="填写筛选标签"
                  @change="emit('upload', writableInfo)"
                />
              </div>
            </el-descriptions-item>
          </el-descriptions>
          <el-descriptions
            v-if="writableInfo && writableInfo.meta"
            class="info"
            style="margin-bottom: 10px"
            title="元数据"
            :column="1"
            border
            direction="vertical"
          >
            <el-descriptions-item label="PId">
              <el-link
                type="primary"
                :underline="false"
                @click="toPixiv(writableInfo.meta.pid, writableInfo.meta.page)"
              >
                {{ writableInfo.meta.pid }}
              </el-link>
            </el-descriptions-item>
            <el-descriptions-item label="页号">
              {{ writableInfo.meta.page }}
            </el-descriptions-item>
            <el-descriptions-item label="限制级">
              {{ writableInfo.meta.limit ?? "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="作者">
              <el-link
                v-if="writableInfo.meta.author_id && writableInfo.meta.author"
                type="primary"
                :underline="false"
                @click="toPixivUser(writableInfo.meta.author_id)"
              >
                {{
                  `[${writableInfo.meta.author_id}] ${writableInfo.meta.author}`
                }}
              </el-link>
              <span v-else>
                {{
                  "-"
                }}
              </span>
              <el-button
                v-if="writableInfo.meta.author_id && writableInfo.meta.author"
                type="primary"
                size="small"
                style="margin-left: 20px;"
                @click="handleAddAuthorTag(`[${writableInfo.meta.author_id}] ${writableInfo.meta.author}`)"
              >
                添加标签
              </el-button>
            </el-descriptions-item>
            <el-descriptions-item label="收藏数">
              {{ writableInfo.meta.book_cnt ?? "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="标题">
              {{ writableInfo.meta.title ?? "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="宽度">
              {{ writableInfo.meta.width ?? "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="高度">
              {{ writableInfo.meta.height ?? "-" }}
            </el-descriptions-item>
            <el-descriptions-item label="pixiv标签">
              <div v-if="writableInfo.meta.tags_str">
                <el-tag v-for="tag in writableInfo.meta.tags_str.split(',')" :key="tag">
                  {{ tag }}
                </el-tag>
              </div>
              <div v-else>
                -
              </div>
            </el-descriptions-item>
          </el-descriptions>
          <el-descriptions
            v-if="
              writableInfo
                && writableInfo.poly
                && writableInfo.poly.length !== 0
            "
            class="info"
            title="聚合数据"
            :column="1"
            border
            direction="vertical"
          >
            <template #extra />
            <template v-for="poly in writableInfo.poly" :key="poly.id">
              <el-descriptions-item label="聚合类型">
                {{ poly.type ?? "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="聚合簇">
                {{ poly.parent ?? "-" }}
              </el-descriptions-item>
              <el-descriptions-item label="聚合名">
                {{ poly.name ?? "-" }}
              </el-descriptions-item>
            </template>
          </el-descriptions>
        </el-scrollbar>
      </transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.info-container-block {
  padding: 10px 10px 10px 10px;
  height: calc(100% - 20px);
  display: flex;
  flex-direction: row;
  .arrow {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    span {
      cursor: pointer;
    }
  }
  .main {
    height: 100%;
    .info-container {
      margin-left: 10px;
      position: relative;
      max-height: 100%;

      .info {
        :deep(.el-descriptions__body table) {
          border-radius: 5px;
        }
      }
    }
  }
}
</style>
