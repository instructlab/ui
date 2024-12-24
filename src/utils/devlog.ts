// src/utils/devlog.ts

export function devLog(...messages: unknown[]) {
  if (process.env.NODE_ENV === 'development') {
    console.log(...messages);
  }
}
