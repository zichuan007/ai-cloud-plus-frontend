import { request } from "@/utils/request";

export interface DashboardOverview {
  userCount: number;
  deptCount: number;
  todayNewUsers: number;
  activeUsers: number;
}

export interface UserTrendItem {
  date: string;
  count: number;
}

export interface DeptDistItem {
  name: string;
  value: number;
}

export interface ProcessStats {
  totalInstances: number;
  runningInstances: number;
  pendingTasks: number;
  avgDuration: number;
}

export interface ActivityItem {
  processName: string;
  initiator: string;
  startTime: string;
  status: string;
}

/** 获取总览数据 */
export function getDashboardOverview() {
  return request.get<DashboardOverview>("/rbac/dashboard/overview");
}

/** 获取用户增长趋势 */
export function getUserTrend() {
  return request.get<UserTrendItem[]>("/rbac/dashboard/user-trend");
}

/** 获取部门人员分布 */
export function getDeptDist() {
  return request.get<DeptDistItem[]>("/rbac/dashboard/dept-dist");
}

/** 获取流程统计数据 */
export function getProcessStats() {
  return request.get<ProcessStats>("/workflow/dashboard/process-stats");
}

/** 获取最近流程动态 */
export function getRecentActivities() {
  return request.get<ActivityItem[]>("/workflow/dashboard/recent-activities");
}
