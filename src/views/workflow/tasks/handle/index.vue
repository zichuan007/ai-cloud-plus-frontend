<template>
  <div class="page-container">
    <el-row :gutter="24">
      <!-- 左侧：任务信息和审批操作 -->
      <el-col :span="16">
        <el-card class="task-info-card">
          <template #header><span>任务信息</span></template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="任务名称">{{
              taskInfo.taskName
            }}</el-descriptions-item>
            <el-descriptions-item label="流程名称">{{
              taskInfo.processName
            }}</el-descriptions-item>
            <el-descriptions-item label="发起人">{{
              taskInfo.startUserName
            }}</el-descriptions-item>
            <el-descriptions-item label="到达时间">{{
              taskInfo.createTime
            }}</el-descriptions-item>
          </el-descriptions>
        </el-card>

        <el-card class="approval-card">
          <template #header><span>审批操作</span></template>
          <el-form :model="approvalForm" label-width="80px">
            <el-form-item label="审批意见">
              <el-input
                v-model="approvalForm.comment"
                type="textarea"
                :rows="4"
                placeholder="请输入审批意见"
              />
            </el-form-item>
            <el-form-item>
              <div class="approval-actions">
                <el-button type="success" @click="handleApprove">
                  <el-icon><Select /></el-icon>
                  同意
                </el-button>
                <el-button type="danger" @click="handleReject">
                  <el-icon><Close /> </el-icon>
                  驳回
                </el-button>
                <el-button type="warning" @click="handleTransfer">
                  <el-icon><Switch /></el-icon>
                  转办
                </el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- 审批记录 -->
        <el-card class="history-card">
          <template #header><span>审批记录</span></template>
          <el-timeline v-if="approvalHistory.length > 0">
            <el-timeline-item
              v-for="(record, index) in approvalHistory"
              :key="index"
              :timestamp="record.createTime"
              placement="top"
              :color="
                record.action === '同意' || record.action === '发起流程'
                  ? '#22c55e'
                  : '#ef4444'
              "
            >
              <el-card>
                <h4>{{ record.userName }} - {{ record.action }}</h4>
                <p>{{ record.comment || "无意见" }}</p>
              </el-card>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无审批记录" />
        </el-card>
      </el-col>

      <!-- 右侧：流程图 -->
      <el-col :span="8">
        <el-card>
          <template #header><span>流程图</span></template>
          <div class="diagram-container">
            <BpmnViewer
              v-if="diagramXml"
              :xml="diagramXml"
              :show-controls="false"
            />
            <el-empty v-else description="暂无流程图" />
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Select, Close, Switch } from "@element-plus/icons-vue";
import {
  approveTask,
  rejectTask,
  transferTask,
  getApprovalHistory,
  getDefinitionDiagram,
} from "@/api/workflow";
import BpmnViewer from "@/components/bpmn/BpmnViewer.vue";

const route = useRoute();
const router = useRouter();
const taskId = route.params.taskId as string;

const taskInfo = reactive({
  taskName: "",
  processName: "",
  startUserName: "",
  createTime: "",
  processInstanceId: "",
  definitionId: "",
});

const approvalForm = reactive({ comment: "" });
const approvalHistory = ref<any[]>([]);
const diagramXml = ref("");

onMounted(() => {
  loadTaskInfo();
  loadApprovalHistory();
  loadDiagram();
});

function loadTaskInfo() {
  const query = route.query;
  taskInfo.taskName = (query.taskName as string) || "";
  taskInfo.processName = (query.processName as string) || "";
  taskInfo.startUserName = (query.startUserName as string) || "";
  taskInfo.createTime = (query.createTime as string) || "";
  taskInfo.processInstanceId = (query.instanceId as string) || "";
  taskInfo.definitionId = (query.definitionId as string) || "";
}

async function loadApprovalHistory() {
  if (!taskInfo.processInstanceId) return;

  try {
    const res = await getApprovalHistory(taskInfo.processInstanceId);
    approvalHistory.value = Array.isArray(res) ? res : [];
  } catch (error: any) {
    console.error("加载审批历史失败:", error);
    approvalHistory.value = [];
  }
}

async function loadDiagram() {
  if (!taskInfo.definitionId) return;

  try {
    const xml = await getDefinitionDiagram(taskInfo.definitionId);
    if (xml) {
      diagramXml.value = typeof xml === "string" ? xml : await xml.text();
    }
  } catch (error) {
    console.error("加载流程图失败:", error);
  }
}

async function handleApprove() {
  if (!approvalForm.comment) {
    ElMessage.warning("请输入审批意见");
    return;
  }
  try {
    await approveTask(taskId, approvalForm.comment);
    ElMessage.success("审批成功");
    router.push("/workflow/tasks/pending");
  } catch {
    ElMessage.error("审批失败");
  }
}

async function handleReject() {
  if (!approvalForm.comment) {
    ElMessage.warning("请输入驳回原因");
    return;
  }
  await ElMessageBox.confirm("确定要驳回此任务吗?", "提示", {
    type: "warning",
  });
  try {
    await rejectTask(taskId, approvalForm.comment);
    ElMessage.success("已驳回");
    router.push("/workflow/tasks/pending");
  } catch {
    ElMessage.error("驳回失败");
  }
}

async function handleTransfer() {
  ElMessageBox.prompt("请输入转办人用户 ID", "转办任务", {
    confirmButtonText: "确定",
    cancelButtonText: "取消",
    inputPattern: /^\d+$/,
    inputErrorMessage: "请输入有效的用户 ID",
  })
    .then(async ({ value }) => {
      try {
        await transferTask(
          taskId,
          parseInt(value),
          approvalForm.comment || "转办",
        );
        ElMessage.success("转办成功");
router.push("/workflow/tasks/pending");
      } catch (error: any) {
        ElMessage.error(`转办失败: ${error.message}`);
      }
    })
    .catch(() => {});
}
</script>

<style scoped lang="scss">
.task-info-card,
.approval-card,
.history-card {
  margin-bottom: 24px;
}

.approval-actions {
  display: flex;
  gap: 12px;
}

.diagram-container {
  min-height: 500px;
  height: 600px;
}
</style>
