// src/components/Contribute/Knowledge/KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPair.tsx
import React from 'react';
import { QuestionAndAnswerPair } from '@/types';
import { Flex, FlexItem, FormGroup, FormHelperText, HelperText, HelperTextItem, TextArea, ValidatedOptions } from '@patternfly/react-core';
import { getWordCount } from '@/components/Contribute/Utils/contributionUtils';
import { ExclamationCircleIcon } from '@patternfly/react-icons';

const questionExamples = [
  'Example: What is the Phoenix constellation?',
  'Example: Who charted the Phoenix constellation?',
  'Example: Example: What constellations border Phoenix?'
];

const answerExamples = [
  'Example: Phoenix is a minor constellation in the southern sky.',
  'Example: The Phoenix constellation was charted by french explorer and astronomer Nicolas Louis de Lacaille.',
  'Example: Phoenix is a small constellation bordered by Fornax, Sculptor, Grus, Tucana, Hydrus, and Eridanus.'
];

interface Props {
  questionAndAnswerPair: QuestionAndAnswerPair;
  index: number;
  seedExampleIndex: number;
  handleQuestionInputChange: (questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (questionAndAnswerIndex: number) => void;
  setAnchorRef?: (ref: HTMLElement | null) => void;
}

const KnowledgeQuestionAnswerPair: React.FC<Props> = ({
  questionAndAnswerPair,
  index,
  seedExampleIndex,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur,
  setAnchorRef
}) => {
  const questionWordCount = React.useMemo(() => getWordCount(questionAndAnswerPair.question), [questionAndAnswerPair.question]);
  const answerWordCount = React.useMemo(() => getWordCount(questionAndAnswerPair.answer), [questionAndAnswerPair.answer]);

  return (
    <FormGroup label={`Question and answer ${index + 1}`} isRequired={questionAndAnswerPair.immutable} ref={setAnchorRef}>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
        <FlexItem className="q-and-a-field">
          <TextArea
            className="q-and-a-field__text-area"
            autoResize
            rows={1}
            resizeOrientation="vertical"
            aria-label={`Question ${seedExampleIndex + 1}-${index + 1}`}
            placeholder={questionExamples[index % 3]}
            value={questionAndAnswerPair.question}
            validated={questionAndAnswerPair.isQuestionValid === ValidatedOptions.error ? ValidatedOptions.error : ValidatedOptions.default}
            onChange={(_event, questionValue) => handleQuestionInputChange(index, questionValue)}
            onBlur={() => handleQuestionBlur(index)}
          />
          {questionWordCount > 0 ? (
            <HelperText className="q-and-a-field__text-help">
              <HelperTextItem>
                {questionWordCount} {`word${questionWordCount !== 1 ? 's' : ''}`}
              </HelperTextItem>
            </HelperText>
          ) : questionAndAnswerPair.isQuestionValid === ValidatedOptions.error ? (
            <FormHelperText>
              <HelperText className="q-and-a-field__text-help">
                <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                  {questionAndAnswerPair.questionValidationError}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          ) : null}
        </FlexItem>
        <FlexItem className="q-and-a-field">
          <TextArea
            className="q-and-a-field__text-area"
            autoResize
            rows={1}
            resizeOrientation="vertical"
            aria-label={`Answer ${seedExampleIndex + 1}-${index + 1}`}
            placeholder={answerExamples[index % 3]}
            value={questionAndAnswerPair.answer}
            validated={questionAndAnswerPair.isAnswerValid === ValidatedOptions.error ? ValidatedOptions.error : ValidatedOptions.default}
            onChange={(_event, answerValue) => handleAnswerInputChange(index, answerValue)}
            onBlur={() => handleAnswerBlur(index)}
          />
          {answerWordCount > 0 ? (
            <HelperText className="q-and-a-field__text-help">
              <HelperTextItem>
                {answerWordCount} {`word${answerWordCount !== 1 ? 's' : ''}`}
              </HelperTextItem>
            </HelperText>
          ) : questionAndAnswerPair.isAnswerValid === ValidatedOptions.error ? (
            <FormHelperText>
              <HelperText className="q-and-a-field__text-help">
                <HelperTextItem icon={<ExclamationCircleIcon />} variant={ValidatedOptions.error}>
                  {questionAndAnswerPair.answerValidationError}
                </HelperTextItem>
              </HelperText>
            </FormHelperText>
          ) : null}
        </FlexItem>
      </Flex>
    </FormGroup>
  );
};

export default KnowledgeQuestionAnswerPair;
