<template>
  <div class="app-container">
    <!-- 搜索区域 -->
    <el-card shadow="hover" class="search-card">
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="90px">
        <el-form-item label="公众号名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入公众号名称"
            clearable
            style="width: 160px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select
            v-model="queryParams.status"
            placeholder="公众号状态"
            clearable
            style="width: 160px"
          >
            <el-option label="正常" :value="UserStatus.ENABLED" />
            <el-option label="禁用" :value="UserStatus.DISABLED" />
            <el-option label="授权过期" :value="2" />
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
          <span class="header-title">公众号列表</span>
          <div class="header-btns">
            <el-button
              type="primary"
              plain
              :icon="Plus"
              @click="handleAdd"
              v-permission="['wechat:account:add']"
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

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="AppID" align="center" prop="appId" min-width="150" show-overflow-tooltip />
        <el-table-column label="公众号名称" align="center" prop="name" min-width="150" show-overflow-tooltip />
        <el-table-column label="类型" align="center" prop="accountType" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.accountType === 1 ? 'success' : 'warning'">
              {{ scope.row.accountType === 1 ? '订阅号' : '服务号' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="scope">
            <el-tag :type="UserStatusMap[scope.row.status]?.type || 'info'">
              {{ UserStatusMap[scope.row.status]?.label || '未知' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="剩余群发" align="center" prop="remainingQuota" width="100" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="160" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220">
          <template #default="scope">
            <el-button link type="primary" :icon="Edit" @click="handleUpdate(scope.row)" v-permission="['wechat:account:edit']">编辑</el-button>
            <el-button link type="primary" :icon="RefreshRight" @click="handleRefreshToken(scope.row)" v-permission="['wechat:account:token']">刷新 Token</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)" v-permission="['wechat:account:delete']">删除</el-button>
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

    <!-- 添加或修改公众号对话框 -->
    <el-dialog :title="title" v-model="open" width="600px" align-center append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="AppID" prop="appId">
          <el-input v-model="form.appId" placeholder="请输入 AppID" />
        </el-form-item>
        <el-form-item label="AppSecret" prop="appSecret" v-if="!form.id">
          <el-input v-model="form.appSecret" placeholder="请输入 AppSecret" show-password />
        </el-form-item>
        <el-form-item label="公众号名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入公众号名称" />
        </el-form-item>
        <el-form-item label="账号类型" prop="accountType">
          <el-radio-group v-model="form.accountType">
            <el-radio :value="1">订阅号</el-radio>
            <el-radio :value="2">服务号</el-radio>
          </el-radio-group>
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
import { Search, Refresh, Plus, Edit, Delete, RefreshRight } from '@element-plus/icons-vue';
import { getAccountList, getAccountDetail, createAccount, updateAccount, deleteAccount, refreshToken } from '@/api/wechat-oa';
import { useTable } from '@/hooks/useTable';
import { UserStatus, UserStatusMap } from '@/enums';
import { requiredRule } from '@/utils/rules';

const queryRef = ref<FormInstance>();
const formRef = ref<FormInstance>();
const open = ref(false);
const title = ref('');

// 使用通用 Table Hook
const {
  tableData,
  total,
  loading,
  queryParams,
  handleQuery,
} = useTable<any>(async (params) => {
  const res = await getAccountList(params);
  return { records: res.records || [], total: res.total || 0 };
}, { name: '', status: undefined });

const form = reactive<any>({
  id: undefined,
  appId: '',
  appSecret: '',
  name: '',
  accountType: 1,
  remark: ''
});

const rules = {
  appId: requiredRule('AppID 不能为空'),
  name: requiredRule('公众号名称不能为空'),
  accountType: { required: true, message: '账号类型不能为空', trigger: 'change' }
};

/** 新增按钮操作 */
function handleAdd() {
  reset();
  open.value = true;
  title.value = '添加公众号';
}

/** 修改按钮操作 */
async function handleUpdate(row: any) {
  reset();
  try {
    const detail = await getAccountDetail(row.id);
    form.id = detail.id;
    form.appId = detail.appId;
    form.name = detail.name;
    form.accountType = detail.accountType;
    form.remark = detail.remark;
    open.value = true;
    title.value = '修改公众号';
  } catch (error) {
    form.id = row.id;
    form.appId = row.appId;
    form.name = row.name;
    form.accountType = row.accountType;
    form.remark = row.remark;
    open.value = true;
    title.value = '修改公众号';
  }
}

/** 提交按钮 */
function submitForm() {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (form.id != undefined) {
        updateAccount(form.id, form).then(() => {
          ElMessage.success('修改成功');
          open.value = false;
          handleQuery();
        });
      } else {
        createAccount(form).then(() => {
          ElMessage.success('新增成功');
          open.value = false;
          handleQuery();
        });
      }
    }
  });
}

/** 刷新 Token */
function handleRefreshToken(row: any) {
  ElMessageBox.confirm('确认要刷新该公众号的 Token 吗？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    refreshToken(row.id).then(() => {
      ElMessage.success('刷新成功');
      handleQuery();
    });
  }).catch(() => {});
}

/** 删除按钮操作 */
function handleDelete(row: any) {
  ElMessageBox.confirm('是否确认删除公众号编号为"' + row.id + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteAccount([row.id]).then(() => {
      ElMessage.success('删除成功');
      handleQuery();
    });
  }).catch(() => {});
}

/** 表单重置 */
function reset() {
  form.id = undefined;
  form.appId = '';
  form.appSecret = '';
  form.name = '';
  form.accountType = 1;
  form.remark = '';
  formRef.value?.resetFields();
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
}

/** 重置按钮操作 */
function resetQuery() {
  queryRef.value?.resetFields();
  handleQuery();
}

onMounted(() => {
  handleQuery();
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
