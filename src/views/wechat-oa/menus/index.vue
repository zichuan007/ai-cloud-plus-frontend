<template>
  <div class="wechat-oa-menus">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>自定义菜单</span>
          <div>
            <el-select v-model="accountId" placeholder="请选择公众号" style="width: 200px; margin-right: 12px" @change="handleAccountChange">
              <el-option
                v-for="item in accountList"
                :key="item.id"
                :label="item.name"
                :value="item.id"
              />
            </el-select>
            <el-button @click="handleReset">重置</el-button>
            <el-button type="primary" @click="handleSave">保存</el-button>
            <el-button type="success" @click="handlePublish">发布到微信</el-button>
          </div>
        </div>
      </template>

      <div class="menu-editor" v-loading="loading">
        <!-- 手机预览 -->
        <div class="phone-preview">
          <div class="phone-frame">
            <div class="phone-header">微信公众号</div>
            <div class="phone-content">
              <el-empty v-if="menuList.length === 0" description="点击下方添加菜单" :image-size="80" />
            </div>
            <div class="phone-footer">
              <div
                v-for="(menu, index) in firstLevelMenus"
                :key="menu.id || index"
                class="menu-item"
                :class="{ active: activeMenuId === menu.id }"
                @click="selectMenu(menu)"
              >
                <span>{{ menu.name || '菜单' + (index + 1) }}</span>
                <el-icon class="delete-icon" @click.stop="deleteMenu(menu.id)"><Delete /></el-icon>
              </div>
              <div v-if="firstLevelMenus.length < 3" class="menu-item add-btn" @click="addFirstLevelMenu">
                <el-icon><Plus /></el-icon>
              </div>
            </div>
          </div>
        </div>

        <!-- 菜单配置面板 -->
        <div class="menu-config" v-if="currentMenu">
          <el-form :model="currentMenu" label-width="100px">
            <el-form-item label="菜单名称">
              <el-input v-model="currentMenu.name" placeholder="请输入菜单名称" maxlength="12" show-word-limit />
            </el-form-item>
            <el-form-item label="菜单内容" v-if="currentMenu.menuType === 1">
              <el-alert title="一级菜单只能作为容器，不能设置动作" type="info" :closable="false" />
            </el-form-item>
            <template v-if="currentMenu.menuType === 2">
              <el-form-item label="动作类型">
                <el-select v-model="currentMenu.actionType" placeholder="请选择">
                  <el-option label="跳转网页" value="view" />
                  <el-option label="点击推事件" value="click" />
                  <el-option label="跳转小程序" value="miniprogram" />
                </el-select>
              </el-form-item>
              <el-form-item label="网页链接" v-if="currentMenu.actionType === 'view' || currentMenu.actionType === 'miniprogram'">
                <el-input v-model="currentMenu.url" placeholder="请输入网页链接" />
              </el-form-item>
              <el-form-item label="菜单KEY" v-if="currentMenu.actionType === 'click'">
                <el-input v-model="currentMenu.menuKey" placeholder="请输入菜单KEY" />
              </el-form-item>
              <el-form-item label="小程序AppID" v-if="currentMenu.actionType === 'miniprogram'">
                <el-input v-model="currentMenu.miniProgramAppId" placeholder="请输入小程序AppID" />
              </el-form-item>
              <el-form-item label="小程序页面路径" v-if="currentMenu.actionType === 'miniprogram'">
                <el-input v-model="currentMenu.miniProgramPagePath" placeholder="请输入页面路径" />
              </el-form-item>
            </template>
            <el-form-item>
              <el-button type="danger" @click="deleteMenu(currentMenu.id)">删除菜单</el-button>
            </el-form-item>
          </el-form>

          <!-- 子菜单管理 -->
          <div v-if="currentMenu.menuType === 1" class="sub-menu-section">
            <h4>子菜单</h4>
            <div class="sub-menu-list">
              <div
                v-for="(sub, idx) in currentSubMenu"
                :key="sub.id || idx"
                class="sub-menu-item"
                :class="{ active: activeMenuId === sub.id }"
                @click="selectMenu(sub)"
              >
                <span>{{ sub.name || '子菜单' + (idx + 1) }}</span>
                <el-icon class="delete-icon" @click.stop="deleteMenu(sub.id)"><Delete /></el-icon>
              </div>
              <div v-if="currentSubMenu.length < 5" class="sub-menu-item add-btn" @click="addSubMenu">
                <el-icon><Plus /></el-icon>
              </div>
            </div>
          </div>
        </div>
        <div class="menu-config-empty" v-else>
          <el-empty description="请选择或添加菜单" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Delete, Plus } from '@element-plus/icons-vue';
import { getMenuTree, saveMenus, publishMenu, getAccountList, deleteMenu as apiDeleteMenu } from '@/api/wechat-oa';

const accountList = ref<any[]>([]);
const accountId = ref<number>();
const loading = ref(false);
const menuList = ref<any[]>([]);
const activeMenuId = ref<number | undefined>();
const idCounter = ref(100);

// 一级菜单
const firstLevelMenus = computed(() => {
  return menuList.value.filter((m) => m.parentId === 0);
});

// 当前选中的菜单
const currentMenu = computed(() => {
  if (!activeMenuId.value) return null;
  return menuList.value.find((m) => m.id === activeMenuId.value);
});

// 当前一级菜单的子菜单
const currentSubMenu = computed(() => {
  if (!activeMenuId.value) return [];
  const parent = menuList.value.find((m) => m.id === activeMenuId.value);
  if (parent && parent.menuType === 1) {
    return menuList.value.filter((m) => m.parentId === parent.id);
  }
  return [];
});

