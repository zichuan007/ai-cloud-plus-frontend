<template>
  <div class="page-container">
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="流程名称">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入流程名称"
            clearable
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
          >
            <el-option label="激活" :value="1" />
            <el-option label="挂起" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>流程定义</span>
          <el-upload
            :show-file-list="false"
            :before-upload="handleDeploy"
            accept=".bpmn,.xml"
          >
            <el-button type="primary">
              <el-icon><Upload /></el-icon>
              部署流程
            </el-button>
          </el-upload>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" stripe border>
        <el-table-column
          prop="name"
          label="流程名称"
          min-width="150"
          align="center"
        />
        <el-table-column
          prop="key"
          label="流程 Key"
          min-width="150"
          align="center"
        />
        <el-table-column
          prop="version"
          label="版本"
          width="80"
          align="center"
        />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? "激活" : "挂起" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="deploymentTime"
          label="部署时间"
          width="170"
          align="center"
        />
        <el-table-column label="操作" width="340" align="center" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button text type="primary" @click="handleViewDiagram(row)"
                >流程图</el-button
              >
              <el-button
                text
                :type="row.status === 1 ? 'warning' : 'success'"
                @click="handleToggleStatus(row)"
              >
                {{ row.status === 1 ? "挂起" : "激活" }}
              </el-button>
              <el-button text type="danger" @click="handleDelete(row)"
                >删除</el-button
              >
            </div>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryParams.current"
          v-model:page-size="queryParams.size"
          :total="total"
          layout="total, sizes, prev, pager, next"
          @size-change="handleQuery"
          @current-change="handleQuery"
        />
      </div>
    </el-card>

    <!-- 流程图预览对话框 -->
    <el-dialog
      v-model="diagramVisible"
      :title="`流程图预览 - ${currentDefinition?.name}`"
      width="80%"
      align-center
      append-to-body
      destroy-on-close
    >
      <div class="diagram-container" v-loading="diagramLoading">
        <BpmnViewer v-if="diagramXml" :xml="diagramXml" />
        <el-empty v-else description="暂无流程图数据" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Upload } from "@element-plus/icons-vue";
import {
  getDefinitionList,
  deployDefinition,
  updateDefinitionStatus,
  deleteDefinition,
  getDefinitionDiagram,
} from "@/api/workflow";
import type { DefinitionVO } from "@/types";
import BpmnViewer from "@/components/bpmn/BpmnViewer.vue";
import { useTable } from "@/hooks/useTable";

const diagramVisible = ref(false);
const diagramLoading = ref(false);
const diagramXml = ref("");
const currentDefinition = ref<DefinitionVO | null>(null);

// 使用通用 Table Hook
const defInitialParams = { current: 1, size: 10, name: "", status: undefined as number | undefined };
const {
  tableData,
  loading,
  total,
  queryParams,
  handleQuery,
  handleReset: resetHook,
} = useTable<DefinitionVO>(async (params) => {
  const res = await getDefinitionList(params);
  return { records: Array.isArray(res) ? res : (res as any).records || [], total: Array.isArray(res) ? res.length : (res as any).total || 0 };
}, defInitialParams);

function handleReset() {
  queryParams.name = "";
  queryParams.status = undefined;
  resetHook();
}

async function handleDeploy(file: File) {
  try {
    await deployDefinition(file);
    ElMessage.success("流程部署成功");
    handleQuery();
  } catch {
    ElMessage.error("流程部署失败");
  }
  return false;
}

async function handleToggleStatus(row: DefinitionVO) {
  const newStatus = row.status === 1 ? 2 : 1;
  const action = newStatus === 1 ? "激活" : "挂起";
  await ElMessageBox.confirm(`确定${action}流程 "${row.name}" 吗?`, "提示", {
    type: "warning",
  });
  try {
    await updateDefinitionStatus(row.id, newStatus);
    ElMessage.success(`${action}成功`);
    handleQuery();
  } catch (error) {
    const message = error instanceof Error ? error.message : `${action}失败`;
    ElMessage.error(message);
  }
}

async function handleViewDiagram(row: DefinitionVO) {
  currentDefinition.value = row;
  diagramVisible.value = true;
  diagramLoading.value = true;
  diagramXml.value = "";

  try {
    const xml = await getDefinitionDiagram(row.id);
    if (xml) {
      diagramXml.value = typeof xml === "string" ? xml : await xml.text();
    }
  } catch (error) {
    console.error("加载流程图失败:", error);
    ElMessage.error("加载流程图失败");
  } finally {
    diagramLoading.value = false;
  }
}

async function handleDelete(row: DefinitionVO) {
  await ElMessageBox.confirm(`确定删除流程 "${row.name}" 吗?`, "提示", {
    type: "warning",
  });
  try {
    await deleteDefinition(row.id);
    ElMessage.success("删除成功");
    handleQuery();
  } catch (error) {
    const message = error instanceof Error ? error.message : "删除失败";
    ElMessage.error(message);
  }
}

onMounted(() => handleQuery());
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.diagram-container {
  min-height: 500px;
  height: 70vh;
}
</style>
