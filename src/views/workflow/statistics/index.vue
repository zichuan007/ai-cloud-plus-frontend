<template>
  <div class="page-container">
    <el-card class="card-container">
      <template #header>
        <div class="card-header">
          <span>流程统计分析</span>
          <el-button :icon="Refresh" @click="fetchStatistics"
            >刷新数据</el-button
          >
        </div>
      </template>

      <el-row :gutter="24">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header><span>流程效率分析</span></template>
            <div ref="efficiencyChartRef" class="chart-container" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header><span>瓶颈节点识别</span></template>
            <div ref="bottleneckChartRef" class="chart-container" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="24">
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header><span>部门审批效率排名</span></template>
            <div ref="deptChartRef" class="chart-container" />
          </el-card>
        </el-col>
        <el-col :xs="24" :lg="12">
          <el-card class="chart-card">
            <template #header><span>流程完成率趋势</span></template>
            <div ref="completionChartRef" class="chart-container" />
          </el-card>
        </el-col>
      </el-row>

      <el-card class="table-card">
        <template #header><span>流程节点耗时统计 TOP 10</span></template>
        <el-table :data="nodeStats" stripe border>
          <el-table-column prop="rank" label="排名" width="80" align="center" />
          <el-table-column
            prop="nodeName"
            label="节点名称"
            min-width="150"
            align="center"
          />
          <el-table-column
            prop="processName"
            label="所属流程"
            min-width="150"
            align="center"
          />
          <el-table-column
            prop="avgDuration"
            label="平均耗时"
            width="120"
            align="center"
          />
          <el-table-column
            prop="maxDuration"
            label="最长耗时"
            width="120"
            align="center"
          />
          <el-table-column
            prop="count"
            label="处理次数"
            width="100"
            align="center"
          />
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import { Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import {
  getEfficiencyAnalysis,
  getBottleneckNodes,
  getDepartmentEfficiency,
  getCompletionRateTrend,
  getNodeDurationStatistics,
} from "@/api/workflow";

const efficiencyChartRef = ref<HTMLElement>();
const bottleneckChartRef = ref<HTMLElement>();
const deptChartRef = ref<HTMLElement>();
const completionChartRef = ref<HTMLElement>();

let efficiencyChart: echarts.ECharts | null = null;
let bottleneckChart: echarts.ECharts | null = null;
let deptChart: echarts.ECharts | null = null;
let completionChart: echarts.ECharts | null = null;

const nodeStats = ref<any[]>([]);

onMounted(() => {
  fetchStatistics();
  window.addEventListener("resize", handleResize);
});

onBeforeUnmount(() => {
  window.removeEventListener("resize", handleResize);
  efficiencyChart?.dispose();
  bottleneckChart?.dispose();
  deptChart?.dispose();
  completionChart?.dispose();
});

async function fetchStatistics() {
  try {
    const [efficiency, bottlenecks, departments, completion, nodes] =
      await Promise.all([
        getEfficiencyAnalysis(),
        getBottleneckNodes(),
        getDepartmentEfficiency(),
        getCompletionRateTrend(),
        getNodeDurationStatistics(),
      ]);

    initCharts(efficiency, bottlenecks, departments, completion);

    if (nodes) {
      nodeStats.value = nodes.map((node: any, index: number) => ({
        rank: index + 1,
        ...node,
      }));
    }
  } catch (error: any) {
    ElMessage.error(`获取统计数据失败: ${error.message}`);
  }
}

function initCharts(
  efficiency: any,
  bottlenecks: any[],
  departments: any[],
  completion: any[],
) {
  // 效率分析雷达图
  if (efficiencyChartRef.value && efficiency) {
    efficiencyChart = echarts.init(efficiencyChartRef.value);
    efficiencyChart.setOption({
      tooltip: {},
      radar: {
        indicator: [
          { name: "审批速度", max: 100 },
          { name: "完成率", max: 100 },
          { name: "准时率", max: 100 },
          { name: "满意度", max: 100 },
          { name: "自动化率", max: 100 },
        ],
      },
      series: [
        {
          type: "radar",
          data: [
            {
              value: [
                parseFloat(efficiency.avgApprovalSpeed) || 85,
                parseFloat(efficiency.completionRate) || 92,
                parseFloat(efficiency.onTimeRate) || 78,
                parseFloat(efficiency.satisfaction) || 88,
                parseFloat(efficiency.automationRate) || 65,
              ],
              name: "本月",
            },
          ],
        },
      ],
    });
  }

  // 瓶颈节点柱状图
  if (bottleneckChartRef.value && bottlenecks) {
    bottleneckChart = echarts.init(bottleneckChartRef.value);
    bottleneckChart.setOption({
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: bottlenecks.map((b: any) => b.nodeName),
        axisLabel: { rotate: 30 },
      },
      yAxis: { type: "value", name: "平均耗时" },
      series: [
        {
          type: "bar",
          data: bottlenecks.map((b: any) => b.avgDuration),
          itemStyle: { color: "#ef4444" },
        },
      ],
    });
  }

  // 部门效率排名
  if (deptChartRef.value && departments) {
    deptChart = echarts.init(deptChartRef.value);
    deptChart.setOption({
      tooltip: { trigger: "axis" },
      xAxis: { type: "value", name: "平均耗时" },
      yAxis: {
        type: "category",
        data: departments.map((d: any) => d.name),
      },
      series: [
        {
          type: "bar",
          data: departments.map((d: any) => d.avgDuration),
          itemStyle: { color: "#1890ff" },
        },
      ],
    });
  }

  // 完成率趋势
  if (completionChartRef.value && completion) {
    completionChart = echarts.init(completionChartRef.value);
    completionChart.setOption({
      tooltip: { trigger: "axis" },
      xAxis: {
        type: "category",
        data: completion.map((c: any) => c.month),
      },
      yAxis: { type: "value", name: "完成率 (%)" },
      series: [
        {
          type: "line",
          data: completion.map((c: any) => parseFloat(c.rate)),
          smooth: true,
          itemStyle: { color: "#22c55e" },
          areaStyle: { opacity: 0.2 },
        },
      ],
    });
  }
}

function handleResize() {
  efficiencyChart?.resize();
  bottleneckChart?.resize();
  deptChart?.resize();
  completionChart?.resize();
}
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.chart-card,
.table-card {
  margin-bottom: 24px;

  .chart-container {
    height: 350px;
  }
}
</style>
