import { ValidatedOptions } from '@patternfly/react-core';

export enum ModelEndpointStatus {
  available,
  unavailable,
  disabled,
  unknown
}

export interface DraftEditFormInfo {
  branchName: string;
  title?: string;
  author?: string;
  lastUpdated: string;
  isKnowledgeDraft: boolean;
  isSubmitted: boolean;
  oldFilesPath: string;
  taxonomy: string;
}

export interface ContributionInfo {
  branchName: string;
  title: string;
  author?: string;
  lastUpdated: Date;
  isDraft: boolean;
  isKnowledge: boolean;
  isSubmitted: boolean;
  state: string;
  taxonomy: string;
}

export interface Endpoint {
  id: string;
  name: string;
  description?: string;
  url: string;
  modelName: string;
  modelDescription?: string;
  apiKey: string;
  status: ModelEndpointStatus;
  enabled: boolean;
}

export interface Model {
  isDefault?: boolean;
  name: string;
  apiURL: string;
  modelName: string;
  enabled: boolean;
  apiKey?: string;
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
  head: {
    ref: string;
  };
  taxonomy: string;
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

export interface KnowledgeYamlData {
  created_by: string;
  version: number;
  domain: string;
  seed_examples: Array<{
    context: string;
    questions_and_answers: Array<{
      question: string;
      answer: string;
    }>;
  }>;
  document: {
    repo: string;
    commit: string;
    patterns: string[];
  };
  document_outline: string;
}

export interface AttributionData {
  title_of_work: string;
  link_to_work?: string;
  revision?: string;
  license_of_the_work: string;
  creator_names: string;
}

export interface PullRequestFile {
  filename: string;
}

export interface PullRequestUpdateData {
  title: string;
}

export interface QuestionAndAnswerPair {
  immutable: boolean;
  question: string;
  isQuestionValid: ValidatedOptions;
  questionValidationError?: string;
  answer: string;
  isAnswerValid: ValidatedOptions;
  answerValidationError?: string;
}

export interface SeedExample {
  immutable: boolean;
  isExpanded: boolean;
  isContextValid?: ValidatedOptions;
  validationError?: string;
}

export interface SkillSeedExample extends SeedExample {
  context?: string;
  questionAndAnswer: QuestionAndAnswerPair;
}

export interface KnowledgeFile {
  filename: string;
  content: string;
  commitSha?: string;
  commitDate?: string;
}

export interface KnowledgeSeedExample extends SeedExample {
  context: string;
  questionAndAnswers: QuestionAndAnswerPair[];
  knowledgeFile?: KnowledgeFile;
}

export interface ContributionFormData {
  branchName: string;
  email: string;
  name: string;
  submissionSummary: string;
  filePath: string;
  titleWork: string;
  licenseWork: string;
  creators: string;
}

export interface SkillFormData extends ContributionFormData {
  seedExamples: SkillSeedExample[];
}

export interface KnowledgeFormData extends ContributionFormData {
  knowledgeDocumentRepositoryUrl: string;
  knowledgeDocumentCommit: string;
  documentName: string;
  linkWork: string;
  revision: string;
  seedExamples: KnowledgeSeedExample[];
  filesToUpload: File[];
  uploadedFiles: KnowledgeFile[];
}

export interface EditFormData<T extends ContributionFormData = SkillFormData> {
  isEditForm: boolean;
  isSubmitted: boolean;
  isDraft?: boolean;
  version: number;
  pullRequestNumber: number;
  oldFilesPath: string;
  formData: T;
}

export type SkillEditFormData = EditFormData;

export type KnowledgeEditFormData = EditFormData<KnowledgeFormData>;

export interface EnvConfigType {
  graniteApi: string;
  graniteModelName: string;
  merliniteApi: string;
  merliniteModelName: string;
  upstreamRepoOwner: string;
  upstreamRepoName: string;
  taxonomyRootDir: string;
  taxonomyKnowledgeDocumentRepo: string;
  apiServer: string;
  isDevMode: boolean;
}

export interface FeatureFlagsType {
  docConversionEnabled: boolean;
  skillFeaturesEnabled: boolean;
  playgroundFeaturesEnabled: boolean;
  experimentalFeaturesEnabled: boolean;
}
