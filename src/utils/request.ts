import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import { ElMessage } from "element-plus";
import Cookies from "js-cookie";
import router from "@/router";
import { useUserStore } from "@/stores/user";

class RequestClient {
  private instance: AxiosInstance;
  
  // 🔴 核心新增：Token 刷新相关状态
  private isRefreshing = false; // 是否正在刷新 Token
  private pendingRequests: Array<() => void> = []; // 挂起的请求队列

  // 防抖锁：防止并发 401 导致多次跳转和弹窗
  private isHandling401 = false;
  // 🔴 核心修复：路由守卫激活标志，防止守卫内 API 的 401 触发双重跳转
  private guardActive = false;

  constructor(config: AxiosRequestConfig) {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
      timeout: 15000,
      ...config,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        if (config.url && !config.url.startsWith("/api")) {
          config.url = `/api${config.url}`;
        }

        const token = Cookies.get("access_token");
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { code, message, data, page } = response.data;

        // 处理双层嵌套
        let actualData = data;
        if (
          data &&
          typeof data === "object" &&
          "data" in data &&
          (data as any).code !== undefined
        ) {
          actualData = (data as any).data;
        }

        // 🔴 核心修复：Number() 转换兼容后端返回字符串 "200"/"0" 的情况
        const codeNum = Number(code);
        if (codeNum === 200 || codeNum === 0) {
          // 分页数据处理
          if (page && typeof page === "object") {
            return { records: actualData, ...page };
          }
          return actualData;
        }

        // 业务逻辑错误（如参数错误），不跳登录页，除非是 401
        if (code === 401) {
          // 🔴 打印具体接口和响应
          console.error(
            `🚨 [业务码401] 触发处理 | 接口: ${response.config.url} | 后端返回:`,
            response.data,
          );
          this.handleUnauthorizedOrRefresh(response.config);
          return Promise.reject(new Error(message));
        }

        ElMessage.error(message || "请求失败");
        return Promise.reject(new Error(message));
      },
      async (error) => {
        // 网络层错误（超时、断网等）
        if (error.response?.status === 401) {
          // 🔴 打印具体接口和状态
          console.error(
            `🚨 [HTTP 401] 触发处理 | 接口: ${error.config?.url} | 状态: ${error.response.status}`,
          );
          await this.handleUnauthorizedOrRefresh(error.config);
        } else if (error.response?.status === 403) {
          ElMessage.error("没有权限执行此操作");
        } else if (error.response?.status === 404) {
          ElMessage.error("请求的资源不存在");
        } else if (error.response?.status === 500) {
          ElMessage.error("服务器内部错误");
        } else {
          // 网络超时或断开，不跳登录页
          const msg =
            error.code === "ECONNABORTED"
              ? "请求超时，请检查网络"
              : "网络连接异常";
          ElMessage.warning(msg);
        }
        return Promise.reject(error);
      },
    );
  }

  /**
   * 🔴 核心逻辑：处理 401 - 尝试刷新 Token 或跳转登录
   */
  private async handleUnauthorizedOrRefresh(originalRequest: AxiosRequestConfig & { _retry?: boolean }) {
    // 1. 如果请求已经重试过，直接跳转登录，防止死循环
    if (originalRequest._retry) {
      console.warn("🚨 [Token 刷新] 请求已重试过，刷新失败，跳转登录");
      this.handleUnauthorized("认证令牌无效或已过期");
      return;
    }
    originalRequest._retry = true;

    // 2. 如果正在刷新，将请求加入队列并挂起
    if (this.isRefreshing) {
      console.log("⏳ [Token 刷新] 正在刷新中，请求已加入队列");
      return new Promise((resolve) => {
        this.pendingRequests.push(() => {
          // 刷新成功后，更新 Header 并重试
          const newToken = Cookies.get("access_token");
          if (newToken && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          resolve(this.instance(originalRequest));
        });
      });
    }

    // 3. 开始刷新 Token
    this.isRefreshing = true;
    try {
      const userStore = useUserStore();
      await userStore.refreshAccessToken();

      console.log("✅ [Token 刷新] 刷新成功，重试队列中的请求");
      
      // 4. 刷新成功，遍历队列重试
      this.pendingRequests.forEach((cb) => cb());
      this.pendingRequests = [];

      // 5. 重试当前请求
      const newToken = Cookies.get("access_token");
      if (newToken && originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
      }
      return this.instance(originalRequest);
    } catch (refreshError) {
      // 6. 刷新失败，清空队列并跳转登录
      console.error("❌ [Token 刷新] 刷新失败，清空队列", refreshError);
      this.pendingRequests = [];
      this.handleUnauthorized("登录态已失效，请重新登录");
    } finally {
      this.isRefreshing = false;
    }
  }

  private handleUnauthorized(msg: string) {
    // 防抖：如果已经在处理，直接返回，避免重复弹窗和跳转
    if (this.isHandling401) return;
    this.isHandling401 = true;

    // 如果已经在登录页，不再重复跳转
    if (window.location.pathname === "/login") {
      this.isHandling401 = false;
      return;
    }

    // 🔴 核心修复：如果路由守卫正在处理，完全跳过（不重置状态、不跳转）
    // 由守卫的 catch 块统一处理 resetState() 和跳转，避免双重处理
    if (this.guardActive) {
      console.warn(
        "🟡 [认证拦截] 路由守卫激活中，跳过所有处理，交由守卫统一处理",
      );
      this.isHandling401 = false;
      return;
    }

    console.error("[认证拦截]", msg);
    const userStore = useUserStore();
    userStore.resetState(); // resetState() 内部已删除 Cookie 和 sessionStorage，无需重复调用

    // 延迟跳转
    setTimeout(() => {
      this.isHandling401 = false;
      router.push("/login");
    }, 500);
  }

  /** 🔴 路由守卫激活/停用标志（防止守卫内 API 的 401 触发双重跳转） */
  setGuardActive(active: boolean) {
    this.guardActive = active;
  }

  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.get(url, config);
  }

  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.post(url, data, config);
  }

  put<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    return this.instance.put(url, data, config);
  }

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.instance.delete(url, config);
  }
}

export const request = new RequestClient({});
export default request;
