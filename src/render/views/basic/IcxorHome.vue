<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from 'vuex'
import url from '@render/assets/img/avatar.jpg'

const username = computed(() => {
  return useStore().state.username
})
</script>

<template>
  <div class="home-container">
    <div class="title">
      欢迎
    </div>
    <div class="home-main">
      <div class="home-welcome">
        Hi, <span>{{ username }}</span>
      </div>
      <el-image :src="url" class="home-img" />
      <div class="home-title">
        ICXOR
      </div>
      <div class="home-title-2">
        Powered by MPSTO
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.home-container {
  @include Uni-Main-Container;
  .title {
    @include Uni-Main-Title;
  }
  .home-main {
    @include Flex-C-JC-AC;
    height: 100%;
    .home-welcome {
      font-size: 40px;
      margin: 0 0 50px 0;
      font-family: Cascadia Mono;
      color: $color-stdblue-1;
      span {
        color: $color-greengray-2;
      }
    }
    .home-img {
      width: min(50vh, 50vw) ;
      height: min(50vh, 50vw);
      margin-bottom: 20px;
      border-radius: 20px;
    }
    .home-title {
      font-size: 40px;
      font-weight: bolder;
    }
    .home-title-2 {
      font-size: 25px;
    }
  }
}
</style>
