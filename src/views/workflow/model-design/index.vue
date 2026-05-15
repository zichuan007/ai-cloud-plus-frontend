<template>
  <div class="model-designer-page">
    <!-- 顶部导航栏 -->
    <div class="designer-header">
      <div class="header-left">
        <el-button :icon="ArrowLeft" circle @click="goBack" title="返回列表" />
        <span class="model-name">{{ route.query.name || "流程设计" }}</span>
        <el-tag v-if="route.query.id" type="info" size="small"
          >ID: {{ route.query.id }}</el-tag
        >
      </div>
      <div class="header-right">
        <el-button
          type="primary"
          :icon="Check"
          :loading="saving"
          @click="handleSave"
        >
          保存模型
        </el-button>
      </div>
    </div>

    <!-- BPMN 设计器 -->
    <div class="designer-container">
      <BpmnDesigner
        ref="designerRef"
        :model-id="route.query.id as string"
        :model-name="route.query.name as string"
        :initial-xml="initialXml"
        @save="handleDesignerSave"
        @change="handleChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, defineAsyncComponent } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, Check } from "@element-plus/icons-vue";
import { getModelXml, saveModelXml } from "@/api/workflow";

// 懒加载 BPMN 设计器（约 1MB，按需加载）
const BpmnDesigner = defineAsyncComponent(
  () => import("@/components/bpmn/BpmnDesigner.vue"),
);

const route = useRoute();
const router = useRouter();
const designerRef = ref<InstanceType<typeof BpmnDesigner>>();
const saving = ref(false);
const initialXml = ref("");
const hasChanges = ref(false);

// 获取模型 XML
async function loadModelXml() {
  const modelId = route.query.id as string;
  if (!modelId) return;

  try {
    const xml = await getModelXml(modelId);
    initialXml.value = xml || "";
  } catch (error: any) {
    console.error("加载模型失败:", error);
  }
}

// 保存模型
async function handleSave() {
  if (!designerRef.value) return;

  saving.value = true;
  try {
    await designerRef.value.saveXml();
    ElMessage.success("保存成功");
    hasChanges.value = false;
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`);
  } finally {
    saving.value = false;
  }
}

// 设计器保存回调
async function handleDesignerSave(xml: string) {
  const modelId = route.query.id as string;
  if (!modelId) return;

  saving.value = true;
  try {
    await saveModelXml(modelId, xml);
    ElMessage.success("保存成功");
    hasChanges.value = false;
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`);
  } finally {
    saving.value = false;
  }
}

// 变更回调
function handleChange() {
  hasChanges.value = true;
}

// 返回列表
function goBack() {
  if (hasChanges.value) {
    ElMessage.warning("模型尚未保存，确定要离开吗？");
  }
  router.push("/workflow/models");
}

onMounted(() => {
  loadModelXml();
});
</script>

<style scoped lang="scss">
.model-designer-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #fff;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 56px;
  padding: 0 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 100;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12px;

    .model-name {
      font-size: 18px;
      font-weight: 600;
    }
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.designer-container {
  flex: 1;
  overflow: hidden;
}
</style>
