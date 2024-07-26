// src/types/index.ts

export const SchemaVersion = 2;

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

export interface Label {
  name: string;
}

export interface PullRequest {
  number: number;
  title: string;
  user: {
    login: string;
  };
  html_url: string;
  state: string;
  created_at: string;
  updated_at: string;
  labels: Label[];
}

export interface SkillYamlData {
  created_by: string;
  version: number;
  task_description: string;
  seed_examples: Array<{
    question: string;
    context?: string;
    answer: string;
  }>;
}

export interface QuestionAnswerPair {
  question: string;
  answer: string;
}

export interface KnowledgeYamlData {
  created_by: string;
  version: number;
  domain: string;
  task_description: string;
  seed_examples: QuestionAnswerPair[];
  document: {
    repo: string;
    commit: string;
    patterns: string[];
  };
}

export interface AttributionData {
  title_of_work: string;
  link_to_work: string;
  revision: string;
  license_of_the_work: string;
  creator_names: string;
}

export interface PullRequestFile {
  filename: string;
}

export interface PullRequestUpdateData {
  title: string;
  body: string;
}
