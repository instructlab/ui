import { KnowledgeFormData, KnowledgeSeedExample, KnowledgeYamlData, SkillFormData, SkillSeedExample, SkillYamlData } from '@/types';
import { validateContext, validateSkillAnswer, validateSkillQuestion } from '@/components/Contribute/Utils/seedExampleUtils';
import { devLog } from '@/utils/devlog';
import { ValidatedOptions } from '@patternfly/react-core';

export const yamlKnowledgeSeedExampleToFormSeedExample = (
  yamlSeedExamples: { context: string; questions_and_answers: { question: string; answer: string }[] }[]
): KnowledgeSeedExample[] => {
  const mappedSeedExamples = yamlSeedExamples.map((yamlSeedExample) => {
    const { msg: validationError, status: isContextValid } = validateContext(yamlSeedExample.context);
    return {
      immutable: true,
      isExpanded: false,
      context: yamlSeedExample.context,
      isContextValid,
      validationError,
      questionAndAnswers: yamlSeedExample.questions_and_answers.map((qa) => ({
        immutable: true,
        question: qa.question,
        isQuestionValid: ValidatedOptions.default,
        answer: qa.answer,
        isAnswerValid: ValidatedOptions.default
      }))
    };
  });

  devLog('Mapped Seed Examples from YAML:', mappedSeedExamples);
  return mappedSeedExamples;
};

export const addYamlUploadKnowledge = (knowledgeFormData: KnowledgeFormData, data: KnowledgeYamlData): KnowledgeFormData => ({
  ...knowledgeFormData,
  submissionSummary: data.document_outline ?? '',
  knowledgeDocumentRepositoryUrl: data.document.repo ?? '',
  knowledgeDocumentCommit: data.document.commit ?? '',
  documentName: data.document.patterns.join(', ') ?? '',
  filePath: data.domain,
  seedExamples: yamlKnowledgeSeedExampleToFormSeedExample(data.seed_examples)
});

const yamlSkillSeedExampleToFormSeedExample = (yamlSeedExamples: { question: string; context?: string | undefined; answer: string }[]) => {
  return yamlSeedExamples.map((yamlSeedExample) => {
    const { context, question, answer } = yamlSeedExample;
    const { msg: questionValidationError, status: isQuestionValid } = validateSkillQuestion(question);
    const { msg: answerValidationError, status: isAnswerValid } = validateSkillAnswer(question);

    return {
      immutable: true,
      isExpanded: false,
      context,
      questionAndAnswer: {
        immutable: true,
        question,
        isQuestionValid,
        questionValidationError,
        answer,
        isAnswerValid,
        answerValidationError
      }
    };
  }) as SkillSeedExample[];
};

export const addYamlUploadSkill = (skillFormData: SkillFormData, data: SkillYamlData): SkillFormData => ({
  ...skillFormData,
  submissionSummary: data.task_description ?? '',
  seedExamples: yamlSkillSeedExampleToFormSeedExample(data.seed_examples)
});
