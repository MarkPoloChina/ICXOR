<script setup lang="ts">
import url from '@render/assets/img/avatar.jpg'
import { computed } from 'vue'
import { useStore } from 'vuex'

const store = useStore()

const username = computed(() => {
  return store.state.username
})
</script>

<template>
  <div class="main-container">
    <div class="title">
      欢迎
    </div>
    <div class="home-main">
      <div class="home-welcome">
        Hi,
        <span>{{ username }}</span>
      </div>
      <el-image
        :src="url"
        class="home-img"
      />
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
@include Uni-Main-Container;
.main-container {
  .home-main {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
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
      width: min(50vh, 50vw);
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
