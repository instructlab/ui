// src/utils/validation.ts
export const validateFields = (fields: Record<string, string>): { valid: boolean; message: string } => {
  for (const [key, value] of Object.entries(fields)) {
    if (value.trim() === '') {
      return {
        valid: false,
        message: `The ${key} field is empty. Please make sure all the fields are filled!`
      };
    }
  }
  return { valid: true, message: '' };
};

export const validateEmail = (email: string): { valid: boolean; message: string } => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  if (!emailRegex.test(email)) {
    return {
      valid: false,
      message: 'Please enter a valid email address!'
    };
  }
  return { valid: true, message: '' };
};

export const validateUniqueItems = (items: string[], itemType: string): { valid: boolean; message: string } => {
  const uniqueItems = new Set(items);
  if (uniqueItems.size !== items.length) {
    return {
      valid: false,
      message: `Please make sure all the ${itemType} are unique!`
    };
  }
  return { valid: true, message: '' };
};
