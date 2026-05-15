<template>
  <div class="page-container">
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>发起流程</span>
        </div>
      </template>

      <!-- 流程选择 -->
      <div v-if="!selectedProcess" class="process-selector">
        <el-input
          v-model="searchText"
          placeholder="搜索流程名称..."
          :prefix-icon="Search"
          clearable
          class="search-input"
        />
        <el-row :gutter="16" class="process-grid">
          <el-col
            v-for="process in filteredProcesses"
            :key="process.key"
            :xs="24"
            :sm="12"
            :md="8"
            :lg="6"
          >
            <el-card
              class="process-card"
              shadow="hover"
              @click="handleSelectProcess(process)"
            >
              <div class="process-icon">
                <el-icon :size="40"><Document /></el-icon>
              </div>
              <div class="process-info">
                <h3>{{ process.name }}</h3>
                <p>{{ process.description || "暂无描述" }}</p>
              </div>
            </el-card>
          </el-col>
        </el-row>
        <el-empty
          v-if="filteredProcesses.length === 0"
          description="暂无可发起的流程"
        />
      </div>

      <!-- 流程表单与预览 -->
      <div v-else class="process-form">
        <div class="form-header">
          <el-button :icon="Back" @click="handleBack">返回选择</el-button>
          <h2>{{ selectedProcess.name }}</h2>
          <p>{{ selectedProcess.description }}</p>
        </div>

        <el-row :gutter="24">
          <!-- 左侧：动态生成的表单 -->
          <el-col :span="14">
            <el-form
              ref="formRef"
              :model="formData"
              :rules="formRules"
              label-width="120px"
              class="flow-form"
            >
              <el-form-item label="流程标题" prop="title">
                <el-input v-model="formData.title" placeholder="请输入流程标题" />
              </el-form-item>
              <el-form-item label="业务编号" prop="businessKey">
                <el-input
                  v-model="formData.businessKey"
                  placeholder="请输入业务编号（可选）"
                />
              </el-form-item>

              <!-- 动态渲染 BPMN 节点配置 -->
              <template v-if="parsedNodes.length">
                <el-divider>流程节点预览</el-divider>
                
                <template v-for="node in parsedNodes" :key="node.id">
                  <!-- 1. 用户任务：V2.0 审批人已由 wf_node_config 动态解析，无需手动选择 -->
                  <el-form-item
                    v-if="node.type === 'UserTask'"
                    :label="node.name"
                  >
                    <el-tag type="info">系统自动分配 (依据节点策略配置)</el-tag>
                  </el-form-item>

                  <!-- 2. 排他网关：填写流转条件 -->
                  <el-form-item
                    v-else-if="node.type === 'ExclusiveGateway'"
                    :label="node.name"
                    :prop="`variables.${node.id}`"
                    :rules="[{ required: true, message: '请输入流转条件', trigger: 'blur' }]"
                  >
                    <el-input
                      v-model="formData.variables[node.id]"
                      placeholder="例如：${amount > 5000}"
                    >
                      <template #prepend>条件表达式</template>
                    </el-input>
                  </el-form-item>
                </template>
              </template>

              <el-form-item label="备注" prop="remark">
                <el-input
                  v-model="formData.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入备注信息"
                />
              </el-form-item>
            </el-form>

            <div class="form-actions">
              <el-button @click="handleBack">取消</el-button>
              <el-button type="primary" @click="handleSubmit" :loading="submitting">
                提交流程
              </el-button>
            </div>
          </el-col>

          <!-- 右侧：流程图预览 -->
          <el-col :span="10">
            <div class="bpmn-preview-container">
              <h4>流程图预览</h4>
              <BpmnViewer :xml="bpmnXml" :show-controls="false" />
            </div>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Search, Back, Document } from "@element-plus/icons-vue";
import { ElMessage, type FormInstance, type FormRules } from "element-plus";
import { getStartableProcesses, startProcess, getDefinitionDiagramXml } from "@/api/workflow";
import BpmnViewer from "@/components/bpmn/BpmnViewer.vue";

// @ts-ignore - bpmn-moddle 缺少类型定义
import BpmnModdle from "bpmn-moddle";
const moddle = new BpmnModdle();

interface ProcessOption {
  id: string;
  key: string;
  name: string;
  description: string;
}

interface ParsedNode {
  id: string;
  name: string;
  type: "UserTask" | "ExclusiveGateway" | string;
}

const router = useRouter();
const loading = ref(false);
const submitting = ref(false);
const searchText = ref("");
const processList = ref<ProcessOption[]>([]);
const selectedProcess = ref<ProcessOption | null>(null);
const formRef = ref<FormInstance>();

const formData = reactive({
  title: "",
  businessKey: "",
  remark: "",
  variables: {} as Record<string, any>,
});

const formRules: FormRules = {
  title: [{ required: true, message: "请输入流程标题", trigger: "blur" }],
};

// 解析后的节点列表
const parsedNodes = ref<ParsedNode[]>([]);
const bpmnXml = ref("");

