<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
          <el-button type="primary" @click="handleSave" :loading="saving">保存配置</el-button>
        </div>
      </template>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础配置" name="basic">
          <el-form :model="basicForm" label-width="120px" style="max-width: 600px">
            <el-form-item label="系统名称">
              <el-input v-model="basicForm.systemName" placeholder="请输入系统名称" />
            </el-form-item>
            <el-form-item label="系统版本">
              <el-input v-model="basicForm.systemVersion" disabled />
            </el-form-item>
            <el-form-item label="登录超时 (分钟)">
              <el-input-number v-model="basicForm.loginTimeout" :min="5" :max="1440" />
            </el-form-item>
            <el-form-item label="最大登录失败次数">
              <el-input-number v-model="basicForm.maxLoginFailCount" :min="3" :max="10" />
            </el-form-item>
            <el-form-item label="密码最小长度">
              <el-input-number v-model="basicForm.minPasswordLength" :min="6" :max="32" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="邮件配置" name="email">
          <el-form :model="emailForm" label-width="120px" style="max-width: 600px">
            <el-form-item label="SMTP 服务器">
              <el-input v-model="emailForm.smtpHost" placeholder="smtp.example.com" />
            </el-form-item>
            <el-form-item label="SMTP 端口">
              <el-input-number v-model="emailForm.smtpPort" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="发件人邮箱">
              <el-input v-model="emailForm.fromEmail" placeholder="noreply@example.com" />
            </el-form-item>
            <el-form-item label="发件人密码">
              <el-input v-model="emailForm.fromPassword" type="password" show-password placeholder="请输入密码" />
            </el-form-item>
            <el-form-item label="启用 SSL">
              <el-switch v-model="emailForm.enableSsl" />
            </el-form-item>
            <el-form-item>
              <el-button @click="handleTestEmail" :loading="testing">测试连接</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        <el-tab-pane label="短信配置" name="sms">
          <el-form :model="smsForm" label-width="120px" style="max-width: 600px">
            <el-form-item label="短信平台">
              <el-select v-model="smsForm.provider" placeholder="请选择短信平台">
                <el-option label="阿里云" value="aliyun" />
                <el-option label="腾讯云" value="tencent" />
              </el-select>
            </el-form-item>
            <el-form-item label="Access Key">
              <el-input v-model="smsForm.accessKey" placeholder="请输入 Access Key" />
            </el-form-item>
            <el-form-item label="Secret Key">
              <el-input v-model="smsForm.secretKey" type="password" show-password placeholder="请输入 Secret Key" />
            </el-form-item>
            <el-form-item label="签名">
              <el-input v-model="smsForm.signName" placeholder="请输入短信签名" />
            </el-form-item>
            <el-form-item>
              <el-button @click="handleTestSms" :loading="testing">测试发送</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { getSystemConfigs, saveSystemConfigs, testEmailConfig, testSmsConfig } from "@/api/system";

const activeTab = ref("basic");
const saving = ref(false);
const testing = ref(false);

const basicForm = reactive({
  systemName: "AI Cloud Plus",
  systemVersion: "v1.0.0",
  loginTimeout: 30,
  maxLoginFailCount: 5,
  minPasswordLength: 6,
});

const emailForm = reactive({
  smtpHost: "",
  smtpPort: 465,
  fromEmail: "",
  fromPassword: "",
  enableSsl: true,
});

const smsForm = reactive({
  provider: "aliyun",
  accessKey: "",
  secretKey: "",
  signName: "",
});

onMounted(() => {
  fetchConfigs();
});

async function fetchConfigs() {
  try {
    const res = await getSystemConfigs();
    if (res) {
      Object.assign(basicForm, res.basic || {});
      Object.assign(emailForm, res.email || {});
      Object.assign(smsForm, res.sms || {});
    }
  } catch (error: any) {
    console.error("获取配置失败:", error);
  }
}

async function handleSave() {
  saving.value = true;
  try {
    await saveSystemConfigs({ basic: basicForm, email: emailForm, sms: smsForm });
    ElMessage.success("配置保存成功");
  } catch (error: any) {
    ElMessage.error("配置保存失败: " + error.message);
  } finally {
    saving.value = false;
  }
}

async function handleTestEmail() {
  testing.value = true;
  try {
    await testEmailConfig(emailForm);
    ElMessage.success("测试邮件发送成功");
  } catch (error: any) {
    ElMessage.error("测试邮件发送失败: " + error.message);
  } finally {
    testing.value = false;
  }
}

async function handleTestSms() {
  testing.value = true;
  try {
    await testSmsConfig(smsForm);
    ElMessage.success("测试短信发送成功");
  } catch (error: any) {
    ElMessage.error("测试短信发送失败: " + error.message);
  } finally {
    testing.value = false;
  }
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
