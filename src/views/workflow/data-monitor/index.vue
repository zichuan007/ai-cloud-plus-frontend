<template>
  <div class="data-monitor-container">
    <el-card class="header-card">
      <div class="header-content">
        <h2>🔍 流程引擎数据监听器</h2>
        <div class="input-group">
          <el-input 
            v-model="instanceId" 
            placeholder="请输入流程实例 ID (ProcessInstanceId)" 
            style="width: 400px; margin-right: 10px"
            @keyup.enter="startMonitor"
          />
          <el-button type="primary" @click="startMonitor" :loading="monitoring">
            {{ monitoring ? '监听中...' : '开始监听' }}
          </el-button>
          <el-button type="danger" @click="stopMonitor" :disabled="!monitoring">
            停止
          </el-button>
        </div>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <!-- 左侧：当前运行数据 -->
      <el-col :span="12">
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span>⚡ 当前运行任务 (ACT_RU_TASK)</span>
              <el-tag type="success" v-if="monitoring">LIVE</el-tag>
            </div>
          </template>
          <el-table :data="currentTasks" stripe style="width: 100%" height="300">
            <el-table-column prop="name" label="任务名称" width="180" />
            <el-table-column prop="assignee" label="审批人" width="120" />
            <el-table-column prop="taskDefinitionKey" label="节点 ID" />
            <el-table-column prop="createTime" label="创建时间" width="180" />
          </el-table>
          <el-empty v-if="currentTasks.length === 0" description="暂无运行中的任务" />
        </el-card>

        <el-card class="data-card" style="margin-top: 20px">
          <template #header>
            <div class="card-header">
              <span>📦 流程变量 (ACT_RU_VARIABLE)</span>
            </div>
          </template>
          <div class="variable-list">
            <div v-for="(val, key) in variables" :key="key" class="variable-item">
              <span class="var-key">{{ key }}</span>
              <span class="var-value">{{ formatValue(val) }}</span>
            </div>
            <el-empty v-if="Object.keys(variables).length === 0" description="暂无变量" />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧：历史轨迹 -->
      <el-col :span="12">
        <el-card class="data-card">
          <template #header>
            <div class="card-header">
              <span>📜 历史活动轨迹 (ACT_HI_ACTINST)</span>
            </div>
          </template>
          <el-timeline>
            <el-timeline-item
              v-for="(activity, index) in history"
              :key="index"
              :timestamp="activity.startTime"
              placement="top"
              :type="activity.endTime ? 'success' : 'warning'"
            >
              <el-card>
                <h4>{{ activity.activityName }} ({{ activity.activityId }})</h4>
                <p>类型：{{ activity.activityType }}</p>
                <p v-if="activity.assignee">审批人：{{ activity.assignee }}</p>
                <p v-if="activity.endTime">
                  耗时：{{ activity.duration }}ms
                </p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getInstanceSnapshot } from '@/api/workflow';

const instanceId = ref('');
const monitoring = ref(false);
let timer: any = null;

const currentTasks = ref<any[]>([]);
const variables = ref<Record<string, any>>({});
const history = ref<any[]>([]);

const startMonitor = () => {
  if (!instanceId.value) {
    ElMessage.warning('请输入流程实例 ID');
    return;
  }
  monitoring.value = true;
  ElMessage.success('开始监听...');
  fetchData(); // 立即执行一次
  timer = setInterval(fetchData, 2000); // 每 2 秒轮询
};

const stopMonitor = () => {
  monitoring.value = false;
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  ElMessage.info('已停止监听');
};

const fetchData = async () => {
  try {
    const res = await getInstanceSnapshot(instanceId.value);
    // 兼容多种响应结构
    const data = res?.data ?? res;
    if (data) {
      const newData = data;
      
      // 简单的变动检测：如果任务数量变了，或者历史增加了，提示用户
      if (currentTasks.value.length !== newData.runningTasks?.length) {
        ElMessage.info('⚡ 任务状态发生变化！');
      }
      if (history.value.length < newData.history?.length) {
        ElMessage.success('📜 流程流转到了新节点！');
      }

      currentTasks.value = newData.runningTasks || [];
      variables.value = newData.variables || {};
      history.value = newData.history || [];
    }
  } catch (e) {
    // 忽略错误，可能是实例不存在
  }
};

const formatValue = (val: any) => {
  if (Array.isArray(val)) return JSON.stringify(val);
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
};

onUnmounted(() => {
  stopMonitor();
});
</script>

<style scoped>
.data-monitor-container {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.input-group {
  display: flex;
  align-items: center;
}

.data-card {
  height: 100%;
}

.variable-list {
  max-height: 300px;
  overflow-y: auto;
}

.variable-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed #eee;
}

.var-key {
  font-weight: bold;
  color: #409eff;
}

.var-value {
  color: #606266;
  max-width: 60%;
  text-overflow: ellipsis;
  overflow: hidden;
}
</style>
