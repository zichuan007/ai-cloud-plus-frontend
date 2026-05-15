<template>
  <div class="dashboard-screen">
    <!-- 顶部标题栏 -->
    <div class="screen-header">
      <div class="header-left">
        <h1 class="screen-title">数据概览</h1>
        <span class="update-time">最后更新：{{ currentTime }}</span>
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          :icon="Refresh"
          @click="refreshData"
          :loading="loading"
        >
          刷新数据
        </el-button>
        <el-button :icon="FullScreen" @click="toggleFullscreen">全屏</el-button>
      </div>
    </div>

    <!-- 核心指标卡片 -->
    <el-row :gutter="20" class="metric-row">
      <el-col :xs="12" :sm="6" v-for="metric in metrics" :key="metric.label">
        <div class="metric-card" :style="{ background: metric.gradient }">
          <div class="metric-icon">
            <el-icon :size="32"><component :is="metric.icon" /></el-icon>
          </div>
          <div class="metric-content">
            <div class="metric-value">{{ metric.value }}</div>
            <div class="metric-label">{{ metric.label }}</div>
            <div class="metric-trend" :class="metric.trendType">
              <el-icon v-if="metric.trendType === 'up' && metric.trend !== 0"
                ><Top
              /></el-icon>
              <el-icon
                v-else-if="metric.trendType === 'down' && metric.trend !== 0"
                ><Bottom
              /></el-icon>
              <span v-if="metric.trend !== 0"
                >{{ metric.trend > 0 ? "+" : ""
                }}{{ metric.trend }} 较昨日</span
              >
              <span v-else>持平</span>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="chart-row">
      <!-- 用户增长趋势 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">用户增长趋势</span>
              <span class="card-subtitle">近 7 天新增</span>
            </div>
          </template>
          <div ref="userTrendChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 流程审批统计 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">流程审批统计</span>
              <span class="card-subtitle">实例数 / 待办数 / 平均耗时</span>
            </div>
          </template>
          <div ref="processStatsChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="chart-row">
      <!-- 部门人员分布 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">部门人员分布</span>
            </div>
          </template>
          <div ref="deptDistChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 系统健康状态 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">系统健康状态</span>
            </div>
          </template>
          <div ref="systemHealthChartRef" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 流程状态分布 -->
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">流程状态分布</span>
            </div>
          </template>
          <div ref="processStatusChartRef" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 底部：实时动态 + 快捷入口 -->
    <el-row :gutter="20" class="bottom-row">
      <el-col :xs="24" :lg="16">
        <el-card class="todo-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">实时流程动态</span>
              <el-button
                text
                type="primary"
                @click="router.push('/workflow/instances')"
              >
                查看全部 <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </template>
          <el-table
            :data="activityList"
            stripe
            style="width: 100%"
            :height="280"
            v-loading="loading"
          >
            <el-table-column
              prop="processName"
              label="流程名称"
              min-width="180"
            />
            <el-table-column prop="initiator" label="发起人" width="120" />
            <el-table-column prop="startTime" label="发起时间" width="180" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === '已完成' ? 'success' : 'warning'">
                  {{ row.status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="8">
        <el-card class="quick-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="card-title">快捷入口</span>
            </div>
          </template>
          <div class="quick-grid">
            <div
              v-for="item in quickLinks"
              :key="item.label"
              class="quick-item"
              @click="router.push(item.path)"
            >
              <div class="quick-icon" :style="{ background: item.color }">
                <el-icon :size="24"><component :is="item.icon" /></el-icon>
              </div>
              <span class="quick-label">{{ item.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { useRouter } from "vue-router";
import * as echarts from "echarts";
import type { EChartsOption } from "echarts";
import {
  User,
  OfficeBuilding,
  Document,
  Tickets,
  TrendCharts,
  Monitor,
  ArrowRight,
  Refresh,
  FullScreen,
  Top,
  Bottom,
} from "@element-plus/icons-vue";
import {
  getDashboardOverview,
  getUserTrend,
  getDeptDist,
  getProcessStats,
  getRecentActivities,
} from "@/api/dashboard";
import { getMonitorStatistics } from "@/api/workflow";
import { ElMessage } from "element-plus";
import dayjs from "dayjs";

const router = useRouter();

// 当前时间
const currentTime = ref(dayjs().format("YYYY-MM-DD HH:mm:ss"));
let timeTimer: ReturnType<typeof setInterval>;

// 加载状态
const loading = ref(false);

// 图表引用
const userTrendChartRef = ref<HTMLElement>();
const processStatsChartRef = ref<HTMLElement>();
const deptDistChartRef = ref<HTMLElement>();
const systemHealthChartRef = ref<HTMLElement>();
const processStatusChartRef = ref<HTMLElement>();

let userTrendChart: echarts.ECharts;
let processStatsChart: echarts.ECharts;
let deptDistChart: echarts.ECharts;
let systemHealthChart: echarts.ECharts;
let processStatusChart: echarts.ECharts;

// 核心指标
const metrics = ref([
  {
    label: "用户总数",
    value: 0,
    trend: 0,
    trendType: "up" as const,
    icon: User,
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  },
  {
    label: "部门总数",
    value: 0,
    trend: 0,
    trendType: "up" as const,
    icon: OfficeBuilding,
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
  },
  {
    label: "流程实例",
    value: 0,
    trend: 0,
    trendType: "up" as const,
    icon: Document,
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  },
  {
    label: "待办任务",
    value: 0,
    trend: 0,
    trendType: "down" as const,
    icon: Tickets,
    gradient: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
  },
]);

// 动态列表
const activityList = ref<any[]>([]);

// 快捷入口
const quickLinks = [
  { label: "用户管理", path: "/rbac/users", icon: User, color: "#667eea" },
  { label: "角色管理", path: "/rbac/roles", icon: User, color: "#f5576c" },
  {
    label: "流程定义",
    path: "/workflow/definitions",
    icon: Document,
    color: "#4facfe",
  },
  {
    label: "待办任务",
    path: "/workflow/tasks/pending",
    icon: Tickets,
    color: "#43e97b",
  },
  {
    label: "流程监控",
    path: "/workflow/monitor",
    icon: Monitor,
    color: "#fa709a",
  },
  {
    label: "审批统计",
    path: "/workflow/statistics",
    icon: TrendCharts,
    color: "#fee140",
  },
];

// 更新时间
function updateTime() {
  currentTime.value = dayjs().format("YYYY-MM-DD HH:mm:ss");
}

// 刷新数据
async function refreshData() {
  loading.value = true;
  try {
    await Promise.all([
      fetchOverview(),
      fetchUserTrend(),
      fetchDeptDist(),
      fetchProcessStats(),
      fetchActivities(),
    ]);
    ElMessage.success("数据已刷新");
  } catch (error: any) {
    console.error("刷新数据失败:", error);
  } finally {
    loading.value = false;
  }
}

// 全屏切换
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

// 获取总览数据
async function fetchOverview() {
  try {
    const data = await getDashboardOverview();
    if (data) {
      metrics.value[0].value = data.userCount || 0;
      metrics.value[0].trend = data.todayNewUsers || 0;
      metrics.value[1].value = data.deptCount || 0;
      metrics.value[2].value = 0; // 流程实例数从 processStats 获取
      metrics.value[3].value = 0; // 待办任务数从 processStats 获取
    }
  } catch (e) {
    console.error("获取总览数据失败", e);
  }
}

// 获取流程统计
async function fetchProcessStats() {
  try {
    const data = await getProcessStats();
    if (data) {
      metrics.value[2].value = data.totalInstances || 0;
      metrics.value[3].value = data.pendingTasks || 0;

      // 更新流程审批效率图表
      renderProcessStatsChart(data);
      renderProcessStatus(data);
    }
  } catch (e) {
    console.error("获取流程统计失败", e);
  }
}

// 获取用户增长趋势
async function fetchUserTrend() {
  try {
    const data = await getUserTrend();
    if (data && data.length > 0) {
      const dates = data.map((item) => item.date);
      const counts = data.map((item) => item.count);

      const option: EChartsOption = {
        tooltip: { trigger: "axis" },
        grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
        xAxis: {
          type: "category",
          boundaryGap: false,
          data: dates,
          axisLine: { lineStyle: { color: "#999" } },
        },
        yAxis: {
          type: "value",
          axisLine: { lineStyle: { color: "#999" } },
          splitLine: { lineStyle: { color: "#eee" } },
        },
        series: [
          {
            name: "新增用户",
            type: "line",
            smooth: true,
            data: counts,
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: "rgba(102, 126, 234, 0.8)" },
                { offset: 1, color: "rgba(102, 126, 234, 0.1)" },
              ]),
            },
            itemStyle: { color: "#667eea" },
          },
        ],
      };

      if (!userTrendChart) {
        userTrendChart = echarts.init(userTrendChartRef.value);
      }
      userTrendChart.setOption(option);
    }
  } catch (e) {
    console.error("获取用户趋势失败", e);
  }
}

