<template>
  <el-form
    ref="formRef"
    :model="model"
    :rules="rules"
    :label-width="labelWidth"
    :label-position="labelPosition"
    :disabled="disabled"
  >
    <el-row :gutter="gutter">
      <el-col
        v-for="item in schema"
        :key="item.prop"
        :span="item.span || defaultSpan"
      >
        <el-form-item
          :label="item.label"
          :prop="item.prop"
          :required="item.required"
        >
          <!-- 输入框 -->
          <el-input
            v-if="item.type === 'input'"
            v-model="model[item.prop]"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :clearable="item.clearable !== false"
            :type="item.inputType"
          />

          <!-- 文本域 -->
          <el-input
            v-else-if="item.type === 'textarea'"
            v-model="model[item.prop]"
            type="textarea"
            :placeholder="item.placeholder"
            :rows="item.rows || 3"
            :disabled="item.disabled"
          />

          <!-- 数字输入 -->
          <el-input-number
            v-else-if="item.type === 'number'"
            v-model="model[item.prop]"
            :placeholder="item.placeholder"
            :min="item.min"
            :max="item.max"
            :disabled="item.disabled"
          />

          <!-- 选择器 -->
          <el-select
            v-else-if="item.type === 'select'"
            v-model="model[item.prop]"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :clearable="item.clearable !== false"
            :multiple="item.multiple"
          >
            <el-option
              v-for="opt in item.options"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>

          <!-- 日期选择 -->
          <el-date-picker
            v-else-if="item.type === 'date'"
            v-model="model[item.prop]"
            type="date"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :format="item.format"
            value-format="YYYY-MM-DD"
          />

          <!-- 日期时间选择 -->
          <el-date-picker
            v-else-if="item.type === 'datetime'"
            v-model="model[item.prop]"
            type="datetime"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :format="item.format"
            value-format="YYYY-MM-DD HH:mm:ss"
          />

          <!-- 开关 -->
          <el-switch
            v-else-if="item.type === 'switch'"
            v-model="model[item.prop]"
            :disabled="item.disabled"
          />

          <!-- 单选 -->
          <el-radio-group
            v-else-if="item.type === 'radio'"
            v-model="model[item.prop]"
            :disabled="item.disabled"
          >
            <el-radio
              v-for="opt in item.options"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-radio>
          </el-radio-group>

          <!-- 复选框 -->
          <el-checkbox-group
            v-else-if="item.type === 'checkbox'"
            v-model="model[item.prop]"
            :disabled="item.disabled"
          >
            <el-checkbox
              v-for="opt in item.options"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </el-checkbox>
          </el-checkbox-group>

          <!-- 树形选择 -->
          <el-tree-select
            v-else-if="item.type === 'tree'"
            v-model="model[item.prop]"
            :data="item.treeData"
            :props="item.treeProps"
            :placeholder="item.placeholder"
            :disabled="item.disabled"
            :check-strictly="item.checkStrictly"
          />

          <!-- 自定义插槽 -->
          <slot
            v-else-if="item.type === 'custom'"
            :name="item.prop"
            :model="model"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from "vue";
import type { FormInstance, FormRules } from "element-plus";

interface FormSchema {
  prop: string;
  label: string;
  type:
    | "input"
    | "textarea"
    | "number"
    | "select"
    | "date"
    | "datetime"
    | "switch"
    | "radio"
    | "checkbox"
    | "tree"
    | "custom";
  placeholder?: string;
  disabled?: boolean;
  clearable?: boolean;
  required?: boolean;
  span?: number;
  // select/radio/checkbox
  options?: Array<{ label: string; value: string | number }>;
  // select
  multiple?: boolean;
  // number
  min?: number;
  max?: number;
  // textarea
  rows?: number;
  // input
  inputType?: string;
  // date/datetime
  format?: string;
  // tree
  treeData?: Record<string, any>[];
  treeProps?: Record<string, any>;
  checkStrictly?: boolean;
}

interface Props {
  model: Record<string, any>;
  schema: FormSchema[];
  rules?: FormRules;
  labelWidth?: string;
  labelPosition?: "left" | "right" | "top";
  disabled?: boolean;
  gutter?: number;
  defaultSpan?: number;
}

withDefaults(defineProps<Props>(), {
  labelWidth: "100px",
  labelPosition: "right",
  disabled: false,
  gutter: 20,
  defaultSpan: 24,
});

const formRef = ref<FormInstance>();

async function validate() {
  return formRef.value?.validate();
}

function resetFields() {
  formRef.value?.resetFields();
}

function clearValidate() {
  formRef.value?.clearValidate();
}

function getData() {
  return { validate, resetFields, clearValidate };
}

defineExpose(getData());
</script>
