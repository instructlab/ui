import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup, FormHelperText } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { TrashIcon, PlusCircleIcon, ExclamationCircleIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import { SeedExample } from '..';
import { TextArea } from '@patternfly/react-core/dist/esm/components/TextArea';
import { ValidatedOptions } from '@patternfly/react-core/dist/esm/helpers/constants';
import { HelperText, HelperTextItem } from '@patternfly/react-core/dist/esm/components/HelperText';

interface Props {
  seedExamples: SeedExample[];
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number) => void;
  addSeedExample: () => void;
  deleteSeedExample: (seedExampleIndex: number) => void;
}

const SkillsSeedExample: React.FC<Props> = ({
  seedExamples,
  handleContextInputChange,
  handleContextBlur,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur,
  addSeedExample,
  deleteSeedExample
}) => {
  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <p>
                Seed Examples <span style={{ color: 'red' }}>*</span>
              </p>
            ),
            id: 'seed-examples-id'
          }}
          titleDescription="Add seed examples with Q&A pair and context (optional). Minimum 5 seed examples are required."
        />
      }
    >
      {seedExamples.map((seedExample: SeedExample, seedExampleIndex: number) => (
        <FormFieldGroupExpandable
          isExpanded={seedExample.isExpanded}
          toggleAriaLabel="Details"
          key={seedExampleIndex}
          header={
            <FormFieldGroupHeader
              titleText={{
                text: (
                  <p>
                    Skill Seed Example {seedExampleIndex + 1} {seedExample.immutable && <span style={{ color: 'red' }}>*</span>}
                  </p>
                ),
                id: 'nested-field-group1-titleText-id'
              }}
              titleDescription="Please enter question and answer for the seed example. Context is recommended but not required."
              actions={
                !seedExample.immutable && (
                  <Button variant="plain" aria-label="Remove" onClick={() => deleteSeedExample(seedExampleIndex)}>
                    <TrashIcon />
                  </Button>
                )
              }
            />
          }
        >
          <FormGroup key={seedExampleIndex}>
            <TextArea
              key={seedExampleIndex * 10 + 2}
              isRequired
              type="text"
              aria-label={`Question ${seedExampleIndex + 1}`}
              placeholder={`Enter question ${seedExampleIndex + 1}`}
              value={seedExample.question}
              validated={seedExample.isQuestionValid}
              onChange={(_event, questionValue) => handleQuestionInputChange(seedExampleIndex, questionValue)}
              onBlur={() => handleQuestionBlur(seedExampleIndex)}
            />
            {seedExample.isQuestionValid === ValidatedOptions.error && (
              <FormHelperText key={seedExampleIndex * 100 + 2}>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.isQuestionValid}>
                    {seedExample.questionValidationError || 'Question is required. '}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
            <TextArea
              key={seedExampleIndex * 10 + 1}
              isRequired
              type="text"
              aria-label={`Context ${seedExampleIndex + 1}`}
              placeholder="Enter the context for the question and answer pair. (optional)"
              value={seedExample.context}
              validated={seedExample.isContextValid}
              onChange={(_event, contextValue: string) => handleContextInputChange(seedExampleIndex, contextValue)}
              onBlur={() => handleContextBlur(seedExampleIndex)}
            />

            <TextArea
              key={seedExampleIndex * 10 + 3}
              isRequired
              type="text"
              aria-label={`Answer ${seedExampleIndex + 1}`}
              placeholder={`Enter answer ${seedExampleIndex + 1}`}
              value={seedExample.answer}
              validated={seedExample.isAnswerValid}
              onChange={(_event, answerValue) => handleAnswerInputChange(seedExampleIndex, answerValue)}
              onBlur={() => handleAnswerBlur(seedExampleIndex)}
            />
            {seedExample.isAnswerValid === ValidatedOptions.error && (
              <FormHelperText key={seedExampleIndex * 100 + 4}>
                <HelperText>
                  <HelperTextItem icon={<ExclamationCircleIcon />} variant={seedExample.isAnswerValid}>
                    {seedExample.answerValidationError || 'Answer is required.'}
                  </HelperTextItem>
                </HelperText>
              </FormHelperText>
            )}
          </FormGroup>
        </FormFieldGroupExpandable>
      ))}
      <Button variant="link" onClick={addSeedExample}>
        <PlusCircleIcon /> Add Seed Example
      </Button>
    </FormFieldGroupExpandable>
  );
};

export default SkillsSeedExample;
