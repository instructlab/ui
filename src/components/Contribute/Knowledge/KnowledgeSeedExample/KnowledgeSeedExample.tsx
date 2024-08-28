import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { TrashIcon, PlusCircleIcon } from '@patternfly/react-icons/dist/dynamic/icons/';
import KnowledgeQuestionAnswerPairs from '../KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs';
import { SeedExample } from '..';

interface Props {
  seedExamples: SeedExample[];
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  deleteQuestionAnswerPair: (seedExampleIndex: number, questionAnswerIndex: number) => void;
  addQuestionAnswerPair: (seedExampleIndex: number) => void;
  addSeedExample: () => void;
  deleteSeedExample: (seedExampleIndex: number) => void;
}

const KnowledgeSeedExample: React.FC<Props> = ({
  seedExamples,
  handleContextInputChange,
  handleContextBlur,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur,
  deleteQuestionAnswerPair,
  addQuestionAnswerPair,
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
          titleDescription="Add seed examples with context and Q&A pairs. Minimum 5 seed examples are required."
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
                    Knowledge Seed Example {seedExampleIndex + 1} {seedExample.immutable && <span style={{ color: 'red' }}>*</span>}
                  </p>
                ),
                id: 'nested-field-group1-titleText-id'
              }}
              titleDescription="Please enter context and at least 3 Q&A pairs for the seed example."
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
          <KnowledgeQuestionAnswerPairs
            seedExample={seedExample}
            seedExampleIndex={seedExampleIndex}
            handleContextInputChange={handleContextInputChange}
            handleContextBlur={handleContextBlur}
            handleQuestionInputChange={handleQuestionInputChange}
            handleQuestionBlur={handleQuestionBlur}
            handleAnswerInputChange={handleAnswerInputChange}
            handleAnswerBlur={handleAnswerBlur}
            deleteQuestionAnswerPair={deleteQuestionAnswerPair}
            addQuestionAnswerPair={addQuestionAnswerPair}
          />
        </FormFieldGroupExpandable>
      ))}
      <Button variant="link" onClick={addSeedExample}>
        <PlusCircleIcon /> Add Seed Example
      </Button>
    </FormFieldGroupExpandable>
  );
};

export default KnowledgeSeedExample;
