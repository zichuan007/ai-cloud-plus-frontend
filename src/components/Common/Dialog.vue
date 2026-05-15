<template>
  <el-dialog
    v-model="visible"
    :title="title"
    :width="width"
    :center="center"
    :close-on-click-modal="closeOnModal"
    :append-to-body="appendToBody"
    destroy-on-close
    @closed="handleClose"
  >
    <slot />
    <template #footer v-if="$slots.footer || showFooter">
      <slot name="footer">
        <div class="dialog-footer">
          <el-button @click="handleCancel">{{ cancelText }}</el-button>
          <el-button type="primary" :loading="loading" @click="handleConfirm">
            {{ confirmText }}
          </el-button>
        </div>
      </slot>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  modelValue: boolean;
  title?: string;
  width?: string | number;
  center?: boolean;
  closeOnModal?: boolean;
  appendToBody?: boolean;
  showFooter?: boolean;
  cancelText?: string;
  confirmText?: string;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: "",
  width: "500px",
  center: false,
  closeOnModal: true,
  appendToBody: true,
  showFooter: true,
  cancelText: "取消",
  confirmText: "确定",
  loading: false,
});

const emit = defineEmits<{
  "update:modelValue": [value: boolean];
  cancel: [];
  confirm: [];
  close: [];
}>();

// 使用 computed 简化双向绑定，避免冗余 watch
const visible = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit("update:modelValue", val),
});

function handleCancel() {
  emit("cancel");
  visible.value = false;
}

function handleConfirm() {
  emit("confirm");
}

function handleClose() {
  emit("close");
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
