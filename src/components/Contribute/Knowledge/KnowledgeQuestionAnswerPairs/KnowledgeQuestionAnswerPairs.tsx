import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup, FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { TrashIcon, PlusCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import { QuestionAndAnswerPair, SeedExample } from '..';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { HelperText } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import { HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';

interface Props {
  seedExample: SeedExample;
  seedExampleIndex: number;
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  deleteQuestionAnswerPair: (seedExampleIndex: number, questionAnswerIndex: number) => void;
  addQuestionAnswerPair: (seedExampleIndex: number) => void;
}

const KnowledgeQuestionAnswerPairs: React.FC<Props> = ({
  seedExample,
  seedExampleIndex,
  handleContextInputChange,
  handleContextBlur,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur,
  deleteQuestionAnswerPair,
  addQuestionAnswerPair
}) => {
  return (
    <FormGroup key={seedExampleIndex}>
      <TextArea
        key={seedExampleIndex * 10 + 1}
        isRequired
        type="text"
        aria-label={`Context ${seedExampleIndex + 1}`}
        placeholder="Enter the context from which the Q&A pairs are derived. (500 character max)"
        maxLength={500}
        value={seedExample.context}
        validated={seedExample.isContextValid}
        onChange={(_event, contextValue: string) => handleContextInputChange(seedExampleIndex, contextValue)}
        onBlur={() => handleContextBlur(seedExampleIndex)}
      />
      {seedExample.isContextValid === ValidatedOptions.error && (
        <FormHelperText key={seedExampleIndex * 10 + 2}>
          <HelperText>
            <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.isContextValid}>
              {seedExample.validationError || 'Context is required. It must be non empty and less than 500 characters.'}
            </HelperTextItem>
          </HelperText>
        </FormHelperText>
      )}

      {seedExample.questionAndAnswers.map((questionAndAnswerPair: QuestionAndAnswerPair, questionAnswerIndex) => (
        <FormFieldGroupExpandable
          isExpanded
          toggleAriaLabel="ContextDetails"
          key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 0}
          header={
            <FormFieldGroupHeader
              titleText={{
                text: (
                  <p>
                    Q&A Pair {questionAnswerIndex + 1} {questionAndAnswerPair.immutable && <span style={{ color: 'red' }}>*</span>}
                  </p>
                ),
                id: 'nested-field-group1-titleText-id'
              }}
              actions={
                !seedExample.questionAndAnswers[questionAnswerIndex].immutable && (
                  <Button variant="plain" aria-label="Remove" onClick={() => deleteQuestionAnswerPair(seedExampleIndex, questionAnswerIndex)}>
                    <TrashIcon />
                  </Button>
                )
              }
            />
          }
        >
          <React.Fragment key={questionAnswerIndex}>
            <TextArea
              key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 1}
              isRequired
              type="text"
              aria-label={`Question ${seedExampleIndex + 1}-${questionAnswerIndex + 1}`}
              placeholder={`Enter question ${questionAnswerIndex + 1}`}
              value={questionAndAnswerPair.question}
              validated={questionAndAnswerPair.isQuestionValid}
              onChange={(_event, questionValue) => handleQuestionInputChange(seedExampleIndex, questionAnswerIndex, questionValue)}
              onBlur={() => handleQuestionBlur(seedExampleIndex, questionAnswerIndex)}
            />
            {seedExample.questionAndAnswers[questionAnswerIndex].isQuestionValid === ValidatedOptions.error && (
              <FormHelperText key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 2}>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.questionAndAnswers[questionAnswerIndex].isQuestionValid}>
                    {seedExample.questionAndAnswers[questionAnswerIndex].questionValidationError ||
                      'Question is required. Total length of all Q&A pairs should be less than 250 characters.'}
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
              validated={questionAndAnswerPair.isAnswerValid}
              onChange={(_event, answerValue) => handleAnswerInputChange(seedExampleIndex, questionAnswerIndex, answerValue)}
              onBlur={() => handleAnswerBlur(seedExampleIndex, questionAnswerIndex)}
            />
            {seedExample.questionAndAnswers[questionAnswerIndex].isAnswerValid === ValidatedOptions.error && (
              <FormHelperText key={seedExampleIndex * 100 + questionAnswerIndex * 10 + 4}>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.questionAndAnswers[questionAnswerIndex].isAnswerValid}>
                    {seedExample.questionAndAnswers[questionAnswerIndex].answerValidationError ||
                      'Answer is required. Total length of all Q&A pairs should be less than 250 characters.'}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </React.Fragment>
        </FormFieldGroupExpandable>
      ))}
      <div style={{ marginTop: '10px', marginBottom: '20px', textAlign: 'right' }}>
        <Button variant="link" onClick={() => addQuestionAnswerPair(seedExampleIndex)}>
          <PlusCircleIcon /> Add Q&A Pair
        </Button>
      </div>
    </FormGroup>
  );
};

export default KnowledgeQuestionAnswerPairs;
