/// <reference types="vite/client" />

declare module "path-browserify" {
  export function resolve(...paths: string[]): string;
}

declare module "*.vue" {
  import type { DefineComponent } from "vue";
  const component: DefineComponent<{}, {}, any>;
  export default component;
}

declare module "bpmn-js/lib/Modeler" {
  import BpmnModeler from "bpmn-js";
  export default BpmnModeler;
}

declare module "bpmn-js/lib/Viewer" {
  import BpmnViewer from "bpmn-js";
  export default BpmnViewer;
}

declare module "bpmn-js-properties-panel" {
  export const BpmnPropertiesPanelModule: any;
  export const BpmnPropertiesProviderModule: any;
}

declare module "camunda-bpmn-moddle/resources/camunda" {
  const descriptor: any;
  export default descriptor;
}

declare module "diagram-js-minimap" {
  const MinimapModule: any;
  export default MinimapModule;
}

declare module "bpmn-js-token-simulation" {
  const TokenSimulationModule: any;
  export default TokenSimulationModule;
}

interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_GATEWAY_URL: string;
  readonly VITE_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
