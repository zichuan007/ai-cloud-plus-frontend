<template>
  <!-- 仅渲染可见且非按钮的菜单（visible !== 0 表示可见） -->
  <template v-if="menu.visible !== 0 && menu.type !== 3">
    <!-- 判断是否有可见的子菜单（过滤掉按钮 type=3） -->
    <template v-if="hasVisibleChildren">
      <!-- 有子菜单 -> 渲染为折叠菜单 -->
      <!-- 使用计算出的 fullPath 作为 index，确保路由跳转正确 -->
      <el-sub-menu :index="fullPath">
        <template #title>
          <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
          <span>{{ menu.name }}</span>
        </template>
        <!-- 递归：将当前的 fullPath 作为子菜单的 parentPath -->
        <sidebar-item
          v-for="child in menu.children"
          :key="child.id"
          :menu="child"
          :parent-path="fullPath"
        />
      </el-sub-menu>
    </template>

    <!-- 无子菜单 -> 渲染为普通菜单项 -->
    <template v-else>
      <el-menu-item :index="fullPath">
        <el-icon v-if="menu.icon"><component :is="menu.icon" /></el-icon>
        <template #title>{{ menu.name }}</template>
      </el-menu-item>
    </template>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { MenuTree } from "@/types";

const props = defineProps<{
  menu: MenuTree;
  parentPath?: string; // 接收父级路径
}>();

// 核心逻辑：只有当子节点中包含“非按钮”且“可见”的菜单时，才认为有子菜单
const hasVisibleChildren = computed(() => {
  return (
    props.menu.children &&
    props.menu.children.some((child) => child.visible !== 0 && child.type !== 3)
  );
});

// 动态计算完整路径
// 逻辑：父路径 + '/' + 当前路径，不再依赖修改原始数据
const fullPath = computed(() => {
  const parent = props.parentPath || "";
  const current = props.menu.path || "";

  // 如果是根节点（没有父路径），直接补全前导 /
  if (!parent) {
    return current.startsWith("/") ? current : "/" + current;
  }

  // 拼接路径：确保父路径以 / 结尾，当前路径不以 / 开头
  // 例如 parent="/rbac", current="roles" -> "/rbac/roles"
  const cleanParent = parent.endsWith("/") ? parent : parent + "/";
  const cleanCurrent = current.startsWith("/") ? current.slice(1) : current;

  return cleanParent + cleanCurrent;
});
</script>
