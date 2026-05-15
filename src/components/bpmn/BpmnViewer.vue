<template>
  <div class="bpmn-viewer" ref="viewerContainer">
    <div class="viewer-canvas" ref="canvasRef" />
    <div class="viewer-controls" v-if="showControls">
      <el-button-group>
        <el-button :icon="ZoomIn" @click="zoomIn" size="small" />
        <el-button @click="resetZoom" size="small"
          >{{ Math.round(zoomLevel * 100) }}%</el-button
        >
        <el-button :icon="ZoomOut" @click="zoomOut" size="small" />
      </el-button-group>
      <el-button :icon="FullScreen" @click="toggleFullscreen" size="small" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { ZoomIn, ZoomOut, FullScreen } from "@element-plus/icons-vue";
import BpmnViewerLib from "bpmn-js/lib/Viewer";
import TokenSimulationModule from "bpmn-js-token-simulation";

// bpmn-js 样式
import "bpmn-js/dist/assets/diagram-js.css";
import "bpmn-js/dist/assets/bpmn-js.css";
import "bpmn-js/dist/assets/bpmn-font/css/bpmn.css";
import "bpmn-js-token-simulation/assets/css/bpmn-js-token-simulation.css";

interface Props {
  xml?: string;
  diagramUrl?: string;
  showControls?: boolean;
  highlightNodes?: string[];
  highlightColor?: string;
  enableSimulation?: boolean; // 新增：是否开启模拟模式
}

const props = withDefaults(defineProps<Props>(), {
  xml: "",
  diagramUrl: "",
  showControls: true,
  highlightNodes: () => [],
  highlightColor: "#52c41a",
  enableSimulation: false,
});

const viewerContainer = ref<HTMLElement>();
const canvasRef = ref<HTMLElement>();
const zoomLevel = ref(1);

let viewer: InstanceType<typeof BpmnViewerLib> | null = null;

onMounted(async () => {
  await initViewer();
});

onBeforeUnmount(() => {
  if (viewer) {
    viewer.destroy();
  }
});

watch(
  () => props.xml,
  async (newXml) => {
    if (newXml && viewer) {
      try {
        await viewer.importXML(newXml);
        viewer.get("canvas").zoom("fit-viewport");
        applyHighlight();
      } catch (error) {
        console.error("加载 BPMN 失败:", error);
      }
    }
  },
);

watch(
  () => props.highlightNodes,
  () => {
    applyHighlight();
  },
  { deep: true },
);

async function initViewer() {
  try {
    const modules = props.enableSimulation ? [TokenSimulationModule] : [];

    viewer = new BpmnViewerLib({
      container: canvasRef.value,
      additionalModules: modules,
    });

    viewer.on("canvas.viewbox.changed", () => {
      const viewbox = viewer.get("canvas").viewbox();
      zoomLevel.value = viewbox.scale || 1;
    });

    if (props.xml) {
      await viewer.importXML(props.xml);
      viewer.get("canvas").zoom("fit-viewport");
      applyHighlight();
    }
  } catch (error) {
    console.error("初始化查看器失败:", error);
  }
}

function applyHighlight() {
  if (!viewer || !props.highlightNodes?.length) return;

  const canvas = viewer.get("canvas");
  const elementRegistry = viewer.get("elementRegistry");

  // 先清除所有高亮
  elementRegistry.getAll().forEach((element: any) => {
    canvas.removeMarker(element, "bpmn-element-highlight");
  });

  // 应用新的高亮
  props.highlightNodes.forEach((nodeId: string) => {
    const element = elementRegistry.get(nodeId);
    if (element) {
      canvas.addMarker(element, "bpmn-element-highlight");
    }
  });
}

function zoomIn() {
  if (viewer) {
    const canvas = viewer.get("canvas");
    canvas.zoom(canvas.zoom() + 0.1);
  }
}

function zoomOut() {
  if (viewer) {
    const canvas = viewer.get("canvas");
    canvas.zoom(canvas.zoom() - 0.1);
  }
}

function resetZoom() {
  if (viewer) {
    viewer.get("canvas").zoom("fit-viewport");
  }
}

function toggleFullscreen() {
  if (viewerContainer.value) {
    if (!document.fullscreenElement) {
      viewerContainer.value.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  }
}

defineExpose({
  getViewer: () => viewer,
  importXml: async (xml: string) => {
    if (viewer) {
      await viewer.importXML(xml);
      viewer.get("canvas").zoom("fit-viewport");
    }
  },
});
</script>

<style scoped lang="scss">
.bpmn-viewer {
  position: relative;
  width: 100%;
  height: 100%;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;

  .viewer-canvas {
    width: 100%;
    height: 100%;

    :deep(.bjs-powered-by) {
      display: none;
    }
  }

  .viewer-controls {
    position: absolute;
    top: 12px;
    right: 12px;
    display: flex;
    gap: 8px;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
}

:deep(.bpmn-element-highlight) {
  .djs-visual > :first-child {
    stroke: #52c41a !important;
    stroke-width: 3px !important;
    fill: rgba(82, 196, 26, 0.1) !important;
  }
}
</style>
