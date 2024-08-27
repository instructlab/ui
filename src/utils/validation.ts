// src/utils/validation.ts
export const validateFields = (fields: Record<string, string>): { valid: boolean; title: string; message: string } => {
  for (const [key, value] of Object.entries(fields)) {
    if (value.trim() === '') {
      return {
        valid: false,
        title: `Please make sure you complete the ${key} field`,
        message: `Some fields are not filled out`
      };
    }
  }
  return { valid: true, title: '', message: '' };
};

export const validateEmail = (email: string): { valid: boolean; title: string; message: string } => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      title: `Email address issue!`,
      message: `Please enter a valid email address.`
    };
  }
  return { valid: true, title: '', message: '' };
};

export const validateUniqueItems = (items: string[], itemType: string): { valid: boolean; title: string; message: string } => {
  const uniqueItems = new Set(items);
  if (uniqueItems.size !== items.length) {
    return {
      valid: false,
      title: `Seed example issue!`,
      message: `Please make sure all the ${itemType} are unique!`
    };
  }
  return { valid: true, title: '', message: '' };
};
