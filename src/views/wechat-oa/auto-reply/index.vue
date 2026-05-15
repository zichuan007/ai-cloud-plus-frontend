<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card shadow="hover" class="search-card">
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
        <el-form-item label="公众号" prop="accountId">
          <el-select v-model="queryParams.accountId" placeholder="请选择公众号" clearable style="width: 240px" @change="handleQuery">
            <el-option
              v-for="item in accountList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-select v-model="queryParams.ruleType" placeholder="请选择规则类型" clearable style="width: 240px">
            <el-option label="关注回复" :value="1" />
            <el-option label="关键词回复" :value="2" />
            <el-option label="收到消息回复" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 表格区域 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">自动回复规则</span>
          <div class="header-btns">
            <el-button
              type="primary"
              plain
              :icon="Plus"
              @click="handleAdd"
              v-permission="['wechat:autoreply:add']"
            >新增</el-button>
            <el-button
              type="success"
              plain
              :icon="Refresh"
              @click="handleQuery"
            >刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column label="规则名称" align="center" prop="ruleName" min-width="150" show-overflow-tooltip />
        <el-table-column label="规则类型" align="center" prop="ruleType" width="120">
          <template #default="{ row }">
            <el-tag :type="row.ruleType === 1 ? 'success' : row.ruleType === 2 ? 'warning' : 'info'">
              {{ ruleTypeText(row.ruleType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关键词" align="center" prop="keywords" min-width="150" show-overflow-tooltip>
          <template #default="{ row }">
            {{ formatKeywords(row.keywords) }}
          </template>
        </el-table-column>
        <el-table-column label="回复类型" align="center" prop="replyType" width="100">
          <template #default="{ row }">
            {{ replyTypeText(row.replyType) }}
          </template>
        </el-table-column>
        <el-table-column label="优先级" align="center" prop="priority" width="80" />
        <el-table-column label="状态" align="center" prop="enabled" width="80">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              :active-value="1"
              :inactive-value="0"
              @change="handleToggle(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
          <template #default="scope">
            <el-button link type="primary" :icon="Edit" @click="handleUpdate(scope.row)" v-permission="['wechat:autoreply:edit']">编辑</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)" v-permission="['wechat:autoreply:delete']">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.current"
        v-model:limit="queryParams.size"
        @pagination="handleQuery"
      />
    </el-card>

    <!-- 添加或修改规则对话框 -->
    <el-dialog :title="title" v-model="open" width="700px" align-center append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="公众号" prop="accountId">
          <el-select v-model="form.accountId" placeholder="请选择公众号" style="width: 100%">
            <el-option
              v-for="item in accountList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="规则名称" prop="ruleName">
          <el-input v-model="form.ruleName" placeholder="请输入规则名称" />
        </el-form-item>
        <el-form-item label="规则类型" prop="ruleType">
          <el-radio-group v-model="form.ruleType">
            <el-radio :value="1">关注回复</el-radio>
            <el-radio :value="2">关键词回复</el-radio>
            <el-radio :value="3">收到消息回复</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="form.ruleType === 2" label="关键词" prop="keywords">
          <el-input v-model="form.keywords" placeholder="多个关键词用逗号分隔" />
        </el-form-item>
        <el-form-item v-if="form.ruleType === 2" label="匹配模式">
          <el-radio-group v-model="form.matchMode">
            <el-radio :value="1">全匹配</el-radio>
            <el-radio :value="2">半匹配</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="回复类型" prop="replyType">
          <el-radio-group v-model="form.replyType">
            <el-radio :value="1">文本</el-radio>
            <el-radio :value="2">图文</el-radio>
            <el-radio :value="3">图片</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="回复内容" prop="replyContent">
          <el-input
            v-model="form.replyContent"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
          />
        </el-form-item>
        <el-form-item label="优先级" prop="priority">
          <el-input-number v-model="form.priority" :min="0" :max="999" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete } from '@element-plus/icons-vue';
import {
  getAutoReplyRuleList,
  createAutoReplyRule,
  updateAutoReplyRule,
  deleteAutoReplyRule,
  toggleAutoReplyRule,
  getAccountList,
} from '@/api/wechat-oa';
import { useTable } from '@/hooks/useTable';
import { requiredRule } from '@/utils/rules';

const queryRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const open = ref(false);
const title = ref('');
const accountList = ref<any[]>([]);

// 使用通用 Table Hook
const {
  tableData,
  total,
  loading,
  queryParams,
  handleQuery,
} = useTable<any>(async (params) => {
  if (!params.accountId) return { records: [], total: 0 };
  const res = await getAutoReplyRuleList(params);
  return { records: res.records || [], total: res.total || 0 };
}, { accountId: undefined, ruleType: undefined });

const form = reactive<any>({
  id: undefined,
  accountId: undefined,
  ruleName: '',
  ruleType: 1,
  matchMode: 1,
  keywords: '',
  replyType: 1,
  replyContent: '',
  priority: 0,
  remark: ''
});

const rules = {
  accountId: requiredRule('请选择公众号'),
  ruleName: requiredRule('请输入规则名称'),
  ruleType: { required: true, message: '请选择规则类型', trigger: 'change' },
  replyType: { required: true, message: '请选择回复类型', trigger: 'change' },
  replyContent: requiredRule('请输入回复内容')
};

/** 获取公众号列表 */
function getAccounts() {
  getAccountList({ current: 1, size: 100 }).then((res: any) => {
    accountList.value = res.records || [];
    if (accountList.value.length > 0 && !queryParams.accountId) {
      queryParams.accountId = accountList.value[0].id;
      handleQuery();
    }
  });
}

/** 重置按钮操作 */
function resetQuery() {
  queryRef.value?.resetFields();
  handleQuery();
}

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = '添加自动回复规则';
}

