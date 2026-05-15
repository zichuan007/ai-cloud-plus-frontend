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
        <el-form-item label="素材名称" prop="name">
          <el-input
            v-model="queryParams.name"
            placeholder="请输入素材名称"
            clearable
            style="width: 240px"
            @keyup.enter="handleQuery"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleQuery">搜索</el-button>
          <el-button :icon="Refresh" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 素材列表区域 -->
    <el-card shadow="hover" class="table-card">
      <template #header>
        <div class="card-header">
          <span class="header-title">素材库</span>
          <div class="header-btns">
            <el-upload
              :show-file-list="false"
              :before-upload="handleBeforeUpload"
              accept="image/*,video/*,audio/*"
            >
              <el-button
                type="primary"
                plain
                :icon="Upload"
                v-permission="['wechat:material:upload']"
              >上传素材</el-button>
            </el-upload>
            <el-button
              type="success"
              plain
              :icon="Refresh"
              @click="handleQuery"
            >刷新</el-button>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-click="handleTabChange" class="material-tabs">
        <el-tab-pane label="图片" name="image" />
        <el-tab-pane label="语音" name="voice" />
        <el-tab-pane label="视频" name="video" />
        <el-tab-pane label="缩略图" name="thumb" />
      </el-tabs>

      <el-row :gutter="16" v-loading="loading">
        <el-col
          v-for="item in tableData"
          :key="item.id"
          :xs="12"
          :sm="8"
          :md="6"
          :lg="4"
          :xl="3"
        >
          <el-card shadow="hover" class="material-card">
            <div class="material-preview">
              <el-image
                v-if="activeTab === 'image' || activeTab === 'thumb'"
                :src="item.fileUrl || '/placeholder.png'"
                fit="cover"
                style="width: 100%; height: 150px; border-radius: 4px"
              />
              <div v-else class="material-placeholder">
                <el-icon :size="48"><VideoCamera v-if="activeTab === 'video'" /><Microphone v-else /></el-icon>
              </div>
            </div>
            <div class="material-info">
              <div class="material-name" :title="item.name">{{ item.name }}</div>
              <div class="material-meta">
                <span>{{ formatFileSize(item.fileSize) }}</span>
                <el-tag size="small" v-if="item.isPermanent === 1" type="success">永久</el-tag>
              </div>
              <div class="material-actions">
                <el-button link type="primary" size="small" @click="handleUploadToWechat(item)" v-permission="['wechat:material:upload']">上传微信</el-button>
                <el-button link type="danger" size="small" @click="handleDelete(item)" v-permission="['wechat:material:delete']">删除</el-button>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-empty v-if="tableData.length === 0 && !loading" description="暂无素材" />

      <pagination
        v-show="total > 0"
        :total="total"
        v-model:page="queryParams.current"
        v-model:limit="queryParams.size"
        @pagination="handleQuery"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox, TabsPaneContext } from 'element-plus';
import { Search, Refresh, Upload, VideoCamera, Microphone } from '@element-plus/icons-vue';
import {
  getMaterialList,
  uploadMaterial,
  uploadMaterialToWechat,
  deleteMaterial,
  getAccountList,
} from '@/api/wechat-oa';
import { useTable } from '@/hooks/useTable';

const queryRef = ref();
const accountList = ref<any[]>([]);
const activeTab = ref('image');

// 使用通用 Table Hook
const {
  tableData,
  total,
  loading,
  queryParams,
  handleQuery,
} = useTable<any>(async (params) => {
  if (!params.accountId) return { records: [], total: 0 };
  const res = await getMaterialList(params);
  return { records: res.records || [], total: res.total || 0 };
}, { accountId: undefined, name: '', type: 1 });

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

/** Tab 切换 */
function handleTabChange(tab: TabsPaneContext) {
  const typeMap: Record<string, number> = { image: 1, voice: 2, video: 3, thumb: 4 };
  queryParams.type = typeMap[tab.paneName as string] || 1;
  queryParams.current = 1;
  handleQuery();
}

/** 重置按钮操作 */
function resetQuery() {
  queryRef.value?.resetFields();
  handleQuery();
}

/** 上传前校验 */
function handleBeforeUpload(file: File) {
  if (!queryParams.accountId) {
    ElMessage.warning('请先选择公众号');
    return false;
  }

  const typeMap: Record<string, number> = { image: 1, voice: 2, video: 3, thumb: 4 };
  const type = typeMap[activeTab.value] || 1;

  const formData = new FormData();
  formData.append('accountId', String(queryParams.accountId));
  formData.append('type', String(type));
  formData.append('name', file.name);
  formData.append('file', file);

  uploadMaterial(formData)
    .then(() => {
      ElMessage.success('上传成功');
      handleQuery();
    })
    .catch(() => {
      ElMessage.error('上传失败');
    });

  return false; // 阻止默认上传行为
}

/** 上传到微信 */
function handleUploadToWechat(row: any) {
  uploadMaterialToWechat(row.id).then(() => {
    ElMessage.success('上传到微信成功');
    handleQuery();
  });
}

/** 删除素材 */
function handleDelete(row: any) {
  ElMessageBox.confirm('是否确认删除素材编号为"' + row.id + '"的数据项？', '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    deleteMaterial([row.id]).then(() => {
      ElMessage.success('删除成功');
      handleQuery();
    });
  }).catch(() => {});
}

/** 格式化文件大小 */
function formatFileSize(bytes: number) {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
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
.material-tabs {
  margin-bottom: 20px;
}
.material-card {
  margin-bottom: 16px;
}
.material-preview {
  height: 150px;
  overflow: hidden;
  border-radius: 4px;
  background-color: #f5f7fa;
}
.material-placeholder {
  height: 150px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
}
.material-info {
  padding-top: 12px;
}
.material-name {
  font-size: 14px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 4px;
}
.material-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}
.material-actions {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #ebeef5;
  padding-top: 8px;
}
</style>