const filteredProcesses = computed(() => {
  if (!searchText.value) return processList.value;
  const keyword = searchText.value.toLowerCase();
  return processList.value.filter(
    (p) =>
      p.name.toLowerCase().includes(keyword) ||
      p.description?.toLowerCase().includes(keyword),
  );
});

onMounted(() => {
  fetchProcessList();
});

async function fetchProcessList() {
  loading.value = true;
  try {
    const res = await getStartableProcesses();
    processList.value = Array.isArray(res) ? res : [];
  } catch (error: any) {
    ElMessage.error(`获取可发起流程失败: ${error.message}`);
    processList.value = [];
  } finally {
    loading.value = false;
  }
}

async function handleSelectProcess(process: ProcessOption) {
  selectedProcess.value = process;
  formData.title = `${process.name}-${new Date().toLocaleDateString()}`;
  
  // 重置状态
  parsedNodes.value = [];
  bpmnXml.value = "";
  formData.variables = {};

  try {
    // 1. 获取 BPMN XML
    const xmlRes: any = await getDefinitionDiagramXml(process.id);
    // 兼容不同的响应结构
    bpmnXml.value = typeof xmlRes === 'string' ? xmlRes : (xmlRes.data || xmlRes);

    // 2. 解析 XML 提取关键节点
    await parseBpmnXml(bpmnXml.value);
  } catch (error) {
    console.error("加载流程图失败", error);
    ElMessage.warning("流程图加载失败，仅显示基础表单");
  }
}

/**
 * 解析 BPMN XML，提取 UserTask 和 ExclusiveGateway
 */
async function parseBpmnXml(xml: string) {
  try {
    const { rootElement } = await moddle.fromXML(xml);
    const process = rootElement.rootElements.find((el: any) => el.$type === "bpmn:Process");
    
    if (!process || !process.flowElements) return;

    const nodes: ParsedNode[] = [];
    process.flowElements.forEach((element: any) => {
      // 提取用户任务（需要指定审批人/组）
      if (element.$type === "bpmn:UserTask") {
        nodes.push({
          id: element.id,
          name: element.name || "未命名任务",
          type: "UserTask",
        });
      }
      // 提取排他网关（需要填写流转条件）
      else if (element.$type === "bpmn:ExclusiveGateway") {
        nodes.push({
          id: element.id,
          name: element.name || "未命名网关",
          type: "ExclusiveGateway",
        });
      }
    });

    parsedNodes.value = nodes;
  } catch (error) {
    console.error("BPMN 解析失败", error);
  }
}

function handleBack() {
  selectedProcess.value = null;
  resetForm();
}

function resetForm() {
  formData.title = "";
  formData.businessKey = "";
  formData.remark = "";
  formData.variables = {};
  formRef.value?.resetFields();
}

async function handleSubmit() {
  if (!formRef.value || !selectedProcess.value) return;

  await formRef.value.validate(async (valid) => {
    if (!valid) return;

    const process = selectedProcess.value;
    if (!process) {
      ElMessage.error("请选择要发起的流程");
      return;
    }

    submitting.value = true;
    try {
      await startProcess({
        processKey: process.key,
        businessKey: formData.businessKey || undefined,
        variables: formData.variables, // 直接提交解析出的节点变量
        form: formData.variables,
      });

      ElMessage.success("流程发起成功");
      router.push("/workflow/tasks/initiated");
    } catch (error: any) {
      ElMessage.error(`发起失败: ${error.message}`);
    } finally {
      submitting.value = false;
    }
  });
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.process-selector {
  .search-input {
    margin-bottom: 24px;
    max-width: 400px;
  }

  .process-grid {
    .process-card {
      cursor: pointer;
      transition: all 0.3s;
      margin-bottom: 16px;

      &:hover {
        transform: translateY(-4px);
      }

      :deep(.el-card__body) {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 20px;
      }

      .process-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        height: 60px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        color: #fff;
        flex-shrink: 0;
      }

      .process-info {
        flex: 1;
        min-width: 0;

        h3 {
          margin: 0 0 8px 0;
          font-size: 16px;
          font-weight: 500;
          color: #333;
        }

        p {
          margin: 0;
          font-size: 13px;
          color: #666;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }
  }
}

.process-form {
  .form-header {
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid #e8e8e8;

    h2 {
      margin: 12px 0 8px;
      font-size: 20px;
      font-weight: 500;
    }

    p {
      margin: 0;
      color: #666;
    }
  }

  .flow-form {
    max-width: 100%;
  }

  .form-actions {
    margin-top: 32px;
    padding-top: 24px;
    border-top: 1px solid #e8e8e8;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
  
  .bpmn-preview-container {
    height: 600px;
    background: #f5f7fa;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    padding: 12px;
    position: relative;
    
    h4 {
      margin: 0 0 12px 0;
      font-size: 14px;
      color: #606266;
    }
  }
}
</style>
