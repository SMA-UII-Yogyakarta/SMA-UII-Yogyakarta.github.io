export {};

declare global {
  function showToast(message: string, type?: 'success' | 'error' | 'warning' | 'info', duration?: number): void;
}
