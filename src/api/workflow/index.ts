import { request } from "@/utils/request";
import type {
  DefinitionVO,
  InstanceVO,
  TodoTaskVO,
  ModelVO,
  WorkflowQueryParams,
  ModelCreateDTO,
  ModelUpdateDTO,
  TaskApproveDTO,
  TaskRejectDTO,
  TaskTransferDTO,
  ProcessStartDTO,
  NodeConfigVO,
} from "@/types";

// ==================== 流程定义 ====================

/** 获取流程定义列表 */
export function getDefinitionList(params: WorkflowQueryParams) {
  return request.get<DefinitionVO[]>("/workflow/definitions", { params });
}

/** 部署流程 */
export function deployDefinition(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request.post("/workflow/definitions/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/** 查看流程图 (返回 XML) - 注意：后端实际返回的是 PNG 图片，此处兼容调用 */
export function getDefinitionDiagramXml(id: string) {
  return request.get(`/workflow/definitions/${id}/diagram`, {
    responseType: "blob",
  });
}

/** 查看流程图 (返回 PNG 图片) */
export function getDefinitionDiagram(id: string) {
  return request.get(`/workflow/definitions/${id}/diagram`, {
    responseType: "blob",
  });
}

/** 挂起/激活流程 */
export function updateDefinitionStatus(id: string, status: number) {
  const action = status === 1 ? "activate" : "suspend";
  return request.put(`/workflow/definitions/${id}/status`, { action });
}

/** 删除流程 */
export function deleteDefinition(id: string) {
  return request.delete(`/workflow/definitions/${id}`);
}

// ==================== 流程实例 ====================

/** 获取流程实例列表 */
export function getInstanceList(params: WorkflowQueryParams) {
  const backendParams = {
    processDefinitionKey: params.processName,
    status: params.status,
    initiatorId: params.startUserId,
    startTime: params.startTime,
    endTime: params.endTime,
    tenantId: params.tenantId,
  };
  return request.get<InstanceVO[]>("/workflow/instances", {
    params: backendParams,
  });
}

/** 获取实例详情 */
export function getInstanceDetail(id: string) {
  return request.get(`/workflow/instances/${id}`);
}

/** 终止实例 */
export function terminateInstance(id: string, reason: string) {
  return request.post(`/workflow/instances/${id}/terminate`, { reason });
}

// ==================== 任务管理 ====================

/** 获取待办任务（个人） */
export function getTodoTasks(params: WorkflowQueryParams) {
  const backendParams = {
    processDefinitionKey: params.processName,
    status: params.status,
    tenantId: params.tenantId,
  };
  return request.get<TodoTaskVO[]>("/workflow/tasks/pending", {
    params: backendParams,
  });
}

/** 🔴 新增：获取个人待办（直接透传参数，供 todo 页面使用） */
export function getPersonalTasks(params: any) {
  return request.get("/workflow/tasks/pending", { params });
}

/** 🔴 新增：获取组待办（直接透传参数，供 todo 页面使用） */
export function getGroupTasks(params: any) {
  return request.get("/workflow/tasks/group-todo", { params });
}

/** 🔴 新增：签收任务 */
export function claimTask(taskId: string) {
  return request.post(`/workflow/tasks/${taskId}/claim`);
}

/** 🔴 新增：退回组池 */
export function unclaimTask(taskId: string) {
  return request.post(`/workflow/tasks/${taskId}/unclaim`);
}

/** 🔴 新增：一键审批 */
export function approveOneClick(taskId: string, data?: any) {
  return request.post(`/workflow/tasks/${taskId}/approve-one-click`, data);
}

/** 获取已办任务 */
export function getDoneTasks(params: WorkflowQueryParams) {
  const backendParams = {
    processDefinitionKey: params.processName,
    approvalAction: params.result,
    tenantId: params.tenantId,
  };
  return request.get<TodoTaskVO[]>("/workflow/tasks/completed", {
    params: backendParams,
  });
}

/** 获取我发起的 */
export function getInitiatedTasks(params: WorkflowQueryParams) {
  const backendParams = {
    pageNum: params.current || 1,
    pageSize: params.size || 10,
    processDefinitionKey: params.processName,
    status: params.status,
    startTime: params.startTime,
    endTime: params.endTime,
  };
  return request.get<InstanceVO[]>("/workflow/history/instances", {
    params: backendParams,
  });
}

/** 审批任务 */
export function approveTask(
  taskId: string,
  comment: string,
  variables?: Record<string, any>,
) {
  return request.post(`/workflow/tasks/${taskId}/approve`, {
    taskId,
    comment,
    variables,
    tenantId: 1,
  } as TaskApproveDTO);
}

/** 驳回任务 */
export function rejectTask(
  taskId: string,
  comment: string,
  targetNodeId?: string,
) {
  return request.post(`/workflow/tasks/${taskId}/reject`, {
    taskId,
    comment,
    targetNodeId,
    tenantId: 1,
  } as TaskRejectDTO);
}

/** 转办任务 */
export function transferTask(
  taskId: string,
  targetUserId: number,
  comment: string,
) {
  return request.post(`/workflow/tasks/${taskId}/transfer`, {
    taskId,
    targetUserId,
    comment,
    tenantId: 1,
  } as TaskTransferDTO);
}

/** 获取任务表单 */
export function getTaskForm(taskId: string) {
  return request.get(`/workflow/tasks/${taskId}/form`);
}

/** 会签审批 */
export function cosignTask(
  taskId: string,
  comment: string,
  variables?: Record<string, any>,
) {
  return request.post(`/workflow/tasks/${taskId}/cosign`, {
    taskId,
    comment,
    variables,
    tenantId: 1,
  });
}

/** 获取审批历史 */
export function getApprovalHistory(instanceId: string) {
  return request.get(`/workflow/history/instance/${instanceId}/records`);
}

/** 获取用户流程统计 */
export function getUserProcessStatistics() {
  return request.get("/workflow/history/statistics/user");
}

/** 获取待办数量 */
export function getPendingCount(tenantId?: string) {
  return request.get<number>("/workflow/tasks/pending/count", {
    params: { tenantId },
  });
}

// ==================== 流程模型 ====================

/** 获取模型列表 */
export function getModelList(params: WorkflowQueryParams) {
  return request.get<ModelVO[]>("/workflow/models", { params });
}

/** 创建模型 */
export function createModel(data: ModelCreateDTO) {
  return request.post<string>("/workflow/models", data);
}

/** 更新模型 */
export function updateModel(id: string, data: ModelUpdateDTO) {
  return request.put(`/workflow/models/${id}`, data);
}

/** 保存模型 XML */
export function saveModelXml(id: string, xml: string) {
  return request.put(`/workflow/models/${id}/xml`, { xml });
}

/** 导入流程模型 */
export function importModel(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  return request.post<string>("/workflow/models/import", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}

/** 获取模型 XML */
export function getModelXml(id: string) {
  return request.get(`/workflow/models/${id}/xml`);
}

/** 删除模型 */
export function deleteModel(id: string) {
  return request.delete(`/workflow/models/${id}`);
}

/** 部署模型 */
export function deployModel(id: string) {
  return request.post(`/workflow/models/${id}/deploy`);
}

// ==================== 节点策略配置 (V2.0 wf_node_config) ====================

/** 获取节点配置列表 */
export function getNodeConfigList(params?: { processDefKey?: string }) {
  return request.get<NodeConfigVO[]>("/workflow/node-configs", { params });
}

/** 创建节点配置 */
export function createNodeConfig(data: NodeConfigVO) {
  return request.post<NodeConfigVO>("/workflow/node-configs", data);
}

/** 更新节点配置 */
export function updateNodeConfig(id: string, data: NodeConfigVO) {
  return request.put<NodeConfigVO>(`/workflow/node-configs/${id}`, data);
}

/** 删除节点配置 */
export function deleteNodeConfig(id: string) {
  return request.delete(`/workflow/node-configs/${id}`);
}

/** 获取节点配置详情 */
export function getNodeConfigDetail(id: string) {
  return request.get<NodeConfigVO>(`/workflow/node-configs/${id}`);
}

/** 根据流程定义 Key 和节点 ID 查询配置 */
export function getNodeConfigByProcessNode(
  processDefKey: string,
  nodeId: string,
) {
  return request.get<NodeConfigVO>(
    `/workflow/node-configs/process/${processDefKey}/node/${nodeId}`,
  );
}

/** 根据流程定义 Key 查询所有节点配置 */
export function getNodeConfigsByProcess(processDefKey: string) {
  return request.get<NodeConfigVO[]>(
    `/workflow/node-configs/process/${processDefKey}`,
  );
}

/** 批量保存节点配置 */
export function batchSaveNodeConfigs(
  processDefKey: string,
  configs: NodeConfigVO[],
) {
  return request.post(`/workflow/node-configs/batch/${processDefKey}`, configs);
}

// ==================== 流程监控统计 ====================

/** 获取监控统计数据 */
export function getMonitorStatistics() {
  return request.get("/workflow/monitor/statistics");
}

/** 获取流程实例趋势 */
export function getInstanceTrend() {
  return request.get("/workflow/monitor/instance-trend");
}

/** 获取流程类型分布 */
export function getProcessTypeDistribution() {
  return request.get("/workflow/monitor/type-distribution");
}

/** 获取运行中流程 TOP 5 */
export function getTopRunningProcesses() {
  return request.get("/workflow/monitor/top-processes");
}

/** 获取超时任务列表 */
export function getTimeoutTasks() {
  return request.get("/workflow/monitor/timeout-tasks");
}

/** 获取效率分析数据 */
export function getEfficiencyAnalysis() {
  return request.get("/workflow/monitor/efficiency");
}

/** 获取瓶颈节点数据 */
export function getBottleneckNodes() {
  return request.get("/workflow/monitor/bottlenecks");
}

/** 获取部门审批效率排名 */
export function getDepartmentEfficiency() {
  return request.get("/workflow/monitor/department-efficiency");
}

/** 获取流程完成率趋势 */
export function getCompletionRateTrend() {
  return request.get("/workflow/monitor/completion-rate");
}

/** 获取流程节点耗时统计 */
export function getNodeDurationStatistics() {
  return request.get("/workflow/monitor/node-duration");
}

/** 获取流程实例数据快照 (数据监听器专用) */
export function getInstanceSnapshot(instanceId: string) {
  return request.get(`/workflow/monitor/instance/${instanceId}/snapshot`);
}

// ==================== 流程发起 ====================

/** 获取可发起的流程列表 */
export function getStartableProcesses() {
  return request.get("/workflow/processes/startable");
}

/** 启动流程实例 */
export function startProcess(data: ProcessStartDTO) {
  return request.post("/workflow/instances", {
    processDefinitionKey: data.processKey,
    businessKey: data.businessKey,
    variables: data.variables,
    tenantId: data.tenantId ?? 1,
  });
}

/** 回退流程 */
export function rollbackInstance(id: string, reason: string) {
  return request.post(`/workflow/instances/${id}/rollback`, { reason });
}
