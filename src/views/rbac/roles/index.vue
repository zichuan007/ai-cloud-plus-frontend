<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="角色名称">
          <el-input
            v-model="queryParams.roleName"
            placeholder="请输入角色名称"
            clearable
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="状态">
          <el-select
            v-model="queryParams.status"
            placeholder="请选择"
            clearable
          >
            <el-option
              v-for="(item, key) in UserStatusMap"
              :key="key"
              :label="item.label"
              :value="Number(key)"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 列表 -->
    <el-card>
      <template #header>
        <div class="card-header">
          <span>角色列表</span>
          <el-button type="primary" @click="handleAdd">
            <el-icon><Plus /></el-icon>
            新增角色
          </el-button>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" stripe>
        <el-table-column prop="roleName" label="角色名称" min-width="120" />
        <el-table-column prop="roleCode" label="角色编码" min-width="120" />
        <el-table-column label="数据权限" min-width="120">
          <template #default="{ row }">
            {{ DataScopeMap[row.dataScope] || "未知" }}
          </template>
        </el-table-column>
        <el-table-column prop="userCount" label="用户数" width="80" />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="UserStatusMap[row.status]?.type || 'info'">
              {{ UserStatusMap[row.status]?.label || "未知" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="170" />
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button text type="primary" @click="handleEdit(row)"
                >编辑</el-button
              >
              <el-button text type="warning" @click="handleAssignPerm(row)"
                >分配权限</el-button
              >
              <el-button text type="danger" @click="handleDelete(row)"
                >删除</el-button
              >
            </div>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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

    <!-- 角色表单对话框 -->
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
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="formData.roleName" placeholder="请输入角色名称" />
        </el-form-item>
        <el-form-item label="角色编码" prop="roleCode">
          <el-input
            v-model="formData.roleCode"
            placeholder="请输入角色编码"
            :disabled="isEdit"
          />
        </el-form-item>
        <el-form-item label="数据权限" prop="dataScope">
          <el-select
            v-model="formData.dataScope"
            placeholder="请选择"
            style="width: 100%"
          >
            <el-option
              v-for="(label, value) in DataScopeMap"
              :key="value"
              :label="label"
              :value="Number(value)"
            />
          </el-select>
        </el-form-item>

        <!-- 自定义部门选择 -->
        <el-form-item
          label="自定义部门"
          prop="deptIds"
          v-if="formData.dataScope === DataScope.CUSTOM"
        >
          <el-tree
            ref="deptTreeRef"
            :data="deptOptions"
            :props="{ label: 'name', children: 'children' }"
            show-checkbox
            node-key="id"
            v-model="formData.deptIds"
            :default-checked-keys="formData.deptIds"
            empty-text="加载中，请稍候"
            style="width: 100%; max-height: 200px; overflow-y: auto"
          />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="formData.status">
            <el-radio :value="UserStatus.ENABLED">正常</el-radio>
            <el-radio :value="UserStatus.DISABLED">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="formData.remark" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 分配权限对话框 -->
    <el-dialog
      v-model="permDialogVisible"
      :title="`分配权限 - ${currentRole?.roleName || ''}`"
      width="600px"
      align-center
      append-to-body
      destroy-on-close
    >
      <el-tree
        ref="menuTreeRef"
        :data="menuOptions"
        :props="{ label: 'name', children: 'children' }"
        show-checkbox
        node-key="id"
        :default-checked-keys="checkedMenuIds"
        :default-expanded-keys="checkedMenuIds"
        empty-text="加载中，请稍候"
        style="width: 100%; max-height: 400px; overflow-y: auto"
      />
      <template #footer>
        <div style="display: flex; justify-content: flex-end; gap: 12px">
          <el-button @click="permDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleSavePermissions"
            :loading="savingPerms"
            >确定</el-button
          >
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
  getRoleList,
  getRoleDetail,
  createRole,
  updateRole,
  deleteRole,
  updateRoleDataScope,
  assignRolePermissions,
} from "@/api/rbac/role";
import { getDepartmentTree } from "@/api/rbac/department";
import { getMenuTree } from "@/api/rbac/menu";
import { useTable } from "@/hooks/useTable";
import { UserStatus, UserStatusMap, DataScope, DataScopeMap } from "@/enums";
import { requiredRule } from "@/utils/rules";
import type { RoleVO, RoleCreateDTO, DepartmentTree, MenuTree } from "@/types";

// 定义组件名称，用于 Keep-Alive 缓存
defineOptions({ name: "RbacRoles" });

// 使用通用 Table Hook
const { tableData, loading, total, queryParams, handleQuery, handleReset } =
  useTable<RoleVO>(getRoleList, { roleName: "", status: undefined });

const dialogVisible = ref(false);
const isEdit = ref(false);

const formData = reactive<RoleCreateDTO & { id?: number; deptIds?: number[] }>({
  roleName: "",
  roleCode: "",
  dataScope: DataScope.DEPT,
  status: UserStatus.ENABLED,
  remark: "",
  deptIds: [],
});

const formRef = ref<FormInstance>();
const deptTreeRef = ref();
const deptOptions = ref<DepartmentTree[]>([]);

// 使用共享校验规则
const formRules: FormRules = {
  roleName: requiredRule("请输入角色名称"),
  roleCode: requiredRule("请输入角色编码"),
};

// 分配权限相关
const permDialogVisible = ref(false);
const currentRole = ref<RoleVO | null>(null);
const menuOptions = ref<MenuTree[]>([]);
const checkedMenuIds = ref<number[]>([]);
const savingPerms = ref(false);
const menuTreeRef = ref();

const dialogTitle = computed(() => (isEdit.value ? "编辑角色" : "新增角色"));

// 🔴 核心修复：部门树在 onMounted 时加载一次并缓存，避免每次编辑都重新请求
onMounted(async () => {
  handleQuery();
  try {
    const res = await getDepartmentTree();
    deptOptions.value = res || [];
  } catch (error) {
    console.error("[角色] 获取部门树失败:", error);
  }
});

function handleAdd() {
  isEdit.value = false;
  formData.deptIds = [];
  dialogVisible.value = true;
}

async function handleEdit(row: RoleVO) {
  isEdit.value = true;
  Object.assign(formData, row);
  formData.deptIds = []; // 重置

  // 如果是自定义数据权限，加载已选部门
  if (row.dataScope === DataScope.CUSTOM) {
    try {
      const detailRes = await getRoleDetail(row.id);
      formData.deptIds = (detailRes as any).deptIds || detailRes.deptIds || [];
    } catch (error) {
      console.error("[角色编辑] 获取角色详情失败:", error);
    }
  }

  dialogVisible.value = true;
}

async function handleSubmit() {
  if (!formRef.value) return;
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    try {
      if (isEdit.value && formData.id) {
        // 1. 更新角色基本信息
        await updateRole(formData.id, formData);

        // 2. 如果数据权限有变化或为自定义，单独提交数据权限
        if (formData.dataScope !== undefined) {
          await updateRoleDataScope({
            roleId: formData.id,
            dataScope: formData.dataScope,
            deptIds:
              formData.dataScope === DataScope.CUSTOM
                ? formData.deptIds
                : undefined,
          });
        }
        ElMessage.success("更新成功");
      } else {
        await createRole(formData);
        ElMessage.success("创建成功");
      }
      dialogVisible.value = false;
      handleQuery();
    } catch (error) {
      ElMessage.error("操作失败");
    }
  });
}

