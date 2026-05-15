<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :inline="true" :model="queryParams">
        <el-form-item label="模型名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入模型名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="模型 Key">
          <el-input
            v-model="queryParams.key"
            placeholder="请输入模型 Key"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery"
            >搜索</el-button
          >
          <el-button :icon="Refresh" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 数据表格 -->
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>流程模型列表</span>
          <div class="header-actions">
            <el-button
              type="success"
              :icon="Download"
              :disabled="selectedModels.length === 0"
              @click="handleBatchExport"
            >
              批量导出
            </el-button>
            <el-button type="warning" :icon="Upload" @click="triggerImportXml">
              导入 XML
            </el-button>
            <el-button type="primary" :icon="Plus" @click="openCreateDialog"
              >新建模型</el-button
            >
            <input
              ref="xmlInput"
              type="file"
              accept=".bpmn,.xml"
              style="display: none"
              @change="handleImportXml"
            />
            <span v-if="selectedModels.length > 0" class="selected-count">
              已选择 {{ selectedModels.length }} 项
            </span>
          </div>
        </div>
      </template>

      <el-table
        :data="modelList"
        v-loading="loading"
        border
        stripe
        show-overflow-tooltip
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column prop="id" label="ID" width="80" align="center" />
        <el-table-column
          prop="name"
          label="模型名称"
          min-width="150"
          align="center"
        />
        <el-table-column
          prop="key"
          label="模型 Key"
          min-width="150"
          align="center"
        />
        <el-table-column
          prop="category"
          label="分类"
          min-width="100"
          align="center"
        />
        <el-table-column
          prop="version"
          label="版本"
          width="80"
          align="center"
        />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? "已部署" : "草稿" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="createTime"
          label="创建时间"
          min-width="160"
          align="center"
        />
        <el-table-column label="操作" width="380" align="center" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button type="primary" link @click="handleEdit(row)"
                >设计</el-button
              >
              <el-button
                v-if="row.status !== 1"
                type="success"
                link
                @click="handleDeploy(row)"
                >部署</el-button
              >
              <el-button type="info" link @click="handleView(row)"
                >预览</el-button
              >
              <el-button type="danger" link @click="handleDelete(row)"
                >删除</el-button
              >
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <el-pagination
        v-model:current-page="queryParams.current"
        v-model:page-size="queryParams.size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
        class="pagination"
      />
    </el-card>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="`流程预览 - ${previewModel?.name}`"
      width="80%"
      align-center
      destroy-on-close
    >
      <BpmnViewer v-if="previewVisible" :xml="previewXml" />
    </el-dialog>

    <!-- 新建模型表单对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建流程模型"
      width="500px"
      align-center
      destroy-on-close
      @closed="resetCreateForm"
    >
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="模型名称" prop="name">
          <el-input
            v-model="createForm.name"
            placeholder="请输入模型名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="模型 Key" prop="key">
          <el-input
            v-model="createForm.key"
            placeholder="请输入模型 Key"
            maxlength="50"
            show-word-limit
          >
            <template #prefix>
              <el-tooltip content="唯一标识，用于流程启动">
                <el-icon><InfoFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select
            v-model="createForm.category"
            placeholder="请选择分类"
            clearable
          >
            <el-option label="审批流程" value="approval" />
            <el-option label="业务流程" value="business" />
            <el-option label="通知流程" value="notification" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模型描述（可选）"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <el-button @click="createDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleCreateSubmit"
            >确定创建并设计</el-button
          >
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, defineOptions } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { useRouter } from "vue-router";
import {
  Search,
  Refresh,
  Plus,
  Download,
  InfoFilled,
  Upload,
} from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import BpmnViewer from "@/components/bpmn/BpmnViewer.vue";
import {
  getModelList,
  createModel,
  deleteModel,
  deployModel,
  getModelXml,
  importModel,
} from "@/api/workflow";
import type { ModelVO } from "@/types";
import { useTable } from "@/hooks/useTable";
import { requiredRule } from "@/utils/rules";

// 定义组件名称，用于 Keep-Alive 缓存
defineOptions({ name: "WorkflowModels" });

interface ModelItem extends ModelVO {}

const router = useRouter();
const xmlInput = ref<HTMLInputElement>();

const previewVisible = ref(false);
const previewModel = ref<ModelItem | null>(null);
const previewXml = ref("");
const selectedModels = ref<ModelItem[]>([]);

// 新建模型对话框
const createDialogVisible = ref(false);
const createFormRef = ref<FormInstance>();
const createForm = reactive({
  name: "",
  key: "",
  category: "",
  description: "",
});

const createRules: FormRules = {
  name: requiredRule("请输入模型名称"),
  key: [
    requiredRule("请输入模型 Key"),
    {
      pattern: /^[a-zA-Z][a-zA-Z0-9_]*$/,
      message: "以字母开头，只允许字母数字下划线",
      trigger: "blur",
    },
  ],
  category: { required: true, message: "请选择分类", trigger: "change" },
};

