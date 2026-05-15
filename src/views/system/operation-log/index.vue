<template>
  <div class="page-container">
    <!-- 搜索栏 -->
    <el-card shadow="hover" class="search-card">
      <el-form :model="queryParams" ref="queryRef" :inline="true" label-width="80px">
        <el-form-item label="操作账号" prop="username">
          <el-input
            v-model="queryParams.username"
            placeholder="请输入操作账号"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="操作模块" prop="module">
          <el-input
            v-model="queryParams.module"
            placeholder="请输入操作模块"
            clearable
            style="width: 200px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="操作类型" prop="type">
          <el-select v-model="queryParams.type" placeholder="请选择" clearable style="width: 150px">
            <el-option label="查询" value="查询" />
            <el-option label="新增" value="新增" />
            <el-option label="修改" value="修改" />
            <el-option label="删除" value="删除" />
            <el-option label="导入" value="导入" />
            <el-option label="导出" value="导出" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 日志列表 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">操作日志列表</span>
        </div>
      </template>

      <el-table v-loading="loading" :data="tableData" border stripe>
        <el-table-column label="操作账号" align="center" prop="username" min-width="100" show-overflow-tooltip />
        <el-table-column label="操作模块" align="center" prop="module" min-width="120" show-overflow-tooltip />
        <el-table-column label="操作类型" align="center" prop="type" width="100">
          <template #default="{ row }">
            <el-tag :type="getTypeTag(row.type)">{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作描述" align="center" prop="description" min-width="150" show-overflow-tooltip />
        <el-table-column label="请求方式" align="center" prop="requestMethod" width="100">
          <template #default="{ row }">
            <el-tag :type="getMethodTag(row.requestMethod)" size="small">{{ row.requestMethod }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="请求 URL" align="center" prop="requestUrl" min-width="150" show-overflow-tooltip />
        <el-table-column label="操作 IP" align="center" prop="ip" width="130" />
        <el-table-column label="状态" align="center" prop="success" width="80">
          <template #default="{ row }">
            <el-tag :type="row.success ? 'success' : 'danger'">
              {{ row.success ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="耗时 (ms)" align="center" prop="executeTime" width="100" />
        <el-table-column label="操作时间" align="center" prop="createTime" width="170" />
        <el-table-column label="操作" align="center" width="100">
          <template #default="{ row }">
            <el-button link type="primary" :icon="View" @click="handleDetail(row)">详情</el-button>
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

    <!-- 详情对话框 -->
    <el-dialog title="日志详情" v-model="detailVisible" width="700px" append-to-body>
      <el-descriptions :column="2" border v-if="currentLog">
        <el-descriptions-item label="操作账号">{{ currentLog.username }}</el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">{{ currentLog.type }}</el-descriptions-item>
        <el-descriptions-item label="请求方式">{{ currentLog.requestMethod }}</el-descriptions-item>
        <el-descriptions-item label="请求 URL" :span="2">{{ currentLog.requestUrl }}</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre class="log-content">{{ currentLog.requestParams || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2">
          <pre class="log-content">{{ currentLog.responseResult || '-' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="异常信息" :span="2" v-if="currentLog.exception">
          <pre class="log-content error">{{ currentLog.exception }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="Trace ID" :span="2">{{ currentLog.traceId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="操作 IP">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="耗时">{{ currentLog.executeTime }} ms</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.success ? 'success' : 'danger'">
            {{ currentLog.success ? '成功' : '失败' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.createTime }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { Search, Refresh, View } from '@element-plus/icons-vue';
import { getOperationLogs } from '@/api/system';
import { useTable } from '@/hooks/useTable';

const queryRef = ref();
const detailVisible = ref(false);
const currentLog = ref<any>(null);

const {
  tableData,
  total,
  loading,
  queryParams,
  handleQuery,
} = useTable<any>(async (params) => {
  const res = await getOperationLogs(params);
  return { records: res.records || [], total: res.total || 0 };
}, { username: '', module: '', type: '' });

/** 重置按钮操作 */
function resetQuery() {
  queryRef.value?.resetFields();
  handleQuery();
}

/** 查看详情 */
function handleDetail(row: any) {
  currentLog.value = row;
  detailVisible.value = true;
}

/** 获取类型标签颜色 */
function getTypeTag(type: string) {
  const map: Record<string, any> = { 查询: '', 新增: 'success', 修改: 'warning', 删除: 'danger', 导入: 'info', 导出: 'info' };
  return map[type] || '';
}

/** 获取请求方式标签颜色 */
function getMethodTag(method: string) {
  const map: Record<string, any> = { GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' };
  return map[method] || '';
}

onMounted(() => {
  handleQuery();
});
</script>

<style scoped>
.page-container {
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
.log-content {
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  margin: 0;
}
.log-content.error {
  color: #f56c6c;
  background: #fef0f0;
}
</style>
