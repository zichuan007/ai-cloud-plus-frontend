<template>
  <div
    class="bpmn-designer"
    ref="designerContainer"
    @drop="handleDrop"
    @dragover.prevent
    @dragenter.prevent
    @dragleave="handleDragLeave"
  >
    <!-- 拖拽上传提示 -->
    <div class="drop-overlay" v-show="isDragging">
      <div class="drop-content">
        <el-icon :size="64" color="#1890ff"><Upload /></el-icon>
        <p>释放文件以导入 BPMN 流程图</p>
        <span class="drop-hint">支持 .bpmn, .xml 格式</span>
      </div>
    </div>

    <!-- 工具栏 -->
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <el-button-group>
          <el-button :icon="Plus" @click="createNewDiagram" title="新建"
            >新建</el-button
          >
          <el-button :icon="FolderOpened" @click="triggerOpenFile" title="打开"
            >打开</el-button
          >
          <input
            ref="fileInput"
            type="file"
            accept=".bpmn,.xml"
            style="display: none"
            @change="handleOpenFile"
          />
        </el-button-group>
        <span class="toolbar-separator">|</span>
        <el-button-group>
          <el-dropdown trigger="click" @command="handleSetColor">
            <el-button :icon="Brush" title="设置颜色">
              颜色<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="#FF0000">
                  <span class="color-item"
                    ><span class="color-box" style="background: #ff0000"></span
                    >红色</span
                  >
                </el-dropdown-item>
                <el-dropdown-item command="#FFA500">
                  <span class="color-item"
                    ><span class="color-box" style="background: #ffa500"></span
                    >橙色</span
                  >
                </el-dropdown-item>
                <el-dropdown-item command="#FFFF00">
                  <span class="color-item"
                    ><span class="color-box" style="background: #ffff00"></span
                    >黄色</span
                  >
                </el-dropdown-item>
                <el-dropdown-item command="#00FF00">
                  <span class="color-item"
                    ><span class="color-box" style="background: #00ff00"></span
                    >绿色</span
                  >
                </el-dropdown-item>
                <el-dropdown-item command="#0000FF">
                  <span class="color-item"
                    ><span class="color-box" style="background: #0000ff"></span
                    >蓝色</span
                  >
                </el-dropdown-item>
                <el-dropdown-item command="#800080">
                  <span class="color-item"
                    ><span class="color-box" style="background: #800080"></span
                    >紫色</span
                  >
                </el-dropdown-item>
                <el-dropdown-item command="">
                  <span class="color-item"
                    ><span
                      class="color-box"
                      style="background: #fff; border: 1px solid #ccc"
                    ></span
                    >清除颜色</span
                  >
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-button-group>
        <span class="toolbar-separator">|</span>
        <el-button-group>
          <el-button
            :icon="Grid"
            @click="templateVisible = true"
            title="模板库"
          >
            模板
          </el-button>
          <el-button
            :icon="QuestionFilled"
            @click="shortcutVisible = true"
            title="快捷键"
          >
            快捷键
          </el-button>
        </el-button-group>
        <span class="toolbar-separator">|</span>
        <el-button-group>
          <el-button :icon="Download" @click="downloadDiagram" title="下载 BPMN"
            >下载</el-button
          >
          <el-button :icon="Picture" @click="downloadAsSvg" title="下载 SVG"
            >导出 SVG</el-button
          >
        </el-button-group>
        <span class="toolbar-separator">|</span>
        <el-button-group>
          <el-button
            :icon="Back"
            @click="undo"
            :disabled="!canUndo"
            title="撤销"
          />
          <el-button
            :icon="Right"
            @click="redo"
            :disabled="!canRedo"
            title="重做"
          />
        </el-button-group>
        <span class="toolbar-separator">|</span>
        <el-button-group>
          <el-button :icon="ZoomIn" @click="zoomIn" title="放大" />
          <el-button @click="resetZoom" title="重置缩放"
            >{{ Math.round(zoomLevel * 100) }}%</el-button
          >
          <el-button :icon="ZoomOut" @click="zoomOut" title="缩小" />
        </el-button-group>
        <span class="toolbar-separator">|</span>
        <el-button
          type="primary"
          :icon="Check"
          @click="handleSave"
          :loading="saving"
          >保存</el-button
        >
      </div>
    </div>

    <!-- 设计器主体 -->
    <div class="designer-body">
      <!-- 画布 -->
      <div class="designer-canvas" ref="canvasRef" />

      <!-- 属性面板 -->
      <div class="properties-panel" v-if="showProperties">
        <div class="panel-header">
          <span>属性面板</span>
          <el-icon class="close-btn" @click="showProperties = false"
            ><Close
          /></el-icon>
        </div>
        <div class="panel-content" id="bpmn-properties-panel" />
      </div>
    </div>

    <!-- 底部状态栏 -->
    <div class="designer-status">
      <span class="status-item">
        <el-icon><InfoFilled /></el-icon>
        {{ statusText }}
      </span>
      <span class="status-item" v-if="selectedElement">
        选中: {{ selectedElement.name || selectedElement.id }} ({{
          selectedElement.type
        }})
      </span>
    </div>

    <!-- 模板库对话框 -->
    <el-dialog
      v-model="templateVisible"
      title="流程模板库"
      width="800px"
      destroy-on-close
    >
      <div class="template-grid">
        <div
          v-for="tpl in templates"
          :key="tpl.key"
          class="template-card"
          @click="loadTemplate(tpl)"
        >
          <div class="template-icon">
            <el-icon :size="32"><Document /></el-icon>
          </div>
          <div class="template-info">
            <h4>{{ tpl.name }}</h4>
            <p>{{ tpl.description }}</p>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 快捷键提示对话框 -->
    <el-dialog
      v-model="shortcutVisible"
      title="快捷键"
      width="500px"
      destroy-on-close
    >
      <el-table :data="shortcuts" border stripe>
        <el-table-column prop="key" label="快捷键" width="150" align="center" />
        <el-table-column prop="desc" label="功能说明" align="center" />
      </el-table>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import {
  Plus,
  FolderOpened,
  Download,
  Picture,
  Back,
  Right,
  ZoomIn,
  ZoomOut,
  Check,
  Close,
  InfoFilled,
  Brush,
  ArrowDown,
  Upload,
  Grid,
  QuestionFilled,
  Document,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import BpmnModeler from "bpmn-js/lib/Modeler";
import {
  BpmnPropertiesPanelModule,
  BpmnPropertiesProviderModule,
} from "bpmn-js-properties-panel";
import camundaModdleDescriptor from "camunda-bpmn-moddle/resources/camunda";
import MinimapModule from "diagram-js-minimap";
import TokenSimulationModule from "bpmn-js-token-simulation";
import { getModelXml } from "@/api/workflow";

// bpmn-js 样式
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "diagram-js-minimap/assets/diagram-js-minimap.css";

interface Props {
  initialXml?: string;
  modelId?: string;
  modelName?: string;
}

const props = withDefaults(defineProps<Props>(), {
  initialXml: "",
  modelId: "",
  modelName: "未命名流程",
});

const emit = defineEmits<{
  save: [xml: string];
  change: [context: any];
}>();

const designerContainer = ref<HTMLElement>();
const canvasRef = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();
const saving = ref(false);
const canUndo = ref(false);
const canRedo = ref(false);
const zoomLevel = ref(1);
const showProperties = ref(true);
const statusText = ref("就绪");
const selectedElement = ref<any>(null);
const isDragging = ref(false);
const templateVisible = ref(false);
const shortcutVisible = ref(false);

let modeler: any = null;

// 流程模板库
const templates = [
  {
    key: "leave_approval",
    name: "请假审批",
    description: "标准的员工请假审批流程，包含部门经理和HR审批节点",
  },
  {
    key: "expense_reimbursement",
    name: "费用报销",
    description: "员工费用报销流程，支持多级审批和财务打款",
  },
  {
    key: "contract_review",
    name: "合同评审",
    description: "合同起草、法务评审、管理层审批的标准流程",
  },
  {
    key: "purchase_request",
    name: "采购申请",
    description: "办公用品、设备等物资采购申请与审批流程",
  },
  {
    key: "onboarding",
    name: "入职办理",
    description: "新员工入职流程，包含IT设备、账号开通、培训等环节",
  },
  {
    key: "blank",
    name: "空白流程",
    description: "从零开始自定义流程设计",
  },
];

// 快捷键列表
const shortcuts = [
  { key: "Ctrl + S", desc: "保存当前流程" },
  { key: "Ctrl + Z", desc: "撤销上一步操作" },
  { key: "Ctrl + Y / Ctrl + Shift + Z", desc: "重做上一步操作" },
  { key: "Delete / Backspace", desc: "删除选中的元素" },
  { key: "Ctrl + C", desc: "复制选中的元素" },
  { key: "Ctrl + V", desc: "粘贴复制的元素" },
  { key: "Ctrl + A", desc: "全选所有元素" },
  { key: "Scroll / 鼠标滚轮", desc: "画布上下滚动" },
  { key: "Shift + 鼠标滚轮", desc: "画布左右滚动" },
  { key: "Ctrl + 鼠标滚轮", desc: "画布缩放" },
  { key: "拖拽文件到画布", desc: "导入外部 BPMN/XML 文件" },
];

// 默认空白 BPMN 模板
const defaultBpmnXml = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
  id="Definitions_1"
  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="true">
    <bpmn:startEvent id="StartEvent_1" name="开始" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="BPMNShape_StartEvent_1" bpmnElement="StartEvent_1">
        <dc:Bounds x="152" y="102" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="158" y="145" width="24" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`;

onMounted(async () => {
  await initModeler();

  // 添加拖拽事件监听
  const container = designerContainer.value;
  if (container) {
    container.addEventListener("dragenter", handleDragEnter);
    container.addEventListener("dragover", handleDragOver);
  }
});

onBeforeUnmount(() => {
  if (modeler) {
    modeler.destroy();
  }

  const container = designerContainer.value;
  if (container) {
    container.removeEventListener("dragenter", handleDragEnter);
    container.removeEventListener("dragover", handleDragOver);
  }
});

async function initModeler() {
  try {
    modeler = new BpmnModeler({
      container: canvasRef.value,
      propertiesPanel: {
        parent: "#bpmn-properties-panel",
      },
      additionalModules: [
        BpmnPropertiesPanelModule,
        BpmnPropertiesProviderModule,
        MinimapModule,
        TokenSimulationModule,
      ],
      moddleExtensions: {
        camunda: camundaModdleDescriptor,
      },
      minimap: {
        open: true,
      },
    });

    // 监听命令栈变化
    modeler.on("commandStack.changed", () => {
      updateUndoRedoState();
      emit("change", { type: "commandStack" });
    });

    // 监听元素选择
    modeler.on("selection.changed", (event: any) => {
      selectedElement.value = event.newSelection?.[0] || null;
      updateStatus();
    });

    // 监听缩放
    modeler.on("canvas.viewbox.changed", () => {
      const viewbox = modeler.get("canvas").viewbox();
      zoomLevel.value = viewbox.scale || 1;
    });

    // 加载初始内容
    const xmlToLoad = props.initialXml || defaultBpmnXml;
    await modeler.importXML(xmlToLoad);
    modeler.get("canvas").zoom("fit-viewport");

    updateUndoRedoState();
    updateStatus();

    ElMessage.success("流程设计器加载成功");
  } catch (error: any) {
    console.error("初始化设计器失败:", error);
    ElMessage.error(`初始化设计器失败: ${error.message}`);
  }
}

function updateUndoRedoState() {
  if (!modeler) return;
  const commandStack = modeler.get("commandStack");
  canUndo.value = commandStack.canUndo();
  canRedo.value = commandStack.canRedo();
}

function updateStatus() {
  if (!modeler) return;
  const elementRegistry = modeler.get("elementRegistry");
  const elements = elementRegistry.getAll();
  const taskCount = elements.filter(
    (e: any) => e.type === "bpmn:Task" || e.type === "bpmn:UserTask",
  ).length;
  const gatewayCount = elements.filter(
    (e: any) =>
      e.type === "bpmn:ExclusiveGateway" || e.type === "bpmn:ParallelGateway",
  ).length;

  statusText.value = `元素: ${elements.length} | 任务: ${taskCount} | 网关: ${gatewayCount}`;
}

function createNewDiagram() {
  if (modeler) {
    modeler.importXML(defaultBpmnXml).then(() => {
      modeler.get("canvas").zoom("fit-viewport");
      ElMessage.success("已创建新流程");
    });
  }
}

async function loadTemplate(tpl: any) {
  try {
    if (tpl.key === "blank") {
      createNewDiagram();
    } else {
      // 从后端获取模板 XML
      const res = await getModelXml(tpl.key);
      if (res.data) {
        await modeler.importXML(res.data);
        modeler.get("canvas").zoom("fit-viewport");
      } else {
        createNewDiagram();
      }
    }
    ElMessage.success(`已加载模板: ${tpl.name}`);
  } catch (error: any) {
    console.error("加载模板失败:", error);
    createNewDiagram();
  }
  templateVisible.value = false;
}

function triggerOpenFile() {
  fileInput.value?.click();
}

function handleDragEnter(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;
}

function handleDragOver(event: DragEvent) {
  event.preventDefault();
}

async function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file.name.endsWith(".bpmn") && !file.name.endsWith(".xml")) {
    ElMessage.error("仅支持 .bpmn 和 .xml 格式文件");
    return;
  }

  try {
    const text = await file.text();
    await modeler.importXML(text);
    modeler.get("canvas").zoom("fit-viewport");
    ElMessage.success(`已导入文件: ${file.name}`);
    updateStatus();
  } catch (error: any) {
    ElMessage.error(`导入失败: ${error.message}`);
  }
}

async function handleOpenFile(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    await modeler.importXML(text);
    modeler.get("canvas").zoom("fit-viewport");
    ElMessage.success(`已打开文件: ${file.name}`);
  } catch (error: any) {
    ElMessage.error(`打开文件失败: ${error.message}`);
  }

  // 重置 input 以便重复选择同一文件
  target.value = "";
}

async function handleSave() {
  if (!modeler) return;

  saving.value = true;
  try {
    const { xml } = await modeler.saveXML({ format: true });
    if (xml) {
      emit("save", xml);
      ElMessage.success("流程保存成功");
    }
  } catch (error: any) {
    ElMessage.error(`保存失败: ${error.message}`);
  } finally {
    saving.value = false;
  }
}

async function downloadDiagram() {
  if (!modeler) return;

  try {
    const { xml } = await modeler.saveXML({ format: true });
    if (xml) {
      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${props.modelName || "process"}.bpmn`;
      a.click();
      URL.revokeObjectURL(url);
      ElMessage.success("BPMN 文件已下载");
    }
  } catch (error: any) {
    ElMessage.error(`下载失败: ${error.message}`);
  }
}

