import { ref, reactive } from "vue";
import type { Ref } from "vue";

/**
 * 通用表格 Hook
 * 用于处理分页、加载、查询、重置等通用逻辑
 *
 * @param queryFn 查询函数
 * @param initialParams 初始查询参数（除 current/size 外的业务参数）
 * @returns 表格相关状态和方法
 */
export function useTable<T = any>(
  queryFn: (params: any) => Promise<{ records: T[]; total: number }>,
  initialParams: Record<string, any> = {},
) {
  const tableData = ref<T[]>([]) as Ref<T[]>;
  const loading = ref(false);
  const total = ref(0);
  const queryParams = reactive<Record<string, any>>({
    current: 1,
    size: 10,
    ...initialParams,
  });

  const fetchData = async () => {
    loading.value = true;
    try {
      const res = await queryFn(queryParams);
      tableData.value = res.records || [];
      total.value = res.total || 0;
    } catch (error) {
      console.error("Fetch table data failed:", error);
    } finally {
      loading.value = false;
    }
  };

  const handleQuery = () => {
    queryParams.current = 1;
    fetchData();
  };

  const handleReset = () => {
    Object.assign(queryParams, initialParams, { current: 1, size: 10 });
    fetchData();
  };

  const handleSizeChange = (size: number) => {
    queryParams.size = size;
    queryParams.current = 1;
    fetchData();
  };

  const handleCurrentChange = (current: number) => {
    queryParams.current = current;
    fetchData();
  };

  return {
    tableData,
    loading,
    total,
    queryParams,
    fetchData,
    handleQuery,
    handleReset,
    handleSizeChange,
    handleCurrentChange,
  };
}
