<template>
  <div class="page-container">
    <div class="search-bar">
      <el-form :model="queryParams" inline>
        <el-form-item label="流程名称">
          <el-input
            v-model="queryParams.processName"
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
            <el-option label="运行中" :value="1" />
            <el-option label="已结束" :value="2" />
            <el-option label="已终止" :value="3" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-card>
      <template #header><span>流程实例</span></template>
      <el-table v-loading="loading" :data="tableData" stripe border>
        <el-table-column
          prop="instanceId"
          label="实例 ID"
          min-width="180"
          align="center"
        />
        <el-table-column
          prop="processName"
          label="流程名称"
          min-width="150"
          align="center"
        />
        <el-table-column
          prop="startUserName"
          label="发起人"
          width="120"
          align="center"
        />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]">
              {{ statusMap[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          prop="startTime"
          label="开始时间"
          width="170"
          align="center"
        />
        <el-table-column
          prop="endTime"
          label="结束时间"
          width="170"
          align="center"
        />
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <div class="table-actions">
              <el-button text type="primary" @click="handleDetail(row)"
                >详情</el-button
              >
              <el-button
                v-if="row.status === 1"
                text
                type="danger"
                @click="handleTerminate(row)"
                >终止</el-button
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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { getInstanceList, terminateInstance } from "@/api/workflow";
import type { InstanceVO } from "@/types";
import { useTable } from "@/hooks/useTable";

const router = useRouter();

const statusMap: Record<number, string> = {
  1: "运行中",
  2: "已结束",
  3: "已终止",
};
const statusTypeMap: Record<number, any> = {
  1: "primary",
  2: "success",
  3: "danger",
};

// 使用通用 Table Hook
const initialParams = { current: 1, size: 10, processName: "", status: undefined as number | undefined };
const {
  tableData,
  loading,
  total,
  queryParams,
  handleQuery,
  handleReset: resetHook,
} = useTable<InstanceVO>(async (params) => {
  const res = await getInstanceList(params);
  const rawData = Array.isArray(res) ? res : (res as any).records || [];

  // 映射后端字段到前端
  const mappedData = rawData.map((item: any) => ({
    instanceId: item.processInstanceId,
    processName: item.processDefinitionName,
    startUserName: item.initiatorName,
    status: item.status === "RUNNING" ? 1 : item.status === "COMPLETED" ? 2 : 3,
    startTime: item.startTime,
    endTime: item.endTime,
  }));

  return { records: mappedData, total: (res as any).total || rawData.length };
}, initialParams);

function handleReset() {
  queryParams.processName = "";
  queryParams.status = undefined;
  resetHook();
}

function handleDetail(row: InstanceVO) {
  router.push(`/workflow/instance-detail/${row.instanceId}`);
}

async function handleTerminate(row: InstanceVO) {
  const { value } = await ElMessageBox.prompt("请输入终止原因", "终止实例", {
    inputValidator: (v) => (v ? true : "请输入终止原因"),
  });
  try {
    await terminateInstance(row.instanceId, value);
    ElMessage.success("实例已终止");
    handleQuery();
  } catch {
    /* ignore */
  }
}

onMounted(() => handleQuery());
</script>

<style scoped lang="scss">
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