async function downloadAsSvg() {
  if (!modeler) return;

  try {
    const { svg } = await modeler.saveSVG();
    if (svg) {
      const blob = new Blob([svg], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${props.modelName || "process"}.svg`;
      a.click();
      URL.revokeObjectURL(url);
      ElMessage.success("SVG 文件已下载");
    }
  } catch (error: any) {
    ElMessage.error(`导出 SVG 失败: ${error.message}`);
  }
}

function undo() {
  if (modeler) {
    modeler.get("commandStack").undo();
  }
}

function redo() {
  if (modeler) {
    modeler.get("commandStack").redo();
  }
}

function zoomIn() {
  if (modeler) {
    const canvas = modeler.get("canvas");
    canvas.zoom(canvas.zoom() + 0.1);
  }
}

function zoomOut() {
  if (modeler) {
    const canvas = modeler.get("canvas");
    canvas.zoom(canvas.zoom() - 0.1);
  }
}

function resetZoom() {
  if (modeler) {
    modeler.get("canvas").zoom("fit-viewport");
  }
}

function handleSetColor(color: string) {
  if (!modeler) return;

  const selection = modeler.get("selection");
  const modeling = modeler.get("modeling");
  const selected = selection.get();

  if (selected.length === 0) {
    ElMessage.warning("请先选择要设置颜色的元素");
    return;
  }

  selected.forEach((element: any) => {
    modeling.setColor([element], {
      stroke: color || null,
      fill: color || null,
    });
  });

  ElMessage.success(color ? `已设置颜色` : "已清除颜色");
}

// 暴露方法供父组件调用
defineExpose({
  getModeler: () => modeler,
  getXml: async () => {
    if (!modeler) return "";
    const { xml } = await modeler.saveXML({ format: true });
    return xml || "";
  },
  importXml: async (xml: string) => {
    if (modeler) {
      await modeler.importXML(xml);
      modeler.get("canvas").zoom("fit-viewport");
    }
  },
  saveXml: async () => {
    if (!modeler) return "";
    const { xml } = await modeler.saveXML({ format: true });
    const resultXml = xml || "";
    // 触发保存事件
    emit("save", resultXml);
    return resultXml;
  },
});
</script>

<style scoped lang="scss">
.bpmn-designer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
  position: relative;

  .designer-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px;
    background: #fff;
    border-bottom: 1px solid #e8e8e8;

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-separator {
      color: #d9d9d9;
      margin: 0 4px;
    }
  }

  .designer-body {
    flex: 1;
    display: flex;
    overflow: hidden;

    .designer-canvas {
      flex: 1;
      background: #fff;
      position: relative;

      :deep(.bjs-powered-by) {
        display: none;
      }

      :deep(.djs-palette) {
        background: #fff;
        border: 1px solid #e8e8e8;
        border-radius: 4px;
      }

      :deep(.djs-context-pad) {
        .entry {
          &:hover {
            background: #e6f7ff;
          }
        }
      }
    }

    .properties-panel {
      width: 300px;
      background: #fff;
      border-left: 1px solid #e8e8e8;
      display: flex;
      flex-direction: column;

      .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 16px;
        border-bottom: 1px solid #e8e8e8;
        font-weight: 500;

        .close-btn {
          cursor: pointer;
          &:hover {
            color: #1890ff;
          }
        }
      }

      .panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 8px;
      }
    }
  }

  .designer-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 6px 12px;
    background: #fafafa;
    border-top: 1px solid #e8e8e8;
    font-size: 12px;
    color: #666;

    .status-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }
  }
}

.color-item {
  display: flex;
  align-items: center;
  gap: 8px;

  .color-box {
    display: inline-block;
    width: 16px;
    height: 16px;
    border-radius: 2px;
  }
}

.drop-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(24, 144, 255, 0.1);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;

  .drop-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 16px;
    border: 2px dashed #1890ff;
    box-shadow: 0 8px 32px rgba(24, 144, 255, 0.2);

    p {
      font-size: 18px;
      font-weight: 500;
      color: #333;
      margin: 0;
    }

    .drop-hint {
      font-size: 13px;
      color: #666;
    }
  }
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;

  .template-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      border-color: #1890ff;
      background: #e6f7ff;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .template-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      background: #1890ff;
      color: #fff;
      border-radius: 8px;
      flex-shrink: 0;
    }

    .template-info {
      flex: 1;
      min-width: 0;

      h4 {
        margin: 0 0 4px 0;
        font-size: 14px;
        font-weight: 500;
        color: #333;
      }

      p {
        margin: 0;
        font-size: 12px;
        color: #666;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
    }
  }
}
</style>
