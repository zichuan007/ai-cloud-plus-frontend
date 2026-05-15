<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>部门管理</span>
          <el-button type="primary" @click="handleAdd(null)">
            <el-icon><Plus /></el-icon>
            新增部门
          </el-button>
        </div>
      </template>

      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        default-expand-all
        stripe
      >
        <el-table-column prop="name" label="部门名称" min-width="200" />
        <el-table-column prop="leader" label="负责人" width="120" />
        <el-table-column prop="phone" label="联系电话" width="140" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag
              :type="row.status === UserStatus.ENABLED ? 'success' : 'danger'"
              size="small"
            >
              {{ UserStatusMap[row.status]?.label || "未知" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" />
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button text type="primary" @click="handleAdd(row)"
                >新增</el-button
              >
              <el-button text type="primary" @click="handleEdit(row)"
                >编辑</el-button
              >
              <el-button text type="danger" @click="handleDelete(row)"
                >删除</el-button
              >
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      align-center
      append-to-body
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="80px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上级部门" prop="parentId">
              <el-tree-select
                v-model="formData.parentId"
                :data="deptOptions"
                :props="({ label: 'name', value: 'id', children: 'children' } as any)"
                placeholder="请选择上级部门"
                check-strictly
                default-expand-all
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="部门名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入部门名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="负责人" prop="leader">
              <el-input v-model="formData.leader" placeholder="请输入负责人" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="排序" prop="sort">
              <el-input-number v-model="formData.sort" :min="0" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="状态" prop="status">
              <el-radio-group v-model="formData.status">
                <el-radio :value="UserStatus.ENABLED">正常</el-radio>
                <el-radio :value="UserStatus.DISABLED">停用</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, defineOptions } from "vue";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import {
  getDepartmentTree,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/api/rbac/department";
import { useTable } from "@/hooks/useTable";
import { UserStatus, UserStatusMap } from "@/enums";
import { requiredRule, phoneRule, emailRule } from "@/utils/rules";
import type { DepartmentTree } from "@/types";

// 定义组件名称，用于 Keep-Alive 缓存
defineOptions({ name: "RbacDepartments" });

// 使用通用 Table Hook (适配树形表格)
const { tableData, loading, handleQuery } = useTable<DepartmentTree>(
  async () => {
    const res = await getDepartmentTree();
    return { records: Array.isArray(res) ? res : [], total: 0 };
  },
);

const dialogVisible = ref(false);
const isEdit = ref(false);

const formData = reactive({
  id: undefined as number | undefined,
  parentId: 0,
  name: "",
  leader: "",
  phone: "",
  email: "",
  sort: 0,
  status: UserStatus.ENABLED,
});

const formRef = ref<FormInstance>();

// 使用共享校验规则
const formRules: FormRules = {
  name: requiredRule("请输入部门名称"),
  phone: phoneRule,
  email: emailRule,
};

const dialogTitle = computed(() => (isEdit.value ? "编辑部门" : "新增部门"));
const deptOptions = computed(() => [
  { id: 0, name: "顶级部门", children: tableData.value },
]);

onMounted(() => handleQuery());

function handleAdd(row: DepartmentTree | null) {
  isEdit.value = false;
  // 🔴 核心修复：使用 Object.assign 一次性重置，与 menus/users 保持一致
  Object.assign(formData, {
    id: undefined,
    parentId: row?.id || 0,
    name: "",
    leader: "",
    phone: "",
    email: "",
    sort: 0,
    status: UserStatus.ENABLED,
  });
  dialogVisible.value = true;
}

function handleEdit(row: DepartmentTree) {
  isEdit.value = true;
  Object.assign(formData, row);
  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      if (isEdit.value && formData.id) {
        await updateDepartment(formData.id, formData as any);
        ElMessage.success("更新成功");
      } else {
        await createDepartment(formData as any);
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
      handleQuery();
    } catch (error) {
      ElMessage.error("操作失败");
    }
  });
}

async function handleDelete(row: DepartmentTree) {
  await ElMessageBox.confirm(`确定删除部门 "${row.name}" 吗?`, "提示", {
    type: "warning",
  });
  try {
    await deleteDepartment([row.id]);
    ElMessage.success("删除成功");
    handleQuery();
  } catch (error) {
    ElMessage.error("删除失败");
  }
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}
</style>