/** 修改按钮操作 */
function handleUpdate(row: any) {
  reset();
  form.id = row.id;
  form.accountId = row.accountId;
  form.ruleName = row.ruleName;
  form.ruleType = row.ruleType;
  form.matchMode = row.matchMode;
  form.keywords = formatKeywords(row.keywords, true);
  form.replyType = row.replyType;
  form.replyContent = row.replyContent;
  form.priority = row.priority;
  form.remark = row.remark;
  open.value = true;
  title.value = '修改自动回复规则';
}

/** 提交按钮 */
function submitForm() {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      const data = {
        ...form,
        keywords: form.ruleType === 2 ? JSON.stringify(form.keywords.split(/[,，]/).filter(Boolean)) : null
      };
      if (form.id != undefined) {
        updateAutoReplyRule(form.id, data).then(() => {
          ElMessage.success('修改成功');
          open.value = false;
          handleQuery();
        });
      } else {
        createAutoReplyRule(data).then(() => {
          ElMessage.success('新增成功');
          open.value = false;
          handleQuery();
        });
      }
    }
  });
}

/** 启用/禁用 */
function handleToggle(row: any) {
  toggleAutoReplyRule(row.id, row.enabled).then(() => {
    ElMessage.success('操作成功');
  }).catch(() => {
    row.enabled = row.enabled === 1 ? 0 : 1;
  });
}

/** 删除按钮操作 */
function handleDelete(row: any) {
  ElMessageBox.confirm('是否确认删除规则编号为"' + row.id + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteAutoReplyRule([row.id]).then(() => {
      ElMessage.success('删除成功');
      handleQuery();
    });
  }).catch(() => {});
}

/** 表单重置 */
function reset() {
  form.id = undefined;
  form.accountId = queryParams.accountId;
  form.ruleName = '';
  form.ruleType = 1;
  form.matchMode = 1;
  form.keywords = '';
  form.replyType = 1;
  form.replyContent = '';
  form.priority = 0;
  form.remark = '';
  formRef.value?.resetFields();
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

function ruleTypeText(type: number) {
  const map: Record<number, string> = { 1: '关注回复', 2: '关键词回复', 3: '收到消息回复' };
  return map[type] || '未知';
}

function replyTypeText(type: number) {
  const map: Record<number, string> = { 1: '文本', 2: '图文', 3: '图片', 4: '视频', 5: '音乐' };
  return map[type] || '未知';
}

function formatKeywords(keywords: string, raw: boolean = false) {
  if (!keywords) return raw ? '' : '-';
  if (raw) return keywords;
  try {
    const arr = JSON.parse(keywords);
    return Array.isArray(arr) ? arr.join(', ') : keywords;
  } catch {
    return keywords;
  }
}

onMounted(() => {
  getAccounts();
});
</script>

<style scoped>
.app-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 84px);
}
.search-card {
  margin-bottom: 20px;
}
.table-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-btns {
  display: flex;
  gap: 10px;
}
</style>
