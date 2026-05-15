<template>
  <div class="error-boundary">
    <template v-if="hasError">
      <div class="error-content">
        <el-icon :size="48" color="#F56C6C"><WarningFilled /></el-icon>
        <h3 class="error-title">页面加载失败</h3>
        <p class="error-message">
          {{ errorMessage || "未知错误，请稍后重试" }}
        </p>
        <el-button type="primary" @click="resetError">
          <el-icon><RefreshRight /></el-icon>
          重新加载
        </el-button>
      </div>
    </template>
    <slot v-else></slot>
  </div>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from "vue";
import { WarningFilled, RefreshRight } from "@element-plus/icons-vue";

const hasError = ref(false);
const errorMessage = ref("");

onErrorCaptured((err, _instance, info) => {
  hasError.value = true;
  errorMessage.value = err.message || "组件渲染失败";
  console.error("ErrorBoundary caught:", err, info);

  // 阻止错误继续向上传播
  return false;
});

function resetError() {
  hasError.value = false;
  errorMessage.value = "";
  window.location.reload();
}
</script>

<style scoped lang="scss">
.error-boundary {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .error-content {
    text-align: center;
    padding: 40px;

    .error-title {
      margin: 16px 0 8px;
      font-size: 20px;
      color: #303133;
    }

    .error-message {
      margin-bottom: 24px;
      color: #909399;
      font-size: 14px;
    }
  }
}
</style>
