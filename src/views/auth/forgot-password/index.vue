<template>
  <div class="forgot-password-page">
    <div class="form-container">
      <div class="form-header">
        <router-link to="/login" class="back-link">
          <el-icon><ArrowLeft /></el-icon>
          <span>返回登录</span>
        </router-link>
        <h2>忘记密码</h2>
        <p>通过验证身份重置您的密码</p>
      </div>

      <el-steps :active="currentStep" class="step-indicator" finish-status="success">
        <el-step title="验证身份" />
        <el-step title="设置新密码" />
        <el-step title="完成" />
      </el-steps>

      <!-- 步骤 1: 验证身份 -->
      <div v-show="currentStep === 0" class="step-content">
        <el-form ref="step1FormRef" :model="step1Form" :rules="step1Rules" label-position="top">
          <el-form-item label="验证方式" prop="type">
            <el-radio-group v-model="step1Form.type">
              <el-radio value="email">邮箱验证</el-radio>
              <el-radio value="phone">手机验证</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item :label="step1Form.type === 'email' ? '邮箱地址' : '手机号码'" prop="account">
            <el-input
              v-model="step1Form.account"
              :placeholder="step1Form.type === 'email' ? '请输入邮箱地址' : '请输入手机号码'"
              size="large"
            />
          </el-form-item>

          <el-form-item label="验证码" prop="code">
            <div class="code-row">
              <el-input v-model="step1Form.code" placeholder="请输入验证码" size="large" />
              <el-button
                type="primary"
                :disabled="countdown > 0"
                @click="sendCode"
              >
                {{ countdown > 0 ? `${countdown}s 后重试` : '发送验证码' }}
              </el-button>
            </div>
          </el-form-item>
        </el-form>

        <el-button type="primary" size="large" class="next-btn" @click="handleStep1Next">
          下一步
        </el-button>
      </div>

      <!-- 步骤 2: 设置新密码 -->
      <div v-show="currentStep === 1" class="step-content">
        <el-form ref="step2FormRef" :model="step2Form" :rules="step2Rules" label-position="top">
          <el-form-item label="新密码" prop="newPassword">
            <el-input
              v-model="step2Form.newPassword"
              type="password"
              placeholder="请设置新密码 (至少 6 位)"
              size="large"
              show-password
            />
          </el-form-item>

          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input
              v-model="step2Form.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              size="large"
              show-password
            />
          </el-form-item>
        </el-form>

        <div class="step-actions">
          <el-button size="large" @click="currentStep = 0">上一步</el-button>
          <el-button type="primary" size="large" @click="handleReset">确认重置</el-button>
        </div>
      </div>

      <!-- 步骤 3: 完成 -->
      <div v-show="currentStep === 2" class="step-content success-step">
        <el-icon class="success-icon"><CircleCheckFilled /></el-icon>
        <h3>密码重置成功</h3>
        <p>您的密码已成功重置，请使用新密码登录</p>
        <el-button type="primary" size="large" @click="router.push('/login')">
          返回登录
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ArrowLeft, CircleCheckFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { sendForgotPasswordCode, resetPassword } from '@/api/auth'

const router = useRouter()
const currentStep = ref(0)
const countdown = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

const step1FormRef = ref<FormInstance>()
const step2FormRef = ref<FormInstance>()

const step1Form = reactive({
  type: 'email' as 'email' | 'phone',
  account: '',
  code: '',
})

const step2Form = reactive({
  newPassword: '',
  confirmPassword: '',
})

const step1Rules: FormRules = {
  type: [{ required: true, message: '请选择验证方式', trigger: 'change' }],
  account: [
    { required: true, message: '请输入账号', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (step1Form.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          callback(new Error('请输入有效的邮箱地址'))
        } else if (step1Form.type === 'phone' && !/^1[3-9]\d{9}$/.test(value)) {
          callback(new Error('请输入有效的手机号码'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
  code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
}

const step2Rules: FormRules = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 位', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value, callback) => {
        if (value !== step2Form.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

async function sendCode() {
  if (!step1Form.account) {
    ElMessage.warning('请先输入账号')
    return
  }

  try {
    await sendForgotPasswordCode({ type: step1Form.type, account: step1Form.account })
    ElMessage.success('验证码已发送')

    // 开始倒计时
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0 && timer) {
        clearInterval(timer)
        timer = null
      }
    }, 1000)
  } catch {
    ElMessage.error('验证码发送失败')
  }
}

async function handleStep1Next() {
  if (!step1FormRef.value) return
  await step1FormRef.value.validate((valid) => {
    if (valid) {
      currentStep.value = 1
    }
  })
}

async function handleReset() {
  if (!step2FormRef.value) return
  await step2FormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      await resetPassword({
        email: step1Form.type === 'email' ? step1Form.account : '',
        code: step1Form.code,
        newPassword: step2Form.newPassword,
        confirmNewPassword: step2Form.confirmPassword,
      })
      currentStep.value = 2
    } catch {
      ElMessage.error('密码重置失败')
    }
  })
}
</script>

<style scoped lang="scss">
.forgot-password-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fafbfc 0%, #e0f2fe 100%);
  padding: 40px 20px;

  .form-container {
    width: 100%;
    max-width: 480px;
    background: $color-bg-card;
    border-radius: $radius-xl;
    box-shadow: $shadow-lg;
    padding: 40px;

    .form-header {
      margin-bottom: 32px;

      .back-link {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: $color-text-secondary;
        text-decoration: none;
        font-size: 14px;
        margin-bottom: 16px;

        &:hover {
          color: $color-primary;
        }
      }

      h2 {
        font-size: 24px;
        font-weight: 700;
        color: $color-text-primary;
        margin-bottom: 8px;
      }

      p {
        color: $color-text-secondary;
        font-size: 14px;
      }
    }

    .step-indicator {
      margin-bottom: 32px;
    }

    .step-content {
      .code-row {
        display: flex;
        gap: 12px;
      }

      .next-btn {
        width: 100%;
        margin-top: 24px;
      }

      .step-actions {
        display: flex;
        justify-content: space-between;
        margin-top: 24px;
      }

      &.success-step {
        text-align: center;
        padding: 40px 0;

        .success-icon {
          font-size: 64px;
          color: $color-success;
          margin-bottom: 16px;
        }

        h3 {
          font-size: 20px;
          color: $color-text-primary;
          margin-bottom: 8px;
        }

        p {
          color: $color-text-secondary;
          margin-bottom: 32px;
        }
      }
    }
  }
}
</style>
