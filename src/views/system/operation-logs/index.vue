<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <el-button @click="handleQuery" :loading="loading">刷新</el-button>
        </div>
      </template>

      <el-form :inline="true" :model="queryParams" class="search-form">
        <el-form-item label="操作人">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入操作人"
            clearable
          />
        </el-form-item>
        <el-form-item label="模块">
          <el-select
            v-model="queryParams.module"
            placeholder="请选择模块"
            clearable
          >
            <el-option label="用户管理" value="用户管理" />
            <el-option label="认证管理" value="认证管理" />
            <el-option label="审批组管理" value="审批组管理" />
            <el-option label="流程管理" value="流程管理" />
            <el-option label="素材管理" value="素材管理" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作类型">
          <el-select
            v-model="queryParams.type"
            placeholder="请选择类型"
            clearable
          >
            <el-option label="查询" value="QUERY" />
            <el-option label="新增" value="CREATE" />
            <el-option label="修改" value="UPDATE" />
            <el-option label="删除" value="DELETE" />
            <el-option label="登录" value="LOGIN" />
            <el-option label="登出" value="LOGOUT" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleQuery">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="username" label="操作人" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="type" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)" size="small">{{
              row.type
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" min-width="180" />
        <el-table-column prop="ip" label="IP 地址" width="140" />
        <el-table-column prop="executeTime" label="耗时 (ms)" width="100" />
        <el-table-column prop="success" label="结果" width="80">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'" size="small">
              {{ row.success ? "成功" : "失败" }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" width="170" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button text type="primary" @click="handleDetail(row)"
              >详情</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="queryParams.current"
        v-model:page-size="queryParams.size"
        :total="total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleQuery"
        @current-change="handleQuery"
        class="pagination"
      />
    </el-card>

    <!-- 详情对话框 -->
    <el-dialog v-model="detailVisible" title="操作日志详情" width="600px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="Trace ID">{{
          detailData.traceId
        }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{
          detailData.username
        }}</el-descriptions-item>
        <el-descriptions-item label="模块">{{
          detailData.module
        }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{
          detailData.type
        }}</el-descriptions-item>
        <el-descriptions-item label="操作描述">{{
          detailData.description
        }}</el-descriptions-item>
        <el-descriptions-item label="请求方法">{{
          detailData.method
        }}</el-descriptions-item>
        <el-descriptions-item label="请求 URL">{{
          detailData.requestUrl
        }}</el-descriptions-item>
        <el-descriptions-item label="请求参数">
          <pre>{{ detailData.requestParams }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果">
          <pre>{{ detailData.responseResult }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="IP 地址">{{
          detailData.ip
        }}</el-descriptions-item>
        <el-descriptions-item label="耗时"
          >{{ detailData.executeTime }} ms</el-descriptions-item
        >
        <el-descriptions-item label="结果">
          <el-tag :type="detailData.success ? 'success' : 'danger'">
            {{ detailData.success ? "成功" : "失败" }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="异常信息" v-if="detailData.exception">
          <pre>{{ detailData.exception }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">{{
          detailData.createTime
        }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { getOperationLogs } from "@/api/system";
import { useTable } from "@/hooks/useTable";

const detailVisible = ref(false);
const detailData = ref<any>({});

// 使用通用 Table Hook
const { tableData, loading, total, queryParams, handleQuery, handleReset } =
  useTable<any>(
    async (params) => {
      const res = await getOperationLogs(params);
      return { records: res.data?.records || [], total: res.data?.total || 0 };
    },
    { current: 1, size: 10, username: "", module: "", type: "" },
  );

function handleDetail(row: any) {
  detailData.value = row;
  detailVisible.value = true;
}

function getTypeTag(
  type: string,
): "primary" | "success" | "warning" | "info" | "danger" {
  const map: Record<
    string,
    "primary" | "success" | "warning" | "info" | "danger"
  > = {
    QUERY: "info",
    CREATE: "success",
    UPDATE: "warning",
    DELETE: "danger",
    LOGIN: "primary",
    LOGOUT: "info",
  };
  return map[type] || "info";
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-form {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

pre {
  max-height: 200px;
  overflow-y: auto;
  margin: 0;
  font-size: 12px;
}
</style>
