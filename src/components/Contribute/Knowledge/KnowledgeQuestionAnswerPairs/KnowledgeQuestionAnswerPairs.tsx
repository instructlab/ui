import React from 'react';
import { FormFieldGroupHeader, FormGroup, FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { ExclamationCircleIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { KnowledgeSeedExample, QuestionAndAnswerPair } from '@/types';

interface Props {
  seedExample: KnowledgeSeedExample;
  seedExampleIndex: number;
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
}

const KnowledgeQuestionAnswerPairs: React.FC<Props> = ({
  seedExample,
  seedExampleIndex,
  handleContextInputChange,
  handleContextBlur,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur
}) => {
  return (
    <FormGroup key={seedExampleIndex}>
      <TextArea
        key={seedExampleIndex * 10 + 1}
        isRequired
        type="text"
        aria-label={`Context ${seedExampleIndex + 1}`}
        placeholder="Enter the context from which the Q&A pairs are derived. (500 words max)"
        value={seedExample.context}
        validated={seedExample.isContextValid}
        maxLength={500}
        onChange={(_event, contextValue: string) => handleContextInputChange(seedExampleIndex, contextValue)}
        onBlur={() => handleContextBlur(seedExampleIndex)}
      />
      {seedExample.isContextValid === ValidatedOptions.error && (
        <FormHelperText key={seedExampleIndex * 10 + 2}>
          <HelperText>
            <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.isContextValid}>
              {seedExample.validationError || 'Required field. It must be non-empty and less than 500 words.'}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}

      {seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, questionAnswerIndex) => (
        <div key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 0}>
          <FormFieldGroupHeader
            titleText={{
              text: (
                <p>
                  Q&A Pair {questionAnswerIndex + 1} {questionAndAnswerPair.immutable && <span style={{ color: 'red' }}>*</span>}
                </p>
              ),
              id: 'nested-field-group1-titleText-id'
            }}
          />
          <React.Fragment key={questionAnswerIndex}>
            <TextArea
              key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 1}
              isRequired
              type="text"
              aria-label={`Question ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
              placeholder={`Enter question ${questionAnswerIndex + 1}`}
              value={questionAndAnswerPair.question}
              maxLength={250}
              validated={questionAndAnswerPair.isQuestionValid}
              onChange={(_event, questionValue) => handleQuestionInputChange(seedExampleIndex, questionAnswerIndex, questionValue)}
              onBlur={() => handleQuestionBlur(seedExampleIndex, questionAnswerIndex)}
            />
            {seedExample.questionAndAnswers[questionAnswerIndex].isQuestionValid === ValidatedOptions.error && (
              <FormHelperText key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 2}>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.questionAndAnswers[questionAnswerIndex].isQuestionValid}>
                    {seedExample.questionAndAnswers[questionAnswerIndex].questionValidationError ||
                      'Required field. Total length of all Q&A pairs should be less than 250 words.'}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
            <TextArea
              key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 3}
              isRequired
              type="text"
              aria-label={`Answer ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
              placeholder={`Enter answer ${questionAnswerIndex + 1}`}
              value={questionAndAnswerPair.answer}
              maxLength={250}
              validated={questionAndAnswerPair.isAnswerValid}
              onChange={(_event, answerValue) => handleAnswerInputChange(seedExampleIndex, questionAnswerIndex, answerValue)}
              onBlur={() => handleAnswerBlur(seedExampleIndex, questionAnswerIndex)}
            />
            {seedExample.questionAndAnswers[questionAnswerIndex].isAnswerValid === ValidatedOptions.error && (
              <FormHelperText key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 4}>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.questionAndAnswers[questionAnswerIndex].isAnswerValid}>
                    {seedExample.questionAndAnswers[questionAnswerIndex].answerValidationError ||
                      'Required field. Total length of all Q&A pairs should be less than 250 words.'}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </React.Fragment>
        </div>
      ))}
    </FormGroup>
  );
};

export default KnowledgeQuestionAnswerPairs;
