<template>
  <div class="page-container">
    <el-card class="detail-card" v-loading="loading">
      <template #header>
        <div class="card-header">
          <el-button :icon="Back" @click="$router.back()">返回</el-button>
          <h2>流程实例详情</h2>
        </div>
      </template>

      <!-- 流程基本信息 -->
      <el-descriptions :column="2" border class="basic-info">
        <el-descriptions-item label="流程名称">
          {{ instanceDetail.processInstance?.processDefinitionName || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="流程状态">
          <el-tag :type="statusTagType(instanceDetail.processInstance?.status)">
            {{ statusText(instanceDetail.processInstance?.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="发起人">
          {{ instanceDetail.processInstance?.initiatorName || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="发起时间">
          {{ instanceDetail.processInstance?.startTime || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="业务编号">
          {{ instanceDetail.processInstance?.businessKey || "-" }}
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag
            :type="priorityTagType(instanceDetail.processInstance?.priority)"
          >
            {{ priorityText(instanceDetail.processInstance?.priority) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="耗时" :span="2">
          {{ durationText(instanceDetail.processInstance?.durationSeconds) }}
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">
          {{ instanceDetail.processInstance?.businessDataSummary || "-" }}
        </el-descriptions-item>
      </el-descriptions>

      <!-- 当前审批节点 -->
      <el-card
        v-if="instanceDetail.processInstance?.status === 'RUNNING'"
        class="current-task-card"
      >
        <template #header>
          <div class="card-header">
            <span>当前审批节点</span>
            <el-tag type="warning">审批中</el-tag>
          </div>
        </template>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="当前节点">
            {{ instanceDetail.processInstance?.currentTaskName || "-" }}
          </el-descriptions-item>
          <el-descriptions-item label="待审批人">
            {{
              instanceDetail.processInstance?.currentAssigneeNames ||
              instanceDetail.processInstance?.currentAssigneeIds ||
              "-"
            }}
          </el-descriptions-item>
        </el-descriptions>
      </el-card>

      <!-- 流程图 -->
      <el-card class="diagram-card">
        <template #header>
          <span>流程图</span>
        </template>
        <div class="diagram-container">
          <BpmnViewer
            v-if="diagramXml"
            :xml="diagramXml"
            :highlight-nodes="highlightNodes"
            :show-controls="false"
          />
          <el-empty v-else description="暂无流程图" />
        </div>
      </el-card>

      <!-- 审批轨迹 -->
      <el-card class="approval-timeline-card">
        <template #header>
          <span>审批轨迹</span>
        </template>

        <el-timeline v-if="approvalLogs.length > 0">
          <el-timeline-item
            v-for="(log, index) in approvalLogs"
            :key="index"
            :timestamp="formatTime(log.approvalTime)"
            :placement="index === 0 ? 'top' : 'bottom'"
            :color="getActionColor(log.approvalAction)"
            :type="getActionType(log.approvalAction)"
          >
            <el-card class="approval-card" shadow="hover">
              <div class="approval-header">
                <div class="header-left">
                  <el-icon
                    class="action-icon"
                    :style="{ color: getActionColor(log.approvalAction) }"
                  >
                    <Check v-if="log.approvalAction === 'APPROVE'" />
                    <Close v-else-if="log.approvalAction === 'REJECT'" />
                    <Switch v-else-if="log.approvalAction === 'REDIRECT'" />
                    <Connection v-else-if="log.approvalAction === 'DELEGATE'" />
                    <Promotion v-else />
                  </el-icon>
                  <span class="node-name">{{
                    log.nodeName || "未知节点"
                  }}</span>
                </div>
                <el-tag
                  :type="getActionTagType(log.approvalAction)"
                  size="small"
                  effect="dark"
                >
                  {{ actionText(log.approvalAction) }}
                </el-tag>
              </div>
              <div class="approval-body">
                <div class="approver-info">
                  <el-icon><User /></el-icon>
                  <span>{{ log.approverName || "-" }}</span>
                  <span class="approver-id"
                    >(ID: {{ log.approverId || "-" }})</span
                  >
                </div>
                <div class="comment" v-if="log.approvalComment">
                  <el-icon><ChatDotRound /></el-icon>
                  <span>{{ log.approvalComment }}</span>
                </div>
                <div class="duration" v-if="log.durationSeconds">
                  <el-icon><Clock /></el-icon>
                  <span>耗时: {{ formatDuration(log.durationSeconds) }}</span>
                </div>
              </div>
            </el-card>
          </el-timeline-item>
        </el-timeline>

        <el-empty v-else description="暂无审批记录" />
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute } from "vue-router";
import {
  Back,
  User,
  ChatDotRound,
  Clock,
  Check,
  Close,
  Switch,
  Connection,
  Promotion,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { getInstanceDetail, getApprovalHistory } from "@/api/workflow";
import BpmnViewer from "@/components/bpmn/BpmnViewer.vue";

interface ApprovalLog {
  taskId: string;
  nodeName: string;
  approverId: number;
  approverName: string;
  approvalAction: string;
  approvalComment: string;
  approvalTime: string;
  durationSeconds: number;
}

interface ProcessInstance {
  processInstanceId: string;
  processDefinitionKey: string;
  processDefinitionName: string;
  initiatorId: number;
  initiatorName: string;
  businessKey: string;
  businessDataSummary: string;
  currentTaskId: string;
  currentTaskName: string;
  currentAssigneeIds: string;
  currentAssigneeNames: string;
  status: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  priority: string;
  progressPercentage: number;
}

interface InstanceDetail {
  processInstance: ProcessInstance | null;
  approvalLogs: ApprovalLog[];
}

const route = useRoute();
const loading = ref(false);
const instanceDetail = ref<InstanceDetail>({
  processInstance: null,
  approvalLogs: [],
});

const approvalLogs = ref<ApprovalLog[]>([]);
const diagramXml = ref("");
const highlightNodes = ref<string[]>([]);

onMounted(() => {
  const instanceId = route.params.instanceId as string;
  if (instanceId) {
    fetchInstanceDetail(instanceId);
  }
});

async function fetchInstanceDetail(instanceId: string) {
  loading.value = true;
  try {
    // 获取流程实例基本信息
    const res = await getInstanceDetail(instanceId);
    if (res) {
      instanceDetail.value.processInstance = res.processInstance || null;

      // 获取当前活跃节点用于高亮
      if (res.processInstance?.status === "RUNNING") {
        const currentTaskId = res.processInstance.currentTaskId;
        if (currentTaskId) {
          highlightNodes.value = [currentTaskId];
        }
      }
    }

    // 获取审批历史记录
    const logs = await getApprovalHistory(instanceId);
    approvalLogs.value = Array.isArray(logs) ? logs : [];
    instanceDetail.value.approvalLogs = approvalLogs.value;

    // 获取流程图 XML
    const { getDefinitionDiagramXml } = await import("@/api/workflow");
    if (instanceDetail.value.processInstance?.processDefinitionKey) {
      try {
        const xml = await getDefinitionDiagramXml(
          instanceDetail.value.processInstance.processDefinitionKey,
        );
        diagramXml.value = xml || "";
      } catch (error) {
        console.warn("获取流程图 XML 失败:", error);
      }
    }
  } catch (error: any) {
    console.error("获取流程实例详情失败:", error);
    ElMessage.error(`获取流程实例详情失败: ${error.message}`);
  } finally {
    loading.value = false;
  }
}

function statusTagType(
  status: string | undefined,
): "success" | "info" | "warning" | "danger" {
  const map: Record<string, "success" | "info" | "warning" | "danger"> = {
    RUNNING: "warning",
    COMPLETED: "success",
    TERMINATED: "danger",
    SUSPENDED: "info",
  };
  return map[status || ""] || "info";
}

function statusText(status: string | undefined): string {
  const map: Record<string, string> = {
    RUNNING: "审批中",
    COMPLETED: "已完成",
    TERMINATED: "已终止",
    SUSPENDED: "已挂起",
  };
  return map[status || ""] || status || "-";
}

function priorityTagType(
  priority: string | undefined,
): "success" | "warning" | "danger" | "info" {
  const map: Record<string, "success" | "warning" | "danger" | "info"> = {
    HIGH: "danger",
    MEDIUM: "warning",
    LOW: "info",
  };
  return map[priority || ""] || "info";
}

function priorityText(priority: string | undefined): string {
  const map: Record<string, string> = {
    HIGH: "高",
    MEDIUM: "中",
    LOW: "低",
  };
  return map[priority || ""] || priority || "-";
}

function durationText(seconds: number | undefined): string {
  if (!seconds) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

function formatTime(time: string): string {
  if (!time) return "";
  return time.replace("T", " ").substring(0, 19);
}

function formatDuration(seconds: number): string {
  if (!seconds) return "";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}小时${minutes}分钟`;
  }
  return `${minutes}分钟`;
}

function getActionColor(action: string): string {
  const map: Record<string, string> = {
    APPROVE: "#22c55e",
    REJECT: "#ef4444",
    REDIRECT: "#f59e0b",
    DELEGATE: "#3b82f6",
  };
  return map[action] || "#94a3b8";
}

function getActionType(
  action: string,
): "success" | "danger" | "warning" | "info" | "primary" {
  const map: Record<
    string,
    "success" | "danger" | "warning" | "info" | "primary"
  > = {
    APPROVE: "success",
    REJECT: "danger",
    REDIRECT: "warning",
    DELEGATE: "primary",
  };
  return map[action] || "info";
}

function getActionTagType(
  action: string,
): "success" | "danger" | "warning" | "info" | "primary" {
  return getActionType(action);
}

function actionText(action: string): string {
  const map: Record<string, string> = {
    APPROVE: "同意",
    REJECT: "驳回",
    REDIRECT: "转办",
    DELEGATE: "委派",
  };
  return map[action] || action || "-";
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  align-items: center;
  gap: 16px;

  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
  }
}

.basic-info {
  margin-bottom: 24px;
}

.current-task-card {
  margin-bottom: 24px;
}

.diagram-card {
  margin-bottom: 24px;

  .diagram-container {
    min-height: 500px;
    height: 600px;
    border: 1px solid #e8e8e8;
    border-radius: 8px;
    overflow: hidden;
  }
}

.approval-timeline-card {
  :deep(.el-timeline-item__timestamp) {
    font-size: 13px;
    color: #666;
  }

  .approval-card {
    :deep(.el-card__body) {
      padding: 16px;
    }

    .approval-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .action-icon {
          font-size: 18px;
        }

        .node-name {
          font-size: 15px;
          font-weight: 500;
          color: #333;
        }
      }
    }

    .approval-body {
      display: flex;
      flex-direction: column;
      gap: 8px;

      .approver-info,
      .comment,
      .duration {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: 14px;
        color: #666;

        .el-icon {
          font-size: 16px;
        }

        .approver-id {
          font-size: 12px;
          color: #999;
        }
      }

      .comment {
        padding: 8px 12px;
        background: #f5f5f5;
        border-radius: 4px;
      }
    }
  }
}
</style>
