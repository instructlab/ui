// src/types/const.ts
// https://github.com/instructlab/schema/blob/main/src/instructlab/schema/
export const KnowledgeSchemaVersion = 3;
export const SkillSchemaVersion = 3;
export const FORK_CLONE_CHECK_RETRY_TIMEOUT = 5000;
export const FORK_CLONE_CHECK_RETRY_COUNT = 10;
export const GITHUB_API_URL = 'https://api.github.com';
export const BASE_BRANCH = 'main';

// Umami metrics constants
export const PROD_DEPLOYMENT_ENVIRONMENT = 'ui.instructlab.ai';
export const PROD_METRICS_WEBSITE_ID = 'e20a625c-c3aa-487b-81ec-79525ecec36b';
// export const QA_DEPLOYMENT_ENVIRONMENT = 'qa.ui.instructlab.ai';
export const QA_DEPLOYMENT_ENVIRONMENT = 'localhost';
export const QA_METRICS_WEBSITE_ID = '013a7037-2576-4dc9-95e2-a48c234680cb';
export const UMAMI_METRICS_SCRIPT_SOURCE =
  'https://umami-umami.ui-instructlab-ai-0e3e0ef4c9c6d831e8aa6fe01f33bfc4-0000.us-south.containers.appdomain.cloud/script.js';
