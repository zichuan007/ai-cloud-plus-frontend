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
        <el-form-item label="昵称" prop="nickname">
          <el-input
            v-model="queryParams.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item label="关注状态" prop="subscribeStatus">
          <el-select v-model="queryParams.subscribeStatus" placeholder="请选择" clearable style="width: 240px">
            <el-option label="已关注" :value="1" />
            <el-option label="已取消" :value="0" />
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
          <span class="header-title">粉丝列表</span>
          <div class="header-btns">
            <el-button
              type="success"
              plain
              :icon="Download"
              @click="handleSync"
              v-permission="['wechat:fans:sync']"
            >同步粉丝</el-button>
            <el-button
              type="primary"
              plain
              :icon="Refresh"
              @click="handleQuery"
            >刷新</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column label="头像" align="center" width="80">
          <template #default="{ row }">
            <el-avatar :size="40" shape="square" :src="row.headImgUrl" />
          </template>
        </el-table-column>
        <el-table-column label="昵称" align="center" prop="nickname" min-width="120" show-overflow-tooltip />
        <el-table-column label="OpenID" align="center" prop="openId" min-width="150" show-overflow-tooltip />
        <el-table-column label="性别" align="center" prop="sex" width="80">
          <template #default="{ row }">
            <span v-if="row.sex === 1">男</span>
            <span v-else-if="row.sex === 2">女</span>
            <span v-else>未知</span>
          </template>
        </el-table-column>
        <el-table-column label="地区" align="center" width="120">
          <template #default="{ row }">
            {{ row.province }} {{ row.city }}
          </template>
        </el-table-column>
        <el-table-column label="关注状态" align="center" prop="subscribeStatus" width="100">
          <template #default="{ row }">
            <el-tag :type="row.subscribeStatus === 1 ? 'success' : 'danger'">
              {{ row.subscribeStatus === 1 ? '已关注' : '已取消' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="关注时间" align="center" prop="subscribeTime" width="160" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100">
          <template #default="scope">
            <el-button link type="primary" :icon="View" @click="handleDetail(scope.row)">详情</el-button>
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

    <!-- 粉丝详情对话框 -->
    <el-dialog title="粉丝详情" v-model="detailVisible" width="600px" append-to-body>
      <el-descriptions :column="2" border v-if="currentFan">
        <el-descriptions-item label="昵称">{{ currentFan.nickname }}</el-descriptions-item>
        <el-descriptions-item label="性别">
          {{ currentFan.sex === 1 ? '男' : currentFan.sex === 2 ? '女' : '未知' }}
        </el-descriptions-item>
        <el-descriptions-item label="地区">
          {{ currentFan.country }} {{ currentFan.province }} {{ currentFan.city }}
        </el-descriptions-item>
        <el-descriptions-item label="语言">{{ currentFan.language }}</el-descriptions-item>
        <el-descriptions-item label="OpenID" :span="2">{{ currentFan.openId }}</el-descriptions-item>
        <el-descriptions-item label="UnionID" :span="2">{{ currentFan.unionId || '-' }}</el-descriptions-item>
        <el-descriptions-item label="关注状态">
          <el-tag :type="currentFan.subscribeStatus === 1 ? 'success' : 'danger'">
            {{ currentFan.subscribeStatus === 1 ? '已关注' : '已取消' }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="标签">
          {{ currentFan.tagNames || '-' }}
        </el-descriptions-item>
        <el-descriptions-item label="关注时间">{{ currentFan.subscribeTime }}</el-descriptions-item>
        <el-descriptions-item label="最后互动时间">{{ currentFan.lastInteractTime || '-' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, FormInstance } from 'element-plus';
import { Search, Refresh, Download, View } from '@element-plus/icons-vue';
import { getFanList, getFanDetail, syncFans, getAccountList } from '@/api/wechat-oa';
import { useTable } from '@/hooks/useTable';

const queryRef = ref<FormInstance>();
const detailVisible = ref(false);
const currentFan = ref<any>(null);
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
  const res = await getFanList(params);
  return { records: res.records || [], total: res.total || 0 };
}, { accountId: undefined, nickname: '', subscribeStatus: undefined });

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

/** 同步粉丝 */
function handleSync() {
  if (!queryParams.accountId) {
    ElMessage.warning('请先选择公众号');
    return;
  }
  ElMessage.info('同步任务已提交，请稍后刷新查看');
  syncFans(queryParams.accountId).then(() => {
    // 实际项目中可能需要轮询或者等待一段时间再刷新
  });
}

/** 查看详情 */
async function handleDetail(row: any) {
  try {
    const detail = await getFanDetail(row.id);
    currentFan.value = detail;
  } catch (error) {
    currentFan.value = row;
  }
  detailVisible.value = true;
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
