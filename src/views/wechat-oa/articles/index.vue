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
        <el-form-item label="标题" prop="title">
          <el-input
            v-model="queryParams.title"
            placeholder="请输入标题"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="queryParams.status" placeholder="请选择" clearable style="width: 240px">
            <el-option label="草稿" :value="0" />
            <el-option label="已发布" :value="1" />
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
          <span class="header-title">图文列表</span>
          <div class="header-btns">
            <el-button
              type="primary"
              plain
              :icon="Plus"
              @click="handleAdd"
              v-permission="['wechat:article:add']"
            >新建图文</el-button>
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
        <el-table-column label="封面" align="center" width="100">
          <template #default="{ row }">
            <el-image
              v-if="row.coverImage"
              :src="row.coverImage"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px"
            />
            <span v-else class="no-cover">无封面</span>
          </template>
        </el-table-column>
        <el-table-column label="标题" align="center" prop="title" min-width="200" show-overflow-tooltip />
        <el-table-column label="作者" align="center" prop="author" width="100" />
        <el-table-column label="状态" align="center" prop="status" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'">
              {{ row.status === 1 ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="阅读量" align="center" prop="readCount" width="100" />
        <el-table-column label="分享量" align="center" prop="shareCount" width="100" />
        <el-table-column label="发布时间" align="center" prop="publishTime" width="160" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220">
          <template #default="scope">
            <el-button link type="primary" :icon="Edit" @click="handleUpdate(scope.row)" v-permission="['wechat:article:edit']">编辑</el-button>
            <el-button
              v-if="scope.row.status === 0"
              link
              type="success"
              :icon="Upload"
              @click="handlePublish(scope.row)"
              v-permission="['wechat:article:publish']"
            >发布</el-button>
            <el-button link type="danger" :icon="Delete" @click="handleDelete(scope.row)" v-permission="['wechat:article:delete']">删除</el-button>
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

    <!-- 添加或修改图文对话框 -->
    <el-dialog :title="title" v-model="open" width="800px" align-center append-to-body>
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入标题（最多64字符）" maxlength="64" show-word-limit />
        </el-form-item>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="作者" prop="author">
              <el-input v-model="form.author" placeholder="请输入作者" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="评论" prop="commentFlag">
              <el-switch v-model="form.commentFlag" :active-value="1" :inactive-value="0" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="封面图 URL" prop="coverImage">
          <el-input v-model="form.coverImage" placeholder="请输入封面图 URL" />
        </el-form-item>
        <el-form-item label="摘要" prop="summary">
          <el-input
            v-model="form.summary"
            type="textarea"
            :rows="2"
            placeholder="选填，不填则自动截取正文前54字"
          />
        </el-form-item>
        <el-form-item label="正文内容" prop="content">
          <el-input
            v-model="form.content"
            type="textarea"
            :rows="10"
            placeholder="支持 HTML 格式"
          />
        </el-form-item>
        <el-form-item label="阅读原文" prop="readMoreUrl">
          <el-input v-model="form.readMoreUrl" placeholder="请输入阅读原文链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer" style="display: flex; justify-content: flex-end; gap: 12px;">
          <el-button @click="handleSaveDraft">保存草稿</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { ElMessage, ElMessageBox, FormInstance } from 'element-plus';
import { Search, Refresh, Plus, Edit, Delete, Upload } from '@element-plus/icons-vue';
import {
  getArticleList,
  getArticleDetail,
  createArticle,
  updateArticle,
  deleteArticle,
  publishArticle,
  saveDraft,
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
  const res = await getArticleList(params);
  return { records: res.records || [], total: res.total || 0 };
}, { accountId: undefined, title: '', status: undefined });

const form = reactive<any>({
  id: undefined,
  accountId: undefined,
  title: '',
  author: '',
  coverImage: '',
  summary: '',
  content: '',
  readMoreUrl: '',
  commentFlag: 0
});

const rules = {
  title: requiredRule('请输入标题'),
  content: requiredRule('请输入正文内容')
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
  title.value = '新建图文';
}

/** 修改按钮操作 */
async function handleUpdate(row: any) {
  reset();
  try {
    const detail = await getArticleDetail(row.id);
    form.id = detail.id;
    form.accountId = detail.accountId;
    form.title = detail.title;
    form.author = detail.author;
    form.coverImage = detail.coverImage;
    form.summary = detail.summary;
    form.content = detail.content;
    form.readMoreUrl = detail.readMoreUrl;
    form.commentFlag = detail.commentFlag;
    open.value = true;
    title.value = '修改图文';
  } catch (error) {
    form.id = row.id;
    form.accountId = row.accountId;
    form.title = row.title;
    form.author = row.author;
    form.coverImage = row.coverImage;
    form.summary = row.summary;
    form.content = row.content;
    form.readMoreUrl = row.readMoreUrl;
    form.commentFlag = row.commentFlag;
    open.value = true;
    title.value = '修改图文';
  }
}

/** 提交按钮 */
function submitForm() {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      if (form.id != undefined) {
        updateArticle(form.id, form).then(() => {
          ElMessage.success('修改成功');
          open.value = false;
          handleQuery();
        });
      } else {
        createArticle(form).then(() => {
          ElMessage.success('新增成功');
          open.value = false;
          handleQuery();
        });
      }
    }
  });
}

/** 保存草稿 */
function handleSaveDraft() {
  if (!form.title) {
    ElMessage.warning('请输入标题');
    return;
  }
  saveDraft(form).then(() => {
    ElMessage.success('保存草稿成功');
    open.value = false;
    handleQuery();
  });
}

/** 发布图文 */
function handlePublish(row: any) {
  ElMessageBox.confirm('确认发布该图文？发布后无法修改', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    publishArticle(row.id).then(() => {
      ElMessage.success('发布成功');
      handleQuery();
    });
  }).catch(() => {});
}

/** 删除按钮操作 */
function handleDelete(row: any) {
  ElMessageBox.confirm('是否确认删除图文编号为"' + row.id + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteArticle([row.id]).then(() => {
      ElMessage.success('删除成功');
      handleQuery();
    });
  }).catch(() => {});
}

/** 表单重置 */
function reset() {
  form.id = undefined;
  form.accountId = queryParams.accountId;
  form.title = '';
  form.author = '';
  form.coverImage = '';
  form.summary = '';
  form.content = '';
  form.readMoreUrl = '';
  form.commentFlag = 0;
  formRef.value?.resetFields();
}

/** 取消按钮 */
function cancel() {
  open.value = false;
  reset();
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
.no-cover {
  color: #909399;
  font-size: 12px;
}
</style>
