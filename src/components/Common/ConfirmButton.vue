<template>
  <el-popconfirm
    :title="title"
    :confirm-button-text="confirmText"
    :cancel-button-text="cancelText"
    :confirm-button-type="confirmType"
    :cancel-button-type="cancelType"
    @confirm="handleConfirm"
    @cancel="handleCancel"
  >
    <template #reference>
      <el-button
        :type="buttonType"
        :size="size"
        :disabled="disabled"
        :loading="loading"
        :plain="plain"
      >
        <slot />
      </el-button>
    </template>
  </el-popconfirm>
</template>

<script setup lang="ts">
import type { ButtonProps } from "element-plus";

interface Props {
  title?: string;
  confirmText?: string;
  cancelText?: string;
  confirmType?: ButtonProps["type"];
  cancelType?: ButtonProps["type"];
  buttonType?: ButtonProps["type"];
  size?: ButtonProps["size"];
  disabled?: boolean;
  loading?: boolean;
  plain?: boolean;
}

withDefaults(defineProps<Props>(), {
  title: "确定执行此操作吗？",
  confirmText: "确定",
  cancelText: "取消",
  confirmType: "primary",
  cancelType: "text",
  buttonType: "primary",
  size: "default",
  disabled: false,
  loading: false,
  plain: false,
});

const emit = defineEmits<{
  confirm: [];
  cancel: [];
}>();

function handleConfirm() {
  emit("confirm");
}

function handleCancel() {
  emit("cancel");
}
</script>
