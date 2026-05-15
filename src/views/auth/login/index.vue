<template>
  <div class="login-page">
    <!-- 品牌展示区 -->
    <div class="brand-section">
      <div class="brand-content">
        <div class="brand-logo">
          <img src="/vite.svg" alt="AI Cloud Plus" />
        </div>
        <h1 class="brand-title">AI Cloud Plus</h1>
        <p class="brand-subtitle">企业级智能云平台</p>
        <div class="brand-features">
          <div class="feature-item">
            <el-icon><Lock /></el-icon>
            <span>统一权限管理</span>
          </div>
          <div class="feature-item">
            <el-icon><Connection /></el-icon>
            <span>智能流程引擎</span>
          </div>
          <div class="feature-item">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据驱动决策</span>
          </div>
        </div>
      </div>
      <!-- 波浪装饰 -->
      <svg
        class="wave-decoration"
        viewBox="0 0 1440 320"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="rgba(255,255,255,0.1)"
          d="M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,138.7C672,128,768,160,864,186.7C960,213,1056,235,1152,224C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
        ></path>
      </svg>
    </div>

    <!-- 登录表单区 -->
    <div class="form-section">
      <div class="form-container">
        <div class="form-header">
          <h2>欢迎登录</h2>
          <p>请输入您的账号信息</p>
        </div>

        <el-form
          ref="formRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          @keyup.enter="handleLogin"
        >
          <el-form-item prop="username">
            <el-input
              v-model="loginForm.username"
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="User"
            />
          </el-form-item>

          <el-form-item prop="password">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="Lock"
              show-password
            />
          </el-form-item>

          <el-form-item v-if="showCaptcha" prop="captcha">
            <div class="captcha-row">
              <el-input
                v-model="loginForm.captcha"
                placeholder="请输入验证码"
                size="large"
                :prefix-icon="Key"
              />
              <div class="captcha-image" @click="refreshCaptcha">
                <span>{{ captchaText }}</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item>
            <div class="form-options">
              <el-checkbox v-model="rememberMe">记住我</el-checkbox>
              <router-link to="/forgot-password" class="forgot-link"
                >忘记密码?</router-link
              >
            </div>
          </el-form-item>

          <el-form-item>
            <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="loading"
              @click="handleLogin"
            >
              {{ loading ? "登录中..." : "登 录" }}
            </el-button>
          </el-form-item>
        </el-form>

        <div class="form-footer">
          <p>© 2026 AI Cloud Plus. All rights reserved.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import {
  User,
  Lock,
  Key,
  Connection,
  DataAnalysis,
} from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";
import { login } from "@/api/auth";
import type { LoginRequest } from "@/types";

const userStore = useUserStore();

const formRef = ref<FormInstance>();
const loading = ref(false);
const rememberMe = ref(false);
const showCaptcha = ref(false);
const captchaText = ref("");
const loginFailCount = ref(0);

const loginForm = reactive<LoginRequest>({
  username: "",
  password: "",
  captcha: "",
  captchaKey: "",
});

const loginRules: FormRules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  captcha: [{ required: true, message: "请输入验证码", trigger: "blur" }],
};

onMounted(() => {
  generateCaptcha();
});

function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  captchaText.value = result;
  loginForm.captchaKey = `captcha-${Date.now()}`;
}

function refreshCaptcha() {
  generateCaptcha();
  loginForm.captcha = "";
}

async function handleLogin() {
  if (!formRef.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    loading.value = true;
    try {
      const response = await login(loginForm);

      // 🔴 增强 Token 提取逻辑，兼容后端直接返回字符串的情况
      console.log("[登录] 原始响应:", JSON.stringify(response));
      let token = "";
      if (typeof response === "string") {
        token = response;
      } else {
        token =
          (response as any).accessToken ||
          (response as any).access_token ||
          (response as any).token;
      }

      const refresh =
        (response as any).refreshToken || (response as any).refresh_token || "";

      console.log(
        "[登录] 提取结果 | token:",
        token ? `${token.slice(0, 15)}...` : "❌ 未找到",
        "| refresh:",
        refresh ? "✅" : "❌",
      );

      if (!token) {
        console.error(
          "登录响应中未找到 token，实际响应:",
          JSON.stringify(response),
        );
        ElMessage.error("登录失败：服务器返回数据格式异常");
        return;
      }

      await userStore.login(token, refresh);

      ElMessage.success("登录成功");

      // 🔴 核心修复：登录页只负责写 Cookie + 刷新，API 调用统一由路由守卫处理
      // 避免登录页调用 fetchUserInfo/generateRoutes 后刷新页面导致状态丢失、API 重复调用
      window.location.href = "/dashboard";
    } catch (error: any) {
      console.error("登录失败:", error);

      const errorMsg =
        error?.message ||
        error?.response?.data?.message ||
        "登录失败，请检查用户名和密码";
      ElMessage.error(errorMsg);

      loginFailCount.value++;
      if (loginFailCount.value >= 3) {
        showCaptcha.value = true;
      }
      refreshCaptcha();
    } finally {
      loading.value = false;
    }
  });
}
</script>