// 获取部门分布
async function fetchDeptDist() {
  try {
    const data = await getDeptDist();
    if (data && data.length > 0) {
      const option: EChartsOption = {
        tooltip: { trigger: "item" },
        legend: { bottom: "0%", left: "center" },
        series: [
          {
            name: "部门人数",
            type: "pie",
            radius: ["40%", "70%"],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 10,
              borderColor: "#fff",
              borderWidth: 2,
            },
            label: { show: false, position: "center" },
            emphasis: {
              label: { show: true, fontSize: 20, fontWeight: "bold" },
            },
            data: data.map((item) => ({ value: item.value, name: item.name })),
          },
        ],
      };

      if (!deptDistChart) {
        deptDistChart = echarts.init(deptDistChartRef.value);
      }
      deptDistChart.setOption(option);
    }
  } catch (e) {
    console.error("获取部门分布失败", e);
  }
}

// 渲染流程统计图表
function renderProcessStatsChart(stats: any) {
  if (!processStatsChartRef.value) return;

  const option: EChartsOption = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    grid: { left: "3%", right: "4%", bottom: "3%", containLabel: true },
    xAxis: {
      type: "category",
      data: ["总实例", "运行中", "待办任务", "平均耗时 (h)"],
      axisLine: { lineStyle: { color: "#999" } },
    },
    yAxis: {
      type: "value",
      axisLine: { lineStyle: { color: "#999" } },
      splitLine: { lineStyle: { color: "#eee" } },
    },
    series: [
      {
        name: "数值",
        type: "bar",
        data: [
          stats.totalInstances || 0,
          stats.runningInstances || 0,
          stats.pendingTasks || 0,
          stats.avgDuration || 0,
        ],
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: "#4facfe" },
            { offset: 1, color: "#00f2fe" },
          ]),
        },
        barWidth: "50%",
      },
    ],
  };

  if (!processStatsChart) {
    processStatsChart = echarts.init(processStatsChartRef.value);
  }
  processStatsChart.setOption(option);
}

