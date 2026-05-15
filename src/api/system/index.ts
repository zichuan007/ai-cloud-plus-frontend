import { request } from "@/utils/request";

/** 获取系统配置 */
export function getSystemConfigs() {
  return request.get("/rbac/system/configs");
}

/** 保存系统配置 */
export function saveSystemConfigs(data: any) {
  return request.post("/rbac/system/configs", data);
}

/** 测试邮件配置 */
export function testEmailConfig(data: any) {
  return request.post("/rbac/system/configs/test-email", data);
}

/** 测试短信配置 */
export function testSmsConfig(data: any) {
  return request.post("/rbac/system/configs/test-sms", data);
}

/** 获取操作日志 */
export function getOperationLogs(params: any) {
  return request.get("/rbac/system/operation-logs", { params });
}
