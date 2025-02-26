import { KnowledgeFormData, KnowledgeSeedExample, KnowledgeYamlData, SkillFormData, SkillSeedExample, SkillYamlData } from '@/types';
import { validateAnswer, validateContext, validateQuestion } from '@/components/Contribute/Utils/seedExampleUtils';
import { devLog } from '@/utils/devlog';

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
      questionAndAnswers: yamlSeedExample.questions_and_answers.map((qa) => {
        const { msg: questionValidationError, status: isQuestionValid } = validateQuestion(qa.question);
        const { msg: answerValidationError, status: isAnswerValid } = validateAnswer(qa.answer);
        return {
          immutable: true,
          question: qa.question,
          answer: qa.answer,
          isQuestionValid,
          questionValidationError,
          isAnswerValid,
          answerValidationError
        };
      })
    };
  });

  devLog('Mapped Seed Examples from YAML:', mappedSeedExamples);
  return mappedSeedExamples;
};

export const addYamlUploadKnowledge = (knowledgeFormData: KnowledgeFormData, data: KnowledgeYamlData): KnowledgeFormData => ({
  ...knowledgeFormData,
  documentOutline: data.document_outline ?? '',
  submissionSummary: data.document_outline ?? '',
  domain: data.domain ?? '',
  knowledgeDocumentRepositoryUrl: data.document.repo ?? '',
  knowledgeDocumentCommit: data.document.commit ?? '',
  documentName: data.document.patterns.join(', ') ?? '',
  seedExamples: yamlKnowledgeSeedExampleToFormSeedExample(data.seed_examples)
});

const yamlSkillSeedExampleToFormSeedExample = (yamlSeedExamples: { question: string; context?: string | undefined; answer: string }[]) => {
  return yamlSeedExamples.map((yamlSeedExample) => ({
    immutable: true,
    isExpanded: false,
    context: yamlSeedExample.context ?? '',
    questionAndAnswer: {
      immutable: true,
      question: yamlSeedExample.question,
      answer: yamlSeedExample.answer
    }
  })) as SkillSeedExample[];
};

export const addYamlUploadSkill = (skillFormData: SkillFormData, data: SkillYamlData): SkillFormData => ({
  ...skillFormData,
  documentOutline: data.task_description ?? '',
  seedExamples: yamlSkillSeedExampleToFormSeedExample(data.seed_examples)
});
