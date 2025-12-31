export const formatDate = (date: Date): string => {
  return date.toISOString();
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
