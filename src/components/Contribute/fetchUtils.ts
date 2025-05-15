import yaml from 'js-yaml';
import { Session } from 'next-auth';
import { ValidatedOptions } from '@patternfly/react-core';
import {
  AttributionData,
  KnowledgeEditFormData,
  KnowledgeFormData,
  KnowledgeYamlData,
  QuestionAndAnswerPair,
  SkillEditFormData,
  SkillFormData,
  SkillSeedExample,
  SkillYamlData
} from '@/types';
import { KnowledgeSchemaVersion, SkillSchemaVersion } from '@/types/const';
import { fetchExistingKnowledgeDocuments } from '@/components/Contribute/Utils/documentUtils';

interface ChangeData {
  file: string;
  status: string;
  content?: string;
  commitSha?: string;
}

const parseAttributionContent = (content: string): AttributionData => {
  const lines = content.split('\n');
  const attributionData: { [key: string]: string } = {};
  lines.forEach((line) => {
    const [key, ...value] = line.split(':');
    if (key && value) {
      // Remove spaces in the attribution field for parsing
      const normalizedKey = key.trim().toLowerCase().replace(/\s+/g, '_');
      attributionData[normalizedKey] = value.join(':').trim();
    }
  });
  return attributionData as unknown as AttributionData;
};

const updateKnowledgeFormDataFromYaml = (knowledgeExistingFormData: KnowledgeFormData, yamlData: KnowledgeYamlData) => {
  // Populate the form fields with YAML data
  knowledgeExistingFormData.knowledgeDocumentRepositoryUrl = yamlData.document.repo;
  knowledgeExistingFormData.knowledgeDocumentCommit = yamlData.document.commit;
  knowledgeExistingFormData.documentName = yamlData.document.patterns.join(', ');
  knowledgeExistingFormData.seedExamples = yamlData.seed_examples.map((seed, index) => ({
    immutable: index < 5,
    isExpanded: true,
    context: seed.context,
    isContextValid: ValidatedOptions.success,
    questionAndAnswers: seed.questions_and_answers.map((qa, index) => {
      const qna: QuestionAndAnswerPair = {
        question: qa.question,
        answer: qa.answer,
        immutable: index < 3,
        isQuestionValid: ValidatedOptions.success,
        isAnswerValid: ValidatedOptions.success
      };
      return qna;
    })
  }));
};

const updateKnowledgeFormDataFromAttributionData = (knowledgeExistingFormData: KnowledgeFormData, attributionData: AttributionData) => {
  // Populate the form fields with attribution data
  knowledgeExistingFormData.titleWork = attributionData.title_of_work;
  knowledgeExistingFormData.linkWork = attributionData.link_to_work ? attributionData.link_to_work : '';
  knowledgeExistingFormData.revision = attributionData.revision ? attributionData.revision : '';
  knowledgeExistingFormData.licenseWork = attributionData.license_of_the_work;
  knowledgeExistingFormData.creators = attributionData.creator_names;
};

export const fetchKnowledgeBranchChanges = async (
  session: Session | null,
  branchName: string
): Promise<{ editFormData?: KnowledgeEditFormData; error?: string }> => {
  try {
    const response = await fetch('/api/git/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchName, action: 'diff' })
    });

    const result = await response.json();
    if (response.ok) {
      // Create KnowledgeFormData from existing form.
      const knowledgeExistingFormData: KnowledgeFormData = {
        branchName: branchName,
        email: '',
        name: '',
        submissionSummary: '',
        filePath: '',
        seedExamples: [],
        knowledgeDocumentRepositoryUrl: '',
        knowledgeDocumentCommit: '',
        documentName: '',
        titleWork: '',
        linkWork: '',
        revision: '',
        licenseWork: '',
        creators: '',
        uploadedFiles: []
      };

      const knowledgeEditFormData: KnowledgeEditFormData = {
        isEditForm: true,
        isSubmitted: true,
        version: KnowledgeSchemaVersion,
        formData: knowledgeExistingFormData,
        pullRequestNumber: 0,
        oldFilesPath: ''
      };

      if (session?.user?.name && session?.user?.email) {
        knowledgeExistingFormData.name = session?.user?.name;
        knowledgeExistingFormData.email = session?.user?.email;
      }

      if (result?.commitDetails != null) {
        knowledgeExistingFormData.submissionSummary = result?.commitDetails.message;
        knowledgeExistingFormData.name = result?.commitDetails.name;
        knowledgeExistingFormData.email = result?.commitDetails.email;
      }

      if (result?.changes.length > 0) {
        result.changes.forEach((change: ChangeData) => {
          if (change.status != 'deleted' && change.content) {
            if (change.file.includes('qna.yaml')) {
              const yamlData: KnowledgeYamlData = yaml.load(change.content) as KnowledgeYamlData;
              updateKnowledgeFormDataFromYaml(knowledgeExistingFormData, yamlData);

              // Set the file path from the current YAML file (remove the root folder name from the path)
              const currentFilePath = change.file.split('/').slice(1, -1).join('/');
              knowledgeExistingFormData.filePath = currentFilePath + '/';

              // Set the oldFilesPath to the existing qna.yaml file path.
              knowledgeEditFormData.oldFilesPath = knowledgeExistingFormData.filePath;
            }
            if (change.file.includes('attribution.txt')) {
              const attributionData = parseAttributionContent(change.content);
              updateKnowledgeFormDataFromAttributionData(knowledgeExistingFormData, attributionData);
            }
          }
        });

        const existingFiles = await fetchExistingKnowledgeDocuments(knowledgeEditFormData.formData.knowledgeDocumentCommit);
        if (existingFiles.length != 0) {
          knowledgeExistingFormData.uploadedFiles.push(...existingFiles);
        }
        return { editFormData: knowledgeEditFormData };
      }
    }
  } catch (error) {
    console.error('Error fetching branch changes:', error);
  }

  return { error: 'Error fetching knowledge data from branch : ' + branchName + '. Please try again.' };
};

