<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>菜单管理</span>
          <el-button type="primary" @click="handleAdd(null)">
            <el-icon><Plus /></el-icon>
            新增菜单
          </el-button>
        </div>
      </template>

      <!-- 树形表格展示 -->
      <el-table
        v-loading="loading"
        :data="tableData"
        row-key="id"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
        stripe
      >
        <el-table-column prop="name" label="菜单名称" min-width="200">
          <template #default="{ row }">
            <div class="menu-name-cell">
              <el-icon v-if="row.icon" class="menu-icon"
                ><component :is="row.icon"
              /></el-icon>
              <span :class="{ 'is-bold': row.type === MenuType.MENU }">{{
                row.name
              }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="
                row.type === MenuType.DIRECTORY
                  ? 'primary'
                  : row.type === MenuType.MENU
                    ? 'success'
                    : 'warning'
              "
              size="small"
            >
              {{ MenuTypeMap[row.type] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="permission"
          label="权限标识"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column
          prop="path"
          label="路由路径"
          min-width="150"
          show-overflow-tooltip
        />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag
              :type="row.status === UserStatus.ENABLED ? 'success' : 'danger'"
              size="small"
            >
              {{ UserStatusMap[row.status]?.label || "未知" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="70" align="center" />
        <el-table-column label="操作" width="160" align="center">
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

    <!-- 菜单表单对话框 -->
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
        label-width="100px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="上级菜单" prop="parentId">
              <el-tree-select
                v-model="formData.parentId"
                :data="menuOptions"
                :props="({ label: 'name', value: 'id', children: 'children' } as any)"
                placeholder="请选择上级菜单"
                check-strictly
                default-expand-all
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单类型" prop="type">
              <el-radio-group v-model="formData.type">
                <el-radio :value="MenuType.DIRECTORY">目录</el-radio>
                <el-radio :value="MenuType.MENU">菜单</el-radio>
                <el-radio :value="MenuType.BUTTON">按钮</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="菜单名称" prop="name">
              <el-input v-model="formData.name" placeholder="请输入菜单名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.type !== MenuType.BUTTON">
            <el-form-item label="菜单图标" prop="icon">
              <el-input
                v-model="formData.icon"
                placeholder="请输入图标名称 (如 User)"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.type !== MenuType.BUTTON">
            <el-form-item label="路由路径" prop="path">
              <el-input v-model="formData.path" placeholder="请输入路由路径" />
            </el-form-item>
          </el-col>
          <el-col :span="12" v-if="formData.type === MenuType.MENU">
            <el-form-item label="组件路径" prop="component">
              <el-input
                v-model="formData.component"
                placeholder="如 rbac/users/index"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="权限标识" prop="permission">
              <el-input
                v-model="formData.permission"
                placeholder="如 user:list"
              />
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
  getMenuTree,
  createMenu,
  updateMenu,
  deleteMenu,
} from "@/api/rbac/menu";
import { useTable } from "@/hooks/useTable";
import { MenuType, MenuTypeMap, UserStatus, UserStatusMap } from "@/enums";
import { requiredRule } from "@/utils/rules";
import type { MenuTree } from "@/types";

// 定义组件名称，用于 Keep-Alive 缓存
defineOptions({ name: "RbacMenus" });

// 使用通用 Table Hook (适配树形表格)
const { tableData, loading, handleQuery } = useTable<MenuTree>(async () => {
  const res = await getMenuTree();
  return { records: Array.isArray(res) ? res : [], total: 0 };
});

const dialogVisible = ref(false);
const isEdit = ref(false);

const formData = reactive({
  id: undefined as number | undefined,
  parentId: 0,
  name: "",
  type: MenuType.MENU,
  icon: "",
  path: "",
  component: "",
  permission: "",
  sort: 0,
  status: UserStatus.ENABLED,
});

const formRef = ref<FormInstance>();

// 使用共享校验规则
const formRules: FormRules = {
  name: requiredRule("请输入菜单名称"),
  type: { required: true, message: "请选择菜单类型", trigger: "change" },
};

const dialogTitle = computed(() => (isEdit.value ? "编辑菜单" : "新增菜单"));

// 构建树形选择器的数据（包含“顶级菜单”选项）
const menuOptions = computed(() => [
  { id: 0, name: "顶级菜单", children: tableData.value },
]);

onMounted(() => handleQuery());

function handleAdd(row: MenuTree | null) {
  isEdit.value = false;
  // 🔴 核心修复：使用 Object.assign 一次性重置，与 departments/users 保持一致
  Object.assign(formData, {
    id: undefined,
    parentId: row?.id || 0,
    name: "",
    type: row ? MenuType.MENU : MenuType.DIRECTORY,
    icon: "",
    path: "",
    component: "",
    permission: "",
    sort: 0,
    status: UserStatus.ENABLED,
  });
  dialogVisible.value = true;
}

function handleEdit(row: MenuTree) {
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
        await updateMenu(formData.id, formData as any);
        ElMessage.success("更新成功");
      } else {
        await createMenu(formData as any);
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
      handleQuery();
    } catch (error) {
      ElMessage.error("操作失败");
    }
  });
}

async function handleDelete(row: MenuTree) {
  await ElMessageBox.confirm(`确定删除菜单 "${row.name}" 吗?`, "提示", {
    type: "warning",
  });
  try {
    await deleteMenu([row.id]);
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
.table-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}
</style>
