// src/types/index.ts

export interface Endpoint {
  id: string;
  url: string;
  apiKey: string;
  modelName: string;
}

export interface Message {
  text: string;
  isUser: boolean;
}

export interface Model {
  name: string;
  apiURL: string;
  modelName: string;
}
