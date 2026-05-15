<template>
  <div class="monitor-page">
    <el-row :gutter="24" class="stat-row">
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card running">
          <div class="stat-icon">
            <el-icon><VideoPlay /></el-icon>
          </div>
          <div class="stat-value">{{ stats.runningInstances }}</div>
          <div class="stat-label">运行中实例</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card pending">
          <div class="stat-icon">
            <el-icon><Clock /></el-icon>
          </div>
          <div class="stat-value">{{ stats.pendingTasks }}</div>
          <div class="stat-label">待办任务</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card completed">
          <div class="stat-icon">
            <el-icon><Finished /></el-icon>
          </div>
          <div class="stat-value">{{ stats.completedToday }}</div>
          <div class="stat-label">今日完成</div>
        </div>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <div class="stat-card timeout">
          <div class="stat-icon">
            <el-icon><Warning /></el-icon>
          </div>
          <div class="stat-value">{{ stats.timeoutTasks }}</div>
          <div class="stat-label">超时任务</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <el-col :xs="24" :lg="16">
        <el-card class="chart-card">
          <template #header><span>流程实例趋势 (近 7 天)</span></template>
          <div ref="trendChartRef" class="chart-container" />
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="8">
        <el-card class="chart-card">
          <template #header><span>流程类型分布</span></template>
          <div ref="pieChartRef" class="chart-container" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="24">
      <el-col :xs="24" :lg="12">
        <el-card class="table-card">
          <template #header><span>运行中流程 TOP 5</span></template>
          <el-table :data="topProcesses" stripe border>
            <el-table-column
              prop="name"
              label="流程名称"
              min-width="150"
              align="center"
            />
            <el-table-column
              prop="count"
              label="实例数"
              width="100"
              align="center"
            />
            <el-table-column
              prop="avgDuration"
              label="平均耗时"
              width="120"
              align="center"
            />
          </el-table>
        </el-card>
      </el-col>
      <el-col :xs="24" :lg="12">
        <el-card class="table-card">
          <template #header><span>超时任务预警</span></template>
          <el-table :data="timeoutTasks" stripe border>
            <el-table-column
              prop="taskName"
              label="任务名称"
              min-width="150"
              align="center"
            />
            <el-table-column
              prop="assignee"
              label="处理人"
              width="100"
              align="center"
            />
            <el-table-column
              prop="timeout"
              label="超时时长"
              width="120"
              align="center"
            >
              <template #default="{ row }">
                <el-tag type="danger">{{ row.timeout }}</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from "vue";
import { VideoPlay, Clock, Finished, Warning } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import {
  getMonitorStatistics,
  getInstanceTrend,
  getProcessTypeDistribution,
  getTopRunningProcesses,
  getTimeoutTasks,
} from "@/api/workflow";

const stats = reactive({
  runningInstances: 0,
  pendingTasks: 0,
  completedToday: 0,
  timeoutTasks: 0,
});

const topProcesses = ref<any[]>([]);
const timeoutTasks = ref<any[]>([]);

const trendChartRef = ref<HTMLElement>();
const pieChartRef = ref<HTMLElement>();
let trendChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

onMounted(() => {
  fetchMonitorData();
  initCharts();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  trendChart?.dispose();
  pieChart?.dispose();
});

async function fetchMonitorData() {
  try {
    const [statistics, trend, distribution, top, timeout] = await Promise.all([
      getMonitorStatistics(),
      getInstanceTrend(),
      getProcessTypeDistribution(),
      getTopRunningProcesses(),
      getTimeoutTasks(),
    ]);

    if (statistics) {
      stats.runningInstances = statistics.runningInstances || 0;
      stats.pendingTasks = statistics.pendingTasks || 0;
      stats.completedToday = statistics.completedToday || 0;
      stats.timeoutTasks = statistics.timeoutTasks || 0;
    }

    if (top) {
      topProcesses.value = top;
    }

    if (timeout) {
      timeoutTasks.value = timeout;
    }

    updateCharts(trend, distribution);
  } catch (error: any) {
    ElMessage.error(`获取监控数据失败: ${error.message}`);
  }
}

function initCharts() {
  if (trendChartRef.value) {
    trendChart = echarts.init(trendChartRef.value);
    trendChart.setOption({
      tooltip: { trigger: "axis" },
      legend: { data: ["发起数", "完成数"] },
      xAxis: { type: "category", data: [] },
      yAxis: { type: "value" },
      series: [
        { name: "发起数", type: "line", smooth: true, data: [] },
        { name: "完成数", type: "line", smooth: true, data: [] },
      ],
    });
  }

  if (pieChartRef.value) {
    pieChart = echarts.init(pieChartRef.value);
    pieChart.setOption({
      tooltip: { trigger: "item" },
      series: [
        {
          type: "pie",
          radius: ["40%", "70%"],
          data: [],
        },
      ],
    });
  }
}

function updateCharts(trend: any[], distribution: any[]) {
  if (trendChart && trend) {
    trendChart.setOption({
      xAxis: { data: trend.map((t: any) => t.date) },
      series: [
        { data: trend.map((t: any) => t.started) },
        { data: trend.map((t: any) => t.completed) },
      ],
    });
  }

  if (pieChart && distribution) {
    pieChart.setOption({
      series: [{ data: distribution }],
    });
  }
}

function handleResize() {
  trendChart?.resize();
  pieChart?.resize();
}
</script>

<style scoped lang="scss">
.monitor-page {
  .stat-row {
    margin-bottom: 24px;

    .stat-card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      transition: all 0.3s;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .stat-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 56px;
        height: 56px;
        border-radius: 12px;
        color: #fff;
        font-size: 24px;
      }

      .stat-value {
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }

      .stat-label {
        font-size: 13px;
        color: #666;
      }

      &.running .stat-icon {
        background: linear-gradient(135deg, #22c55e, #4ade80);
      }
      &.pending .stat-icon {
        background: linear-gradient(135deg, #f59e0b, #fbbf24);
      }
      &.completed .stat-icon {
        background: linear-gradient(135deg, #0284c7, #38bdf8);
      }
      &.timeout .stat-icon {
        background: linear-gradient(135deg, #ef4444, #f87171);
      }
    }
  }

  .chart-card,
  .table-card {
    margin-bottom: 24px;

    .chart-container {
      height: 350px;
    }
  }
}
</style>
