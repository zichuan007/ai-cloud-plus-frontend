/**
 * 表单校验规则集合
 * 统一管理常用的表单校验逻辑
 */

/** 必填校验 */
export const requiredRule = (message = '此项为必填项') => ({
  required: true,
  message,
  trigger: 'blur',
});

/** 邮箱校验 */
export const emailRule = {
  pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  message: '请输入有效的邮箱地址',
  trigger: 'blur',
};

/** 手机号校验 */
export const phoneRule = {
  pattern: /^1[3-9]\d{9}$/,
  message: '请输入有效的手机号码',
  trigger: 'blur',
};

/** 密码强度校验 (大小写字母+数字+特殊字符，8-20位) */
export const passwordRule = {
  pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/,
  message: '密码必须包含大小写字母、数字和特殊字符，且长度在 8-20 位之间',
  trigger: 'blur',
};

/** 用户名校验 (字母开头，允许字母、数字、下划线，4-16位) */
export const usernameRule = {
  pattern: /^[a-zA-Z][a-zA-Z0-9_]{3,15}$/,
  message: '用户名必须以字母开头，允许字母、数字、下划线，长度 4-16 位',
  trigger: 'blur',
};

/** 数字校验 */
export const numberRule = (min?: number, max?: number) => ({
  type: 'number' as const,
  message: '请输入有效的数字',
  trigger: 'blur',
  transform: (value: string) => (value ? Number(value) : undefined),
  ...(min !== undefined && { min }),
  ...(max !== undefined && { max }),
});
