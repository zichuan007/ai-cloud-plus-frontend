<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>节点策略配置</span>
          <div>
            <el-select v-model="selectedProcessKey" placeholder="选择流程" @change="loadConfigs" style="width: 200px; margin-right: 10px;">
              <el-option v-for="p in processList" :key="p.key" :label="p.name" :value="p.key" />
            </el-select>
            <el-button type="primary" :icon="Plus" @click="handleCreate" :disabled="!selectedProcessKey">新增配置</el-button>
          </div>
        </div>
      </template>

      <el-table :data="configList" v-loading="loading" border stripe>
        <el-table-column prop="nodeDefKey" label="节点ID" width="180" />
        <el-table-column prop="nodeName" label="节点名称" width="150" />
        <el-table-column prop="assignType" label="分配类型" width="120">
          <template #default="{ row }">
            <el-tag>{{ assignTypeMap[row.assignType] || row.assignType }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="approveMode" label="审批模式" width="120">
          <template #default="{ row }">
            <el-tag :type="row.approveMode === 'ALL' ? 'warning' : 'success'">
              {{ approveModeMap[row.approveMode] || row.approveMode }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rejectMode" label="驳回模式" width="120" />
        <el-table-column prop="assignValue" label="分配值" min-width="200" show-overflow-tooltip />
        <el-table-column label="操作" width="150" align="center">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 配置对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="700px" align-center>
      <el-form ref="formRef" :model="formData" :rules="formRules" label-width="120px">
        <el-form-item label="流程Key" prop="processDefKey">
          <el-input v-model="formData.processDefKey" :disabled="!!formData.id" />
        </el-form-item>
        <el-form-item label="节点ID" prop="nodeDefKey">
          <el-input v-model="formData.nodeDefKey" :disabled="!!formData.id" />
        </el-form-item>
        <el-form-item label="节点名称" prop="nodeName">
          <el-input v-model="formData.nodeName" />
        </el-form-item>
        <el-form-item label="分配类型" prop="assignType">
          <el-select v-model="formData.assignType" @change="onTypeChange">
            <el-option label="指定用户" value="USER" />
            <el-option label="指定角色" value="ROLE" />
            <el-option label="指定部门" value="DEPT" />
            <el-option label="指定岗位" value="POST" />
            <el-option label="API动态获取" value="API" />
          </el-select>
        </el-form-item>
        <el-form-item label="分配值" prop="assignValue">
          <el-input v-model="formData.assignValue" placeholder="角色编码/部门ID/表达式等" />
        </el-form-item>
        <el-form-item label="审批模式" prop="approveMode">
          <el-radio-group v-model="formData.approveMode">
            <el-radio value="ANY">或签（一人通过即可）</el-radio>
            <el-radio value="ALL">会签（需所有人同意）</el-radio>
            <el-radio value="SEQUENTIAL">顺签（依次审批）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="驳回模式" prop="rejectMode">
          <el-select v-model="formData.rejectMode">
            <el-option label="退回发起人" value="INITIATOR" />
            <el-option label="退回上一节点" value="PREVIOUS" />
            <el-option label="自定义节点" value="CUSTOM" />
            <el-option label="走BPMN连线" value="BPMN" />
          </el-select>
        </el-form-item>
        <el-form-item label="找不到人时" prop="emptyHandler">
          <el-select v-model="formData.emptyHandler">
            <el-option label="转交管理员" value="TO_ADMIN" />
            <el-option label="转交发起人" value="TO_INITIATOR" />
            <el-option label="自动跳过" value="SKIP" />
            <el-option label="自动驳回" value="REJECT" />
          </el-select>
        </el-form-item>
        <el-form-item label="允许转交">
          <el-switch v-model="formData.allowTransfer" :active-value="1" :inactive-value="0" />
        </el-form-item>
        <el-form-item label="允许加签">
          <el-switch v-model="formData.allowAddSign" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Plus } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';
import {
  getNodeConfigsByProcess,
  createNodeConfig,
  updateNodeConfig,
  deleteNodeConfig,
  getDefinitionList,
} from '@/api/workflow';
import type { NodeConfigVO } from '@/types';
import { requiredRule } from '@/utils/rules';

const assignTypeMap: Record<string, string> = {
  USER: '指定用户',
  ROLE: '指定角色',
  DEPT: '指定部门',
  POST: '指定岗位',
  API: 'API动态',
};

const approveModeMap: Record<string, string> = {
  ANY: '或签',
  ALL: '会签',
  SEQUENTIAL: '顺签',
};

const selectedProcessKey = ref('');
const processList = ref<any[]>([]);
const configList = ref<NodeConfigVO[]>([]);
const loading = ref(false);
const dialogVisible = ref(false);
const dialogTitle = ref('新增配置');
const submitLoading = ref(false);
const formRef = ref<FormInstance>();

const formData = reactive<NodeConfigVO>({
  processDefKey: '',
  nodeDefKey: '',
  nodeName: '',
  assignType: 'ROLE',
  assignValue: '',
  approveMode: 'ANY',
  rejectMode: 'INITIATOR',
  emptyHandler: 'TO_ADMIN',
  allowTransfer: 1,
  allowAddSign: 1,
  enabled: 1,
});

const formRules = {
  processDefKey: [requiredRule('请选择流程')],
  nodeDefKey: [requiredRule('请输入节点ID')],
  assignType: [requiredRule('请选择分配类型')],
  assignValue: [requiredRule('请输入分配值')],
};

async function loadProcesses() {
  try {
    const res = await getDefinitionList({});
    processList.value = Array.isArray(res) ? res : (res as any).data || [];
  } catch (e) {
    console.error('加载流程列表失败', e);
  }
}

async function loadConfigs() {
  if (!selectedProcessKey.value) return;
  loading.value = true;
  try {
    const res = await getNodeConfigsByProcess(selectedProcessKey.value);
    configList.value = Array.isArray(res) ? res : (res as any).data || [];
  } catch (e) {
    ElMessage.error('加载配置失败');
  } finally {
    loading.value = false;
  }
}

function handleCreate() {
  dialogTitle.value = '新增配置';
  Object.assign(formData, {
    id: undefined,
    processDefKey: selectedProcessKey.value,
    nodeDefKey: '',
    nodeName: '',
    assignType: 'ROLE',
    assignValue: '',
    approveMode: 'ANY',
    rejectMode: 'INITIATOR',
    emptyHandler: 'TO_ADMIN',
    allowTransfer: 1,
    allowAddSign: 1,
  });
  dialogVisible.value = true;
}

function handleEdit(row: NodeConfigVO) {
  dialogTitle.value = '编辑配置';
  Object.assign(formData, row);
  dialogVisible.value = true;
}

async function handleDelete(row: NodeConfigVO) {
  try {
    await ElMessageBox.confirm('确定删除该节点配置吗？', '提示', { type: 'warning' });
    if (row.id) {
      await deleteNodeConfig(String(row.id));
      ElMessage.success('删除成功');
      loadConfigs();
    }
  } catch (e) {
    // 用户取消
  }
}

function onTypeChange() {
  formData.assignValue = '';
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (formData.id) {
        await updateNodeConfig(String(formData.id), formData);
      } else {
        await createNodeConfig(formData);
      }
      ElMessage.success('保存成功');
      dialogVisible.value = false;
      loadConfigs();
    } catch (e) {
      ElMessage.error('保存失败');
    } finally {
      submitLoading.value = false;
    }
  });
}

onMounted(() => {
  loadProcesses();
});
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.page-container {
  padding: 20px;
}
</style>
