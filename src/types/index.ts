import { ValidatedOptions } from "@patternfly/react-core";

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
  body: string;
}

export interface SkillSeedExample {
  immutable: boolean;
  isExpanded: boolean;
  context?: string;
  isContextValid?: ValidatedOptions;
  validationError?: string;
  question: string;
  isQuestionValid: ValidatedOptions;
  questionValidationError?: string;
  answer: string;
  isAnswerValid: ValidatedOptions;
  answerValidationError?: string;
}

export interface SkillFormData {
  email: string;
  name: string;
  submissionSummary: string;
  documentOutline: string;
  filePath: string;
  seedExamples: SkillSeedExample[];
  titleWork: string;
  licenseWork: string;
  creators: string;
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

export interface KnowledgeSeedExample {
  immutable: boolean;
  isExpanded: boolean;
  context: string;
  isContextValid: ValidatedOptions;
  validationError?: string;
  questionAndAnswers: QuestionAndAnswerPair[];
}

export interface KnowledgeFormData {
  email: string;
  name: string;
  submissionSummary: string;
  domain: string;
  documentOutline: string;
  filePath: string;
  seedExamples: KnowledgeSeedExample[];
  knowledgeDocumentRepositoryUrl: string;
  knowledgeDocumentCommit: string;
  documentName: string;
  titleWork: string;
  linkWork: string;
  revision: string;
  licenseWork: string;
  creators: string;
}

export interface KnowledgeEditFormData {
  isEditForm: boolean;
  knowledgeVersion: number;
  pullRequestNumber: number;
  branchName: string;
  yamlFile: PullRequestFile;
  attributionFile: PullRequestFile;
  knowledgeFormData: KnowledgeFormData;
}
