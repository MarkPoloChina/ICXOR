<script setup lang="ts">
import url from '@render/assets/img/logo.png'
import packageJson from '../../../../package.json'

const { ipcSend } = window.electron
function linkClick(url) {
  ipcSend('app:openLink', url)
}
function checkUpdate() {
  ipcSend('app:checkUpdate')
}
</script>

<template>
  <el-scrollbar height="100%">
    <div class="about">
      <el-image :src="url" class="home-img" style="width: 200px" />
      <div class="home-title">
        ICXOR
      </div>
      <div class="version">
        Ver. {{ packageJson.version }}
      </div>
      <el-link type="primary" @click="checkUpdate">
        检查更新
      </el-link>
      <div class="home-title-2">
        Powered by MPSTO
      </div>
      <div class="about-info">
        <div class="title">
          Staff
        </div>
        <div class="info">
          Designed by
          <el-link
            type="primary"
            href=""
            style="
              vertical-align: baseline;
            "
            @click="linkClick('https://github.com/MarkPoloChina')"
          >
            MarkPoloChauvet
          </el-link>
        </div>
        <div class="title">
          Thanks
        </div>
        <div class="info">
          <div>
            The Image of Home-page is Photoshopped by
            <el-link
              type="primary"
              href=""
              style="
                vertical-align: baseline;
                --el-link-text-color: #ff840c;
                --el-link-hover-text-color: #ffa40c;
              "
              @click="linkClick('https://github.com/RockRockWhite')"
            >
              RockRockWhite
            </el-link>
            from
            <el-link
              style="vertical-align: baseline"
              type="info"
              href=""
              @click="linkClick('https://www.pixiv.net/users/3036679')"
            >
              甘城なつき
            </el-link>
            in
            <el-link
              style="vertical-align: baseline"
              type="info"
              href=""
              @click="linkClick('https://www.pixiv.net/artworks/87790894')"
            >
              Pixiv
            </el-link>
          </div>
          <div style="margin-top: 5px">
            Speical Thanks to Dr.Lai for the Project
            <el-link
              style="vertical-align: baseline"
              type="info"
              href=""
              @click="linkClick('https://github.com/Creator-SN/IKFBIKFB')"
            >
              IKFB
            </el-link>
          </div>
          <div style="margin-top: 5px">
            Speical Thanks to <span style="color: #cc696b">Seven</span>
          </div>
        </div>
        <div class="title">
          LICENSE
        </div>
        <div class="info">
          <div>ICXOR is licensed under the GNU GPL v3.0.</div>
          <br>
          <div class="single-info">
            <img
              src="../../assets/img/vue-logo.svg"
              style="height: 25px; margin-right: 5px"
            >
            <div>Vue - The MIT License</div>
          </div>
          <div class="single-info">
            <img
              src="../../assets/img/element-plus-logo.svg"
              style="height: 25px; margin-right: 5px"
            >Element Plus - The MIT License
          </div>
          <div class="single-info">
            <img
              src="../../assets/img/electron-logo.svg"
              style="height: 25px; margin-right: 5px"
            >Electron - The MIT License
          </div>
          <div class="single-info">
            <img
              src="../../assets/img/nestjs.svg"
              style="height: 25px; margin-right: 5px"
            >Nest - The MIT License
          </div>
          <br>
          <div class="single-info">
            Template from&nbsp;<img
              src="../../assets/img/fvne.png"
              style="height: 25px; margin-right: 5px"
            >
            <el-link
              style="vertical-align: baseline"
              type="info"
              href=""
              @click="
                linkClick(
                  'https://github.com/ArcherGu/fast-vite-nestjs-electron',
                )
              "
            >
              fast-vite-nestjs-electron
            </el-link>&nbsp;- The MIT License
          </div>
          <div class="title">
            Visit more
          </div>
          <div class="info">
            <div>
              <el-link
                type="info"
                href=""
                @click="
                  linkClick('https://github.com/MarkPoloChina/ICXOR')
                "
              >
                Project in Github
              </el-link>
            </div>
            <div>
              <el-link
                type="primary"
                href=""
                @click="linkClick('https://www.markpolo.cn/')"
              >
                Website
              </el-link>
            </div>
          </div>
          <div class="cpr">
            <el-link
              type="info"
              href=""
              style="
                vertical-align: baseline;
              "
              @click="linkClick('https://saucenao.com/')"
            >
              SauceNAO
            </el-link>&nbsp;is a reverse image search engine.
          </div>
          <div class="cpr">
            "pixiv"和"p"图标是日本ピクシブ株式会社持有的商标,
            不代表本软件由其提供或支持
            <br>
            The "pixiv" and "p" logos are trademarks of pixiv Inc.
          </div>
          <div class="cpr">
            © Copyright 2020-2024 MarkPolo Studio, all rights reserved.
          </div>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>

<style lang="scss" scoped>
.about {
  @include Flex-C-AC;
  margin-top: 20px;
  margin-bottom: 20px;
  .home-img {
    width: 40%;
    margin-bottom: 20px;
  }
  .home-title {
    font-size: 40px;
    font-weight: bolder;
  }
  .home-title-2 {
    font-size: 25px;
  }
  .version {
    font-size: 20px;
    border-radius: 5px;
    padding: 2px 5px 2px 5px;
  }
  .about-info {
    text-align: center;
    .info {
      :deep(.el-link) {
        font-size: 16px;
      }
      .single-info {
        @include Flex-R-JC-AC;
      }
    }
    .title {
      font-size: 22px;
      margin: 20px 0 10px 0;
    }
    .cpr {
      margin-top: 35px;
    }
  }
}
</style>
