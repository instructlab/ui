import {  ReactNode } from 'react';
import { ValidatedOptions } from '@patternfly/react-core';


export enum ModelEndpointStatus {
  available,
  unavailable,
  unknown
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

export  const EndpointRequiredFields: (keyof Endpoint)[] = ["name", "url", "modelName"];

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

export interface KnowledgeSeedExample extends SeedExample {
  context: string;
  questionAndAnswers: QuestionAndAnswerPair[];
}

export interface ContributionFormData {
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
}

export interface EditFormData<T extends ContributionFormData = SkillFormData> {
  isEditForm: boolean;
  version: number;
  pullRequestNumber: number;
  branchName: string;
  oldFilesPath: string;
  formData: T;
}

export type SkillEditFormData = EditFormData;

export type KnowledgeEditFormData = EditFormData<KnowledgeFormData>;