// 获取实时动态
async function fetchActivities() {
  try {
    const data = await getRecentActivities();
    activityList.value = data || [];
  } catch (e) {
    console.error("获取实时动态失败", e);
  }
}

// 系统健康状态
async function renderSystemHealth() {
  if (!systemHealthChartRef.value) return;

  try {
    const res = await getMonitorStatistics();
    const cpuUsage = res.data?.cpuUsage || 42;

    const option: EChartsOption = {
      tooltip: { formatter: "{a} <br/>{b} : {c}%" },
      series: [
        {
          name: "系统负载",
          type: "gauge",
          detail: { formatter: "{value}%" },
          data: [{ value: cpuUsage, name: "CPU 使用率" }],
          axisLine: {
            lineStyle: {
              width: 20,
              color: [
                [0.3, "#67e0e3"],
                [0.7, "#37a2da"],
                [1, "#fd666d"],
              ],
            },
          },
        },
      ],
  };

    if (!systemHealthChart) {
      systemHealthChart = echarts.init(systemHealthChartRef.value);
    }
    systemHealthChart.setOption(option);
  } catch (e) {
    console.error("渲染系统健康状态失败", e);
  }
}

// 流程状态分布 (基于真实数据计算)
function renderProcessStatus(stats: any) {
  if (!processStatusChartRef.value) return;

  const total = stats.totalInstances || 0;
  const running = stats.runningInstances || 0;
  const finished = total - running;

  const option: EChartsOption = {
    tooltip: { trigger: "item" },
    legend: { top: "5%", left: "center" },
    series: [
      {
        name: "流程状态",
        type: "pie",
        radius: "60%",
        data: [
          { value: running, name: "审批中", itemStyle: { color: "#4facfe" } },
          { value: finished, name: "已完成", itemStyle: { color: "#43e97b" } },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: "rgba(0, 0, 0, 0.5)",
          },
        },
      },
    ],
  };

  if (!processStatusChart) {
    processStatusChart = echarts.init(processStatusChartRef.value);
  }
  processStatusChart.setOption(option);
}

// 窗口大小变化时重绘图表
function handleResize() {
  userTrendChart?.resize();
  processStatsChart?.resize();
  deptDistChart?.resize();
  systemHealthChart?.resize();
  processStatusChart?.resize();
}

