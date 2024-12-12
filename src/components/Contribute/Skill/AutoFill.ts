import { SkillFormData, SkillSeedExample } from '@/types';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';

const seedExamples: SkillSeedExample[] = [
  {
    immutable: false,
    isExpanded: false,
    context: undefined,
    isContextValid: ValidatedOptions.success,
    validationError: undefined,
    question: 'What are 5 words that rhyme with horn?',
    isQuestionValid: ValidatedOptions.success,
    questionValidationError: undefined,
    answer: 'warn, torn, born, thorn, and corn.',
    isAnswerValid: ValidatedOptions.success,
    answerValidationError: undefined
  },
  {
    immutable: false,
    isExpanded: false,
    context: undefined,
    isContextValid: ValidatedOptions.success,
    validationError: undefined,
    question: 'What are 5 words that rhyme with cat?',
    isQuestionValid: ValidatedOptions.success,
    questionValidationError: undefined,
    answer: 'bat, gnat, rat, vat, and mat.',
    isAnswerValid: ValidatedOptions.success,
    answerValidationError: undefined
  },
  {
    immutable: false,
    isExpanded: false,
    context: undefined,
    isContextValid: ValidatedOptions.success,
    validationError: undefined,
    question: 'What are 5 words that rhyme with poor?',
    isQuestionValid: ValidatedOptions.success,
    questionValidationError: undefined,
    answer: 'door, shore, core, bore, and tore.',
    isAnswerValid: ValidatedOptions.success,
    answerValidationError: undefined
  },
  {
    immutable: false,
    isExpanded: false,
    context: undefined,
    isContextValid: ValidatedOptions.success,
    validationError: undefined,
    question: 'What are 5 words that rhyme with bank?',
    isQuestionValid: ValidatedOptions.success,
    questionValidationError: undefined,
    answer: 'tank, rank, prank, sank, and drank.',
    isAnswerValid: ValidatedOptions.success,
    answerValidationError: undefined
  },
  {
    immutable: false,
    isExpanded: false,
    context: undefined,
    isContextValid: ValidatedOptions.success,
    validationError: undefined,
    question: 'What are 5 words that rhyme with bake?',
    isQuestionValid: ValidatedOptions.success,
    questionValidationError: undefined,
    answer: 'wake, lake, steak, make, and quake.',
    isAnswerValid: ValidatedOptions.success,
    answerValidationError: undefined
  }
];

export const autoFillSkillsFields: SkillFormData = {
  email: 'helloworld@instructlab.com',
  name: 'juliadenham',
  submissionSummary: 'Teaching a model to rhyme.',
  documentOutline: 'These provided examples demonstrate how to rhyme.',
  filePath: 'science/physics/astrophysics/stars',
  seedExamples: seedExamples,
  titleWork: 'Teaching a model to rhyme.',
  licenseWork: 'CC-BY-SA-4.0',
  creators: 'juliadenham'
};