<style scoped lang="scss">
.login-page {
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background: #f0f2f5;
}

// ==================== 品牌展示区 - 浅色暖色系 ====================
.brand-section {
  flex: 1;
  background: linear-gradient(135deg, #e6f7ff 0%, #bae7ff 50%, #91d5ff 100%);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  // 装饰背景
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 20% 80%,
        rgba(64, 158, 255, 0.1) 0%,
        transparent 50%
      ),
      radial-gradient(
        circle at 80% 20%,
        rgba(103, 194, 58, 0.08) 0%,
        transparent 50%
      );
    z-index: 0;
  }

  .brand-content {
    text-align: center;
    color: #303133;
    z-index: 1;
    padding: 40px;

    .brand-logo {
      img {
        width: 72px;
        height: 72px;
        margin-bottom: 24px;
      }
    }

    .brand-title {
      font-size: 36px;
      font-weight: 600;
      margin-bottom: 12px;
      letter-spacing: -0.02em;
      color: #0369a1;
    }

    .brand-subtitle {
      font-size: 16px;
      color: #64748b;
      margin-bottom: 48px;
      font-weight: 400;
    }

    .brand-features {
      display: flex;
      flex-direction: column;
      gap: 12px;
      align-items: center;

      .feature-item {
        display: flex;
        align-items: center;
        gap: 12px;
        font-size: 14px;
        color: #595959;
        padding: 12px 20px;
        background: rgba(255, 255, 255, 0.6);
        border-radius: 8px;
        backdrop-filter: blur(4px);
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.9);
          transform: translateX(4px);
        }

        .el-icon {
          font-size: 18px;
          color: #409eff;
        }
      }
    }
  }

  .wave-decoration {
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 80px;
    opacity: 0.3;
  }
}

// ==================== 登录表单区 ====================
.form-section {
  width: 480px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  padding: 40px;
  box-shadow: -4px 0 24px rgba(0, 0, 0, 0.08);

  .form-container {
    width: 100%;
    max-width: 360px;

    .form-header {
      margin-bottom: 32px;
      text-align: center;

      h2 {
        font-size: 20px;
        font-weight: 600;
        color: #303133;
        margin-bottom: 8px;
      }

      p {
        color: #909399;
        font-size: 14px;
      }
    }

    .login-form {
      // 验证码行
      .captcha-row {
        display: flex;
        gap: 12px;

        .captcha-image {
          width: 120px;
          height: 40px;
          background: linear-gradient(135deg, #ecf5ff 0%, #f0f7ff 100%);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          font-weight: 500;
          color: #409eff;
          letter-spacing: 4px;
          user-select: none;
          transition: all 0.2s ease;
          border: 1px solid #d9ecff;

          &:hover {
            border-color: #409eff;
          }
        }
      }

      // 表单选项
      .form-options {
        display: flex;
        justify-content: space-between;
        align-items: center;
        width: 100%;

        :deep(.el-checkbox__label) {
          color: #909399;
          font-size: 13px;
        }

        .forgot-link {
          color: #409eff;
          text-decoration: none;
          font-size: 13px;

          &:hover {
            color: #66b1ff;
          }
        }
      }

      // 登录按钮
      .login-btn {
        width: 100%;
        height: 40px;
        font-size: 14px;
        font-weight: 400;
        border-radius: 6px;
        background: #409eff;
        border: 1px solid #409eff;
        transition: all 0.2s ease;

        &:hover {
          background: #66b1ff;
          border-color: #66b1ff;
        }

        &:active {
          background: #3a8ee6;
          border-color: #3a8ee6;
        }
      }
    }

    .form-footer {
      margin-top: 32px;
      text-align: center;
      color: #c0c4cc;
      font-size: 12px;
    }
  }
}

// ==================== 响应式适配 ====================
@media (max-width: 1024px) {
  .brand-section {
    display: none;
  }

  .form-section {
    width: 100%;
    max-width: none;
  }
}

@media (max-width: 768px) {
  .form-section {
    padding: 24px;

    .form-container {
      .form-header h2 {
        font-size: 18px;
      }
    }
  }
}
</style>
