<template>
  <div
    class="app-layout"
    :class="{ 'sidebar-collapsed': appStore.sidebarCollapsed }"
  >
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <img src="/vite.svg" alt="Logo" class="logo-img" />
        <span v-show="!appStore.sidebarCollapsed" class="logo-text"
          >AI Cloud Plus</span
        >
      </div>
      <el-scrollbar>
        <el-menu
          :default-active="activeMenu"
          :collapse="appStore.sidebarCollapsed"
          :unique-opened="true"
          background-color="transparent"
          text-color="#334155"
          active-text-color="#0ea5e9"
          @select="handleMenuSelect"
        >
          <sidebar-item
            v-for="menu in permissionStore.menus"
            :key="menu.id"
            :menu="menu"
          />
        </el-menu>
      </el-scrollbar>
    </aside>

    <!-- 主内容区 -->
    <div class="main-container">
      <!-- 顶栏 -->
      <header class="app-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="appStore.toggleSidebar">
            <Fold v-if="!appStore.sidebarCollapsed" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item
              v-for="item in breadcrumbs"
              :key="item.path"
              :to="item.path"
            >
              {{ item.meta?.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click" @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" :src="userStore.avatar || undefined">
                {{ userStore.nickname?.charAt(0) || "U" }}
              </el-avatar>
              <span class="username">{{ userStore.nickname || "用户" }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item divided command="logout"
                  >退出登录</el-dropdown-item
                >
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </header>

      <!-- 内容区 -->
      <main class="app-main">
        <router-view v-slot="{ Component }">
          <transition name="fade-slide" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { usePermissionStore } from "@/stores/permission";
import { useAppStore } from "@/stores/app";
import { Fold, Expand, ArrowDown } from "@element-plus/icons-vue";
import SidebarItem from "./components/SidebarItem.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const permissionStore = usePermissionStore();
const appStore = useAppStore();

// 当前激活菜单（确保路径带 /）
const activeMenu = computed(() => {
  const path = route.path;
  return path.startsWith("/") ? path : `/${path}`;
});

const breadcrumbs = computed(() =>
  route.matched.filter((item) => item.meta?.title),
);

// 标准菜单点击处理
function handleMenuSelect(index: string) {
  if (index && route.path !== index) {
    router.push(index);
  }
}

function handleCommand(command: string) {
  if (command === "logout") userStore.logout();
}
</script>

<style scoped lang="scss">
.app-layout {
  display: flex;
  height: 100vh;
  width: 100%;
  background: #f0f2f5;

  .sidebar {
    width: 220px;
    background: #fff;
    transition: width 0.3s;
    display: flex;
    flex-direction: column;
    border-right: 1px solid #e8e8e8;

    .sidebar-logo {
      height: 64px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      border-bottom: 1px solid #e8e8e8;

      .logo-img {
        width: 32px;
        height: 32px;
      }
      .logo-text {
        margin-left: 12px;
        font-size: 18px;
        font-weight: 600;
        white-space: nowrap;
      }
    }

    :deep(.el-menu) {
      border-right: none;
      .el-menu-item,
      .el-sub-menu__title {
        height: 44px;
        line-height: 44px;
        margin: 4px 8px;
        border-radius: 8px;
        &:hover {
          background: rgba(14, 165, 233, 0.06);
        }
        &.is-active {
          background: rgba(14, 165, 233, 0.1);
          color: #0ea5e9;
          font-weight: 600;
        }
      }
    }
  }

  .main-container {
    flex: 1;
    display: flex;
    flex-direction: column;

    .app-header {
      height: 64px;
      background: #fff;
      border-bottom: 1px solid #e8e8e8;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;

      .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
        .collapse-btn {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          &:hover {
            color: #0ea5e9;
            background: #f0f9ff;
          }
        }
      }

      .user-info {
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;
        padding: 4px 12px;
        border-radius: 6px;
        &:hover {
          background: #f5f5f5;
        }
        .username {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .app-main {
      flex: 1;
      padding: 0;
      overflow-y: auto;
      width: 100%;
    }
  }
}

.sidebar-collapsed .sidebar {
  width: 64px;
}

.fade-slide-enter-active {
  transition: all 0.3s ease;
}
.fade-slide-leave-active {
  transition: all 0.2s ease;
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
