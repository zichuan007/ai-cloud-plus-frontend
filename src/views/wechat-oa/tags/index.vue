<template>
  <div class="wechat-oa-tags">
    <!-- 搜索栏 -->
    <el-card class="search-card">
      <el-form :model="queryParams" inline>
        <el-form-item label="公众号">
          <el-select
            v-model="queryParams.accountId"
            placeholder="请选择公众号"
            clearable
            @change="handleQuery"
          >
            <el-option
              v-for="item in accountList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="标签类型">
          <el-select
            v-model="queryParams.tagType"
            placeholder="请选择"
            clearable
            @change="handleQuery"
          >
            <el-option label="手动标签" :value="1" />
            <el-option label="规则标签" :value="2" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="handleSync">同步微信标签</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 标签列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>用户标签</span>
          <el-button type="primary" @click="handleAdd">新建标签</el-button>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="name" label="标签名称" min-width="150" />
        <el-table-column prop="tagType" label="标签类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.tagType === 1 ? 'info' : 'success'">
              {{ row.tagType === 1 ? "手动" : "规则" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="userCount" label="用户数" width="100" />
        <el-table-column prop="wechatTagId" label="微信标签ID" width="120" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)"
              >编辑</el-button
            >
            <el-button link type="danger" @click="handleDelete(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      align-center
      @close="handleDialogClose"
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="100px"
      >
        <el-form-item label="标签名称" prop="name">
          <el-input
            v-model="formData.name"
            placeholder="请输入标签名称"
            maxlength="20"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标签类型" prop="tagType">
          <el-radio-group v-model="formData.tagType">
            <el-radio :value="1">手动标签</el-radio>
            <el-radio :value="2">规则标签</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="规则表达式" v-if="formData.tagType === 2">
          <el-input
            v-model="formData.ruleExpression"
            type="textarea"
            :rows="3"
            placeholder="例如：近7天活跃用户"
          />
        </el-form-item>
        <el-form-item label="备注">
          <el-input
            v-model="formData.remark"
            type="textarea"
            :rows="2"
            placeholder="请输入备注"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            :loading="submitLoading"
            @click="handleSubmit"
          >
            确定
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage, ElMessageBox, FormInstance, FormRules } from "element-plus";
import {
  getTagList,
  createTag,
  updateTag,
  deleteTag,
  syncTags,
  getAccountList,
} from "@/api/wechat-oa";
import { useTable } from "@/hooks/useTable";
import { requiredRule } from "@/utils/rules";

// 公众号列表
const accountList = ref<any[]>([]);

// 使用通用 Table Hook (适配非分页列表)
const {
  tableData,
  loading,
  queryParams,
  handleQuery,
} = useTable<any>(async (params) => {
  if (!params.accountId) return { records: [], total: 0 };
  const res = await getTagList(params.accountId, params.tagType);
  return { records: Array.isArray(res) ? res : [], total: 0 };
}, { accountId: undefined, tagType: undefined });

// 对话框
const dialogVisible = ref(false);
const dialogTitle = ref("");
const submitLoading = ref(false);
const formRef = ref<FormInstance>();
const formData = reactive({
  id: undefined as number | undefined,
  accountId: undefined as number | undefined,
  name: "",
  tagType: 1,
  ruleExpression: "",
  remark: "",
});

const formRules: FormRules = {
  name: requiredRule("请输入标签名称"),
  tagType: { required: true, message: "请选择标签类型", trigger: "change" },
};

// 获取公众号列表
const fetchAccounts = async () => {
  try {
    const res = await getAccountList({ current: 1, size: 100 });
    accountList.value = res.records || [];
    if (accountList.value.length > 0) {
      queryParams.accountId = accountList.value[0].id;
      handleQuery();
    }
  } catch (error) {
    ElMessage.error("获取公众号列表失败");
  }
};

// 同步微信标签
const handleSync = async () => {
  if (!queryParams.accountId) {
    ElMessage.warning("请先选择公众号");
    return;
  }
  try {
    await syncTags(queryParams.accountId);
    ElMessage.success("同步成功");
    handleQuery();
  } catch (error) {
    ElMessage.error("同步失败");
  }
};

// 新增
const handleAdd = () => {
  dialogTitle.value = "新建标签";
  formData.accountId = queryParams.accountId;
  dialogVisible.value = true;
};

// 编辑
const handleEdit = (row: any) => {
  dialogTitle.value = "编辑标签";
  formData.id = row.id;
  formData.accountId = row.accountId;
  formData.name = row.name;
  formData.tagType = row.tagType;
  formData.ruleExpression = row.ruleExpression;
  formData.remark = row.remark;
  dialogVisible.value = true;
};

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm("确认删除该标签？", "提示", { type: "warning" });
    await deleteTag([row.id]);
    ElMessage.success("删除成功");
    handleQuery();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

// 提交
const handleSubmit = async () => {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitLoading.value = true;
    try {
      if (formData.id) {
        await updateTag(formData.id, formData);
        ElMessage.success("修改成功");
      } else {
        await createTag(formData);
        ElMessage.success("新增成功");
      }
      dialogVisible.value = false;
      handleQuery();
    } catch (error) {
      ElMessage.error("操作失败");
    } finally {
      submitLoading.value = false;
    }
  });
};

// 对话框关闭
const handleDialogClose = () => {
  formRef.value?.resetFields();
  formData.id = undefined;
  formData.accountId = queryParams.accountId;
  formData.name = "";
  formData.tagType = 1;
  formData.ruleExpression = "";
  formData.remark = "";
};

onMounted(() => {
  fetchAccounts();
});
</script>

<style scoped lang="scss">
.wechat-oa-tags {
  .search-card {
    margin-bottom: 16px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
