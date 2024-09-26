import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import KnowledgeQuestionAnswerPairs from '../KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs';
import { SeedExample } from '..';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';

interface Props {
  seedExamples: SeedExample[];
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
}

const KnowledgeSeedExample: React.FC<Props> = ({
  seedExamples,
  handleContextInputChange,
  handleContextBlur,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur
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
          titleDescription={
            <p>
              Add seed examples with context and minimum 3 question and answer pairs. Minimum 5 seed examples are required.{' '}
              <a href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples" target="_blank" rel="noopener noreferrer">
                {' '}
                Learn more about seed examples
                <ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
              </a>
            </p>
          }
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
                    Seed Example {seedExampleIndex + 1} {seedExample.immutable && <span style={{ color: 'red' }}>*</span>}
                  </p>
                ),
                id: 'nested-field-group1-titleText-id'
              }}
              titleDescription=""
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
          />
        </FormFieldGroupExpandable>
      ))}
    </FormFieldGroupExpandable>
  );
};

export default KnowledgeSeedExample;