onMounted(async () => {
  // 更新时间
  updateTime();
  timeTimer = setInterval(updateTime, 1000);

  // 加载数据
  await refreshData();

  // 渲染静态图表
  renderSystemHealth();

  // 监听窗口大小变化
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  clearInterval(timeTimer);
  window.removeEventListener("resize", handleResize);
  userTrendChart?.dispose();
  processStatsChart?.dispose();
  deptDistChart?.dispose();
  systemHealthChart?.dispose();
  processStatusChart?.dispose();
});
</script>

<style scoped lang="scss">
// 仪表盘容器
.dashboard-screen {
  padding: 20px;
  background: linear-gradient(180deg, #f0f2f5 0%, #ffffff 100%);
  min-height: calc(100vh - 60px);

  // 顶部标题栏
  .screen-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding: 20px 28px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 16px;
    color: #fff;
    box-shadow: 0 8px 24px rgba(102, 126, 234, 0.35);
    transition: all 0.3s ease;

    &:hover {
      box-shadow: 0 12px 32px rgba(102, 126, 234, 0.45);
      transform: translateY(-2px);
    }

    .header-left {
      .screen-title {
        font-size: 22px;
        font-weight: 700;
        margin: 0 0 6px 0;
        letter-spacing: 0.5px;
      }

      .update-time {
        font-size: 13px;
        opacity: 0.85;
        font-weight: 400;
      }
    }

    .header-right {
      display: flex;
      gap: 12px;
    }
  }

  // 核心指标卡片行
  .metric-row {
    margin-bottom: 20px;

    .metric-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px 24px;
      border-radius: 16px;
      color: #fff;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: default;
      position: relative;
      overflow: hidden;

      // 装饰性光效
      &::before {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 120px;
        height: 120px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
        transform: translate(30%, -30%);
      }

      &:hover {
        transform: translateY(-6px);
        box-shadow: 0 16px 32px rgba(0, 0, 0, 0.2);
      }

      .metric-icon {
        width: 52px;
        height: 52px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.25);
        border-radius: 14px;
        backdrop-filter: blur(4px);
        transition: all 0.3s ease;
      }

      &:hover .metric-icon {
        transform: scale(1.1) rotate(5deg);
      }

      .metric-content {
        flex: 1;

        .metric-value {
          font-size: 30px;
          font-weight: 700;
          line-height: 1.2;
          letter-spacing: -0.5px;
        }

        .metric-label {
          font-size: 14px;
          opacity: 0.9;
          margin-top: 4px;
          font-weight: 500;
        }

        .metric-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          margin-top: 8px;
          font-weight: 500;

          &.up {
            color: #a8ffb8;
          }

          &.down {
            color: #ffd6d6;
          }
        }
      }
    }
  }

  // 图表区域
  .chart-row {
    margin-bottom: 20px;

    .chart-card {
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }

        .card-subtitle {
          font-size: 12px;
          color: #909399;
        }
      }

      .chart-container {
        height: 300px;
        width: 100%;
      }
    }
  }

  // 底部区域
  .bottom-row {
    .todo-card,
    .quick-card {
      border-radius: 12px;
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
      }

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .card-title {
          font-size: 15px;
          font-weight: 600;
          color: #303133;
        }
      }
    }

    // 快捷入口
    .quick-card {
      .quick-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;

        .quick-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 24px 16px;
          background: linear-gradient(145deg, #f8f9fa 0%, #ffffff 100%);
          border-radius: 14px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid transparent;

          &:hover {
            background: #fff;
            transform: translateY(-4px);
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
            border-color: rgba(64, 158, 255, 0.2);

            .quick-icon {
              transform: scale(1.15);
            }
          }

          .quick-icon {
            width: 50px;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 14px;
            color: #fff;
            transition: all 0.3s ease;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }

          .quick-label {
            font-size: 13px;
            color: #606266;
            font-weight: 500;
          }
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .dashboard-screen {
    .screen-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
      padding: 16px 20px;

      .header-left .screen-title {
        font-size: 18px;
      }
    }

    .quick-grid {
      grid-template-columns: repeat(2, 1fr) !important;
    }

    .metric-row .metric-card {
      padding: 16px 20px;

      .metric-icon {
        width: 44px;
        height: 44px;
      }

      .metric-content .metric-value {
        font-size: 24px;
      }
    }
  }
}
</style>
