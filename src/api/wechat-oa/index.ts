import { request } from '@/utils/request';
import type { PageResult } from '@/types';

// ==================== 公众号管理 ====================

/** 获取公众号列表 */
export function getAccountList(params: any) {
  const backendParams = {
    page: params.current || 1,
    pageSize: params.size || 10,
    name: params.name,
    status: params.status,
  };
  return request.get<PageResult<any>>('/wechat-oa/accounts/page', {
    params: backendParams,
  });
}

/** 获取公众号详情 */
export function getAccountDetail(id: number) {
  return request.get<any>(`/wechat-oa/accounts/${id}`);
}

/** 新增公众号 */
export function createAccount(data: any) {
  return request.post('/wechat-oa/accounts', data);
}

/** 更新公众号 */
export function updateAccount(id: number, data: any) {
  return request.put(`/wechat-oa/accounts/${id}`, data);
}

/** 删除公众号 (支持单个/批量) */
export function deleteAccount(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/wechat-oa/accounts/batch-delete", ids);
}

/** 刷新 Token */
export function refreshToken(id: number) {
  return request.post(`/wechat-oa/accounts/${id}/refresh-token`, {});
}

// ==================== 自动回复 ====================

/** 获取自动回复规则列表 */
export function getAutoReplyRuleList(params: any) {
  const backendParams = {
    page: params.current || 1,
    pageSize: params.size || 10,
    accountId: params.accountId,
    ruleType: params.ruleType,
  };
  return request.get<PageResult<any>>('/wechat-oa/auto-reply-rules/page', {
    params: backendParams,
  });
}

/** 获取自动回复规则详情 */
export function getAutoReplyRuleDetail(id: number) {
  return request.get<any>(`/wechat-oa/auto-reply-rules/${id}`);
}

/** 新增自动回复规则 */
export function createAutoReplyRule(data: any) {
  return request.post('/wechat-oa/auto-reply-rules', data);
}

/** 更新自动回复规则 */
export function updateAutoReplyRule(id: number, data: any) {
  return request.put(`/wechat-oa/auto-reply-rules/${id}`, data);
}

/** 删除自动回复规则 (支持单个/批量) */
export function deleteAutoReplyRule(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/wechat-oa/auto-reply-rules/batch-delete", ids);
}

/** 启用/禁用规则 */
export function toggleAutoReplyRule(id: number, enabled: number) {
  return request.put(`/wechat-oa/auto-reply-rules/${id}/toggle`, null, {
    params: { enabled },
  });
}

// ==================== 粉丝管理 ====================

/** 获取粉丝列表 */
export function getFanList(params: any) {
  const backendParams = {
    page: params.current || 1,
    pageSize: params.size || 10,
    accountId: params.accountId,
    nickname: params.nickname,
    subscribeStatus: params.subscribeStatus,
  };
  return request.get<PageResult<any>>('/wechat-oa/fans/page', {
    params: backendParams,
  });
}

/** 获取粉丝详情 */
export function getFanDetail(id: number) {
  return request.get<any>(`/wechat-oa/fans/${id}`);
}

/** 同步粉丝 */
export function syncFans(accountId: number) {
  return request.post('/wechat-oa/fans/sync', null, {
    params: { accountId },
  });
}

// ==================== 图文管理 ====================

/** 获取图文列表 */
export function getArticleList(params: any) {
  const backendParams = {
    page: params.current || 1,
    pageSize: params.size || 10,
    accountId: params.accountId,
    title: params.title,
    status: params.status,
  };
  return request.get<PageResult<any>>('/wechat-oa/articles/page', {
    params: backendParams,
  });
}

/** 获取图文详情 */
export function getArticleDetail(id: number) {
  return request.get<any>(`/wechat-oa/articles/${id}`);
}

/** 保存草稿 */
export function saveDraft(data: any) {
  return request.post('/wechat-oa/articles/draft', data);
}

/** 新增图文 */
export function createArticle(data: any) {
  return request.post('/wechat-oa/articles', data);
}

/** 更新图文 */
export function updateArticle(id: number, data: any) {
  return request.put(`/wechat-oa/articles/${id}`, data);
}

/** 发布图文 */
export function publishArticle(id: number) {
  return request.post(`/wechat-oa/articles/${id}/publish`);
}

/** 删除图文 (支持单个/批量) */
export function deleteArticle(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/wechat-oa/articles/batch-delete", ids);
}

// ==================== 素材管理 ====================

/** 获取素材列表 */
export function getMaterialList(params: any) {
  const backendParams = {
    page: params.current || 1,
    pageSize: params.size || 10,
    accountId: params.accountId,
    type: params.type,
    name: params.name,
  };
  return request.get<PageResult<any>>('/wechat-oa/materials/page', {
    params: backendParams,
  });
}

/** 获取素材详情 */
export function getMaterialDetail(id: number) {
  return request.get<any>(`/wechat-oa/materials/${id}`);
}

/** 上传素材 */
export function uploadMaterial(data: FormData) {
  return request.post('/wechat-oa/materials/upload', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** 上传到微信 */
export function uploadMaterialToWechat(id: number) {
  return request.post(`/wechat-oa/materials/${id}/upload-to-wechat`);
}

/** 删除素材 (支持单个/批量) */
export function deleteMaterial(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/wechat-oa/materials/batch-delete", ids);
}

// ==================== 菜单管理 ====================

/** 获取菜单树 */
export function getMenuTree(accountId: number) {
  return request.get<any[]>('/wechat-oa/menus/tree', {
    params: { accountId },
  });
}

/** 保存菜单 */
export function saveMenus(accountId: number, menus: any[]) {
  return request.post('/wechat-oa/menus/save', menus, {
    params: { accountId },
  });
}

/** 发布菜单到微信 */
export function publishMenu(accountId: number) {
  return request.post(`/wechat-oa/menus/${accountId}/publish`);
}

/** 删除菜单 (支持单个/批量) */
export function deleteMenu(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/wechat-oa/menus/batch-delete", ids);
}

// ==================== 标签管理 ====================

/** 获取标签列表 */
export function getTagList(accountId: number, tagType?: number) {
  const params: any = { accountId };
  if (tagType !== undefined) {
    params.tagType = tagType;
  }
  return request.get<any[]>('/wechat-oa/tags/list', { params });
}

/** 获取标签详情 */
export function getTagDetail(id: number) {
  return request.get<any>(`/wechat-oa/tags/${id}`);
}

/** 新增标签 */
export function createTag(data: any) {
  return request.post('/wechat-oa/tags', data);
}

/** 更新标签 */
export function updateTag(id: number, data: any) {
  return request.put(`/wechat-oa/tags/${id}`, data);
}

/** 删除标签 (支持单个/批量) */
export function deleteTag(id: number | number[]) {
  const ids = Array.isArray(id) ? id : [id];
  return request.post("/wechat-oa/tags/batch-delete", ids);
}

/** 同步微信标签 */
export function syncTags(accountId: number) {
  return request.post('/wechat-oa/tags/sync', null, {
    params: { accountId },
  });
}

// ==================== 数据看板 ====================

/** 获取数据概览 */
export function getDashboardStats(accountId: number, days: number = 7) {
  return request.get<any>('/wechat-oa/dashboard/stats', {
    params: { accountId, days },
  });
}