export const fetchSkillBranchChanges = async (
  session: Session | null,
  branchName: string
): Promise<{ editFormData?: SkillEditFormData; error?: string }> => {
  try {
    const response = await fetch('/api/git/branches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchName, action: 'diff' })
    });

    const result = await response.json();
    if (response.ok) {
      const skillExistingFormData: SkillFormData = {
        branchName: branchName,
        email: '',
        name: '',
        submissionSummary: '',
        filePath: '',
        seedExamples: [],
        titleWork: '',
        licenseWork: '',
        creators: ''
      };

      const skillEditFormData: SkillEditFormData = {
        isEditForm: true,
        isSubmitted: true,
        version: SkillSchemaVersion,
        pullRequestNumber: 0,
        formData: skillExistingFormData,
        oldFilesPath: ''
      };

      if (session?.user?.name && session?.user?.email) {
        skillExistingFormData.name = session?.user?.name;
        skillExistingFormData.email = session?.user?.email;
      }

      if (result?.commitDetails != null) {
        skillExistingFormData.submissionSummary = result?.commitDetails.message;
        skillExistingFormData.name = result?.commitDetails.name;
        skillExistingFormData.email = result?.commitDetails.email;
      }

      if (result?.changes.length > 0) {
        result.changes.forEach((change: ChangeData) => {
          if (change.status != 'deleted' && change.content) {
            if (change.file.includes('qna.yaml')) {
              const yamlData: SkillYamlData = yaml.load(change.content) as SkillYamlData;
              console.log('Parsed skill YAML data:', yamlData);
              skillExistingFormData.submissionSummary = yamlData.task_description;
              const seedExamples: SkillSeedExample[] = [];
              yamlData.seed_examples.forEach((seed, index) => {
                const example: SkillSeedExample = {
                  immutable: index < 5,
                  isExpanded: true,
                  context: seed.context,
                  isContextValid: ValidatedOptions.success,
                  questionAndAnswer: {
                    immutable: index < 5,
                    question: seed.question,
                    isQuestionValid: ValidatedOptions.success,
                    answer: seed.answer,
                    isAnswerValid: ValidatedOptions.success
                  }
                };
                seedExamples.push(example);
              });
              skillExistingFormData.seedExamples = seedExamples;

              //Extract filePath from the existing qna.yaml file path
              const currentFilePath = change.file.split('/').slice(1, -1).join('/');
              skillEditFormData.formData.filePath = currentFilePath + '/';

              // Set the oldFilesPath to the existing qna.yaml file path.
              skillEditFormData.oldFilesPath = skillEditFormData.formData.filePath;
            }
            if (change.file.includes('attribution.txt')) {
              const attributionData = parseAttributionContent(change.content);
              // Populate the form fields with attribution data
              skillExistingFormData.titleWork = attributionData.title_of_work;
              skillExistingFormData.licenseWork = attributionData.license_of_the_work;
              skillExistingFormData.creators = attributionData.creator_names;
            }
          }
        });
      }
      return { editFormData: skillEditFormData };
    } else {
      console.error('Failed to get branch changes:', result.error);
    }
  } catch (error) {
    console.error('Error fetching branch changes:', error);
  }
  return { error: 'Error fetching knowledge data from branch : ' + branchName + '. Please try again.' };
};
