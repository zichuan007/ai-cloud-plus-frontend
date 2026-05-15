<template>
  <div class="wechat-oa-dashboard">
    <!-- 公众号选择器 -->
    <el-card class="account-selector-card">
      <el-form inline>
        <el-form-item label="公众号">
          <el-select
            v-model="accountId"
            placeholder="请选择公众号"
            @change="handleAccountChange"
          >
            <el-option
              v-for="item in accountList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-radio-group v-model="days" @change="fetchData">
            <el-radio-button :value="1">今日</el-radio-button>
            <el-radio-button :value="7">近7天</el-radio-button>
            <el-radio-button :value="30">近30天</el-radio-button>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据卡片 -->
    <el-row :gutter="16" class="stat-cards">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #409eff">
              <el-icon :size="24"><UserFilled /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.todayNewFans || 0 }}</div>
              <div class="stat-label">今日新增粉丝</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #67c23a">
              <el-icon :size="24"><ChatDotRound /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.todayMessages || 0 }}</div>
              <div class="stat-label">今日消息数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #e6a23c">
              <el-icon :size="24"><View /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.todayReads || 0 }}</div>
              <div class="stat-label">今日阅读量</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-card">
            <div class="stat-icon" style="background: #f56c6c">
              <el-icon :size="24"><User /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ stats.totalFans || 0 }}</div>
              <div class="stat-label">累计粉丝</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 趋势图表 -->
    <el-row :gutter="16" class="charts">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>粉丝增长趋势</span>
          </template>
          <div ref="fanChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>图文阅读趋势</span>
          </template>
          <div ref="readChartRef" style="height: 350px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作 -->
    <el-card class="quick-actions">
      <template #header>
        <span>快捷操作</span>
      </template>
      <el-row :gutter="16">
        <el-col :span="6">
          <el-button
            class="quick-btn"
            @click="$router.push('/wechat-oa/accounts')"
          >
            <el-icon><Plus /></el-icon>
            <span>新增公众号</span>
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button
            class="quick-btn"
            @click="$router.push('/wechat-oa/articles')"
          >
            <el-icon><Document /></el-icon>
            <span>新建图文</span>
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button
            class="quick-btn"
            @click="$router.push('/wechat-oa/auto-reply')"
          >
            <el-icon><ChatLineSquare /></el-icon>
            <span>配置自动回复</span>
          </el-button>
        </el-col>
        <el-col :span="6">
          <el-button class="quick-btn" @click="$router.push('/wechat-oa/fans')">
            <el-icon><User /></el-icon>
            <span>查看粉丝</span>
          </el-button>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from "vue";
import { ElMessage } from "element-plus";
import {
  UserFilled,
  ChatDotRound,
  View,
  User,
  Plus,
  Document,
  ChatLineSquare,
} from "@element-plus/icons-vue";
import * as echarts from "echarts";
import { getDashboardStats, getAccountList } from "@/api/wechat-oa";

// 公众号列表
const accountList = ref<any[]>([]);
const accountId = ref<number>();

// 时间范围
const days = ref(7);

// 统计数据
const stats = reactive({
  todayNewFans: 0,
  todayUnsubscribe: 0,
  todayNetFans: 0,
  totalFans: 0,
  todayMessages: 0,
  todayReads: 0,
  todayShares: 0,
});

// 图表引用
const fanChartRef = ref<HTMLElement>();
const readChartRef = ref<HTMLElement>();
let fanChart: echarts.ECharts | null = null;
let readChart: echarts.ECharts | null = null;

// 获取数据
const fetchData = async () => {
  if (!accountId.value) return;
  try {
    const res = await getDashboardStats(accountId.value, days.value);
    Object.assign(stats, res);
    renderCharts(res);
  } catch (error) {
    ElMessage.error("获取数据失败");
  }
};

// 获取公众号列表
const fetchAccounts = async () => {
  try {
    const res = await getAccountList({ current: 1, size: 100 });
    accountList.value = res.records || [];
    if (accountList.value.length > 0) {
      accountId.value = accountList.value[0].id;
      fetchData();
    }
  } catch (error) {
    ElMessage.error("获取公众号列表失败");
  }
};

// 公众号切换
const handleAccountChange = () => {
  fetchData();
};

// 渲染图表
const renderCharts = (data: any) => {
  nextTick(() => {
    // 粉丝增长趋势
    if (fanChartRef.value) {
      fanChart = echarts.init(fanChartRef.value);
      fanChart.setOption({
        tooltip: { trigger: "axis" },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
          type: "category",
          data: data.fanTrend?.map((item: any) => item.date) || [],
        },
        yAxis: { type: "value" },
        series: [
          {
            name: "新增粉丝",
            type: "line",
            smooth: true,
            data: data.fanTrend?.map((item: any) => item.value) || [],
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: "#409eff" },
          },
        ],
      });
    }

    // 图文阅读趋势
    if (readChartRef.value) {
      readChart = echarts.init(readChartRef.value);
      readChart.setOption({
        tooltip: { trigger: "axis" },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
          type: "category",
          data: data.readTrend?.map((item: any) => item.date) || [],
        },
        yAxis: { type: "value" },
        series: [
          {
            name: "阅读量",
            type: "line",
            smooth: true,
            data: data.readTrend?.map((item: any) => item.value) || [],
            areaStyle: { opacity: 0.3 },
            itemStyle: { color: "#e6a23c" },
          },
        ],
      });
    }
  });
};

onMounted(() => {
  fetchAccounts();
  window.addEventListener("resize", () => {
    fanChart?.resize();
    readChart?.resize();
  });
});
</script>

<style scoped lang="scss">
.wechat-oa-dashboard {
  .account-selector-card {
    margin-bottom: 16px;
  }

  .stat-cards {
    margin-bottom: 16px;
  }

  .stat-card {
    display: flex;
    align-items: center;

    .stat-icon {
      width: 60px;
      height: 60px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      margin-right: 16px;
    }

    .stat-content {
      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #303133;
      }

      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }

  .charts {
    margin-bottom: 16px;
  }

  .quick-actions {
    .quick-btn {
      width: 100%;
      height: 60px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
    }
  }
}
</style>