// 使用通用 Table Hook
const modelInitialParams = { current: 1, size: 10, name: "", key: "" };
const {
  tableData: modelList,
  loading,
  total,
  queryParams,
  handleQuery,
  handleReset: resetHook,
} = useTable<ModelItem>(async (params) => {
  const res = await getModelList(params);
  return { records: Array.isArray(res) ? res : [], total: Array.isArray(res) ? res.length : 0 };
}, modelInitialParams);

function handleReset() {
  queryParams.name = "";
  queryParams.key = "";
  resetHook();
}

// 打开新建模型对话框
function openCreateDialog() {
  createDialogVisible.value = true;
}

// 重置新建表单
function resetCreateForm() {
  createForm.name = "";
  createForm.key = "";
  createForm.category = "";
  createForm.description = "";
  createFormRef.value?.resetFields();
}

// 提交新建模型
async function handleCreateSubmit() {
  if (!createFormRef.value) return;

  await createFormRef.value.validate(async (valid) => {
    if (!valid) return;

    try {
      // 先创建模型
      const modelId = await createModel({
        name: createForm.name,
        key: createForm.key,
        category: createForm.category,
        description: createForm.description,
      });

      createDialogVisible.value = false;

      // 跳转到设计页面
      router.push({
        path: "/workflow/model-design",
        query: {
          id: modelId,
          name: createForm.name,
        },
      });
    } catch (error: any) {
      ElMessage.error(`创建失败: ${error.message}`);
    }
  });
}

// 编辑模型 - 跳转到新页面
function handleEdit(row: ModelItem) {
  // 跳转到设计页面，传递模型ID
  router.push({
    path: "/workflow/model-design",
    query: {
      id: row.id,
      name: row.name,
    },
  });
}

function handleDeploy(row: ModelItem) {
  ElMessageBox.confirm(`确认部署模型「${row.name}」?`, "确认部署", {
    confirmButtonText: "确认",
    cancelButtonText: "取消",
    type: "warning",
  })
    .then(async () => {
      try {
        await deployModel(row.id);
        ElMessage.success("部署成功");
        handleQuery();
      } catch (error: any) {
        ElMessage.error(`部署失败: ${error.message}`);
      }
    })
    .catch(() => {});
}

function handleView(row: ModelItem) {
  previewModel.value = row;
  previewXml.value = row.xml || "";
  previewVisible.value = true;
}

function handleDelete(row: ModelItem) {
  ElMessageBox.confirm(
    `确认删除模型「${row.name}」? 此操作不可恢复。`,
    "确认删除",
    {
      confirmButtonText: "确认",
      cancelButtonText: "取消",
      type: "warning",
    },
  )
    .then(async () => {
      try {
        await deleteModel(row.id);
        ElMessage.success("删除成功");
        handleQuery();
      } catch (error: any) {
        ElMessage.error(`删除失败: ${error.message}`);
      }
    })
    .catch(() => {});
}

function handleSelectionChange(selection: ModelItem[]) {
  selectedModels.value = selection;
}

async function handleBatchExport() {
  if (selectedModels.value.length === 0) {
    ElMessage.warning("请选择要导出的模型");
    return;
  }

  let successCount = 0;
  let failCount = 0;

  for (const model of selectedModels.value) {
    try {
      const xml = await getModelXml(model.id);
      if (xml) {
        const blob = new Blob([xml], { type: "application/xml" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${model.key || model.name}.bpmn`;
        a.click();
        URL.revokeObjectURL(url);
        successCount++;
        // 添加小延迟避免浏览器拦截多个下载
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    } catch (error) {
      failCount++;
      console.error(`导出模型 ${model.name} 失败:`, error);
    }
  }

  if (failCount === 0) {
    ElMessage.success(`成功导出 ${successCount} 个模型`);
  } else {
    ElMessage.warning(
      `导出完成，成功 ${successCount} 个，失败 ${failCount} 个`,
    );
  }
}

// 触发导入
function triggerImportXml() {
  xmlInput.value?.click();
}

// 处理导入
async function handleImportXml(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;

  try {
    // 一步到位调用新接口
    await importModel(file);

    ElMessage.success("导入成功");
    handleQuery();
  } catch (error: any) {
    ElMessage.error(`导入失败: ${error.message}`);
  } finally {
    // 重置 input
    if (xmlInput.value) xmlInput.value.value = "";
  }
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  .header-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    .selected-count {
      font-size: 13px;
      color: #666;
    }
  }
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
}

// 设计器抽屉样式
.designer-drawer {
  :deep(.el-drawer__body) {
    padding: 0;
    overflow: hidden;
  }
}
</style>