// 获取菜单
const fetchMenus = async () => {
  if (!accountId.value) return;
  loading.value = true;
  try {
    const res = await getMenuTree(accountId.value);
    menuList.value = res || [];
  } catch (error) {
    ElMessage.error('获取菜单失败');
  } finally {
    loading.value = false;
  }
};

// 获取公众号列表
const fetchAccounts = async () => {
  try {
    const res = await getAccountList({ current: 1, size: 100 });
    accountList.value = res.records || [];
    if (accountList.value.length > 0) {
      accountId.value = accountList.value[0].id;
      fetchMenus();
    }
  } catch (error) {
    ElMessage.error('获取公众号列表失败');
  }
};

// 公众号切换
const handleAccountChange = () => {
  menuList.value = [];
  activeMenuId.value = undefined;
  fetchMenus();
};

// 选择菜单
const selectMenu = (menu: any) => {
  activeMenuId.value = menu.id;
};

// 添加一级菜单
const addFirstLevelMenu = () => {
  if (firstLevelMenus.value.length >= 3) {
    ElMessage.warning('一级菜单最多3个');
    return;
  }
  const newMenu = {
    id: idCounter.value++,
    parentId: 0,
    menuType: 1,
    name: '',
    sort: firstLevelMenus.value.length,
    actionType: null,
    url: '',
    menuKey: '',
    miniProgramAppId: '',
    miniProgramPagePath: '',
  };
  menuList.value.push(newMenu);
  activeMenuId.value = newMenu.id;
};

// 添加子菜单
const addSubMenu = () => {
  if (!activeMenuId.value) return;
  const parent = menuList.value.find((m) => m.id === activeMenuId.value);
  if (!parent || parent.menuType !== 1) return;

  const subMenus = menuList.value.filter((m) => m.parentId === parent.id);
  if (subMenus.length >= 5) {
    ElMessage.warning('子菜单最多5个');
    return;
  }

  const newMenu = {
    id: idCounter.value++,
    parentId: parent.id,
    menuType: 2,
    name: '',
    sort: subMenus.length,
    actionType: 'view',
    url: '',
    menuKey: '',
    miniProgramAppId: '',
    miniProgramPagePath: '',
  };
  menuList.value.push(newMenu);
  activeMenuId.value = newMenu.id;
};

// 删除菜单
const deleteMenu = async (id: number | undefined) => {
  if (!id) return;
  try {
    await ElMessageBox.confirm('确定删除该菜单吗？', '提示', { type: 'warning' });
    await apiDeleteMenu([id]);
    menuList.value = menuList.value.filter((m) => m.id !== id && m.parentId !== id);
    if (activeMenuId.value === id) {
      activeMenuId.value = undefined;
    }
    ElMessage.success('删除成功');
  } catch (error) {
    // ignore or handle error
  }
};

// 重置
const handleReset = () => {
  fetchMenus();
};

// 保存
const handleSave = async () => {
  if (!accountId.value) {
    ElMessage.warning('请选择公众号');
    return;
  }
  try {
    await saveMenus(accountId.value, menuList.value);
    ElMessage.success('保存成功');
    fetchMenus();
  } catch (error) {
    ElMessage.error('保存失败');
  }
};

// 发布
const handlePublish = async () => {
  if (!accountId.value) {
    ElMessage.warning('请选择公众号');
    return;
  }
  try {
    await ElMessageBox.confirm('确认发布菜单到微信？发布后约5分钟生效', '提示', { type: 'warning' });
    await publishMenu(accountId.value);
    ElMessage.success('发布成功，请等待微信同步');
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('发布失败');
    }
  }
};

onMounted(() => {
  fetchAccounts();
});
</script>

<style scoped lang="scss">
.wechat-oa-menus {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .menu-editor {
    display: flex;
    gap: 24px;
    min-height: 500px;

    .phone-preview {
      flex-shrink: 0;
      width: 300px;

      .phone-frame {
        border: 2px solid #e4e7ed;
        border-radius: 20px;
        overflow: hidden;
        background: #f5f7fa;

        .phone-header {
          height: 40px;
          background: #ededed;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          color: #333;
        }

        .phone-content {
          height: 300px;
          background: #fff;
        }

        .phone-footer {
          display: flex;
          border-top: 1px solid #e4e7ed;
          background: #fafafa;

          .menu-item {
            flex: 1;
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            position: relative;
            font-size: 13px;
            border-right: 1px solid #e4e7ed;

            &:last-child {
              border-right: none;
            }

            &.active {
              background: #e8f4ff;
            }

            &.add-btn {
              color: #409eff;
              font-size: 20px;
            }

            .delete-icon {
              position: absolute;
              top: -10px;
              right: -5px;
              color: #f56c6c;
              font-size: 14px;
              display: none;
            }

            &:hover .delete-icon {
              display: block;
            }
          }
        }
      }
    }

    .menu-config {
      flex: 1;
      padding: 20px;
      background: #fafafa;
      border-radius: 8px;

      .sub-menu-section {
        margin-top: 24px;
        border-top: 1px solid #e4e7ed;
        padding-top: 16px;

        h4 {
          margin-bottom: 12px;
        }

        .sub-menu-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;

          .sub-menu-item {
            padding: 8px 16px;
            background: #fff;
            border: 1px solid #e4e7ed;
            border-radius: 4px;
            cursor: pointer;
            position: relative;
            font-size: 13px;

            &.active {
              border-color: #409eff;
              background: #e8f4ff;
            }

            &.add-btn {
              color: #409eff;
              border-style: dashed;
            }

            .delete-icon {
              position: absolute;
              top: -8px;
              right: -8px;
              color: #f56c6c;
              font-size: 12px;
              display: none;
            }

            &:hover .delete-icon {
              display: block;
            }
          }
        }
      }
    }

    .menu-config-empty {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #fafafa;
      border-radius: 8px;
    }
  }
}
</style>
