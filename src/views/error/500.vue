<template>
  <div class="error-page">
    <div class="error-content">
      <h1 class="error-code">500</h1>
      <h2 class="error-title">服务器出错了</h2>
      <p class="error-desc">请稍后重试或联系技术支持</p>
      <el-button type="primary" @click="router.push('/')">返回首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
const router = useRouter()
</script>

<style scoped lang="scss">
@import "@/assets/styles/tokens.scss";

.error-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: $color-bg-page;

  .error-content {
    text-align: center;

    .error-code {
      font-size: 120px;
      font-weight: 800;
      background: linear-gradient(135deg, $color-error 0%, $color-warm 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 16px;
    }

    .error-title {
      font-size: 24px;
      color: $color-text-primary;
      margin-bottom: 8px;
    }

    .error-desc {
      color: $color-text-secondary;
      margin-bottom: 32px;
    }
  }
}
</style>