async function handleDelete(row: RoleVO) {
  await ElMessageBox.confirm(`确定删除角色 "${row.roleName}" 吗?`, "提示", {
    type: "warning",
  });
  try {
    await deleteRole(row.id);
    ElMessage.success("删除成功");
    handleQuery();
  } catch (error) {
    ElMessage.error("删除失败");
  }
}

async function handleAssignPerm(row: RoleVO) {
  currentRole.value = row;
  permDialogVisible.value = true;
  checkedMenuIds.value = [];

  // 加载菜单树
  try {
    const res = await getMenuTree();
    menuOptions.value = res || [];

    // TODO: 获取该角色已分配的菜单 ID
  } catch (error) {
    console.error("[分配权限] 获取菜单树失败:", error);
  }
}

async function handleSavePermissions() {
  if (!currentRole.value) return;

  // 获取选中的节点（包含半选中的父节点）
  const checkedKeys = menuTreeRef.value?.getCheckedKeys() || [];
  const halfCheckedKeys = menuTreeRef.value?.getHalfCheckedKeys() || [];
  const allMenuIds = [...checkedKeys, ...halfCheckedKeys];

  savingPerms.value = true;
  try {
    await assignRolePermissions(currentRole.value.id, allMenuIds);
    ElMessage.success("权限分配成功");
    permDialogVisible.value = false;
  } catch (error) {
    console.error("[分配权限] 保存失败:", error);
  } finally {
    savingPerms.value = false;
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
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
