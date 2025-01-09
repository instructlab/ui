// src/components/Contribute/Knowledge/KnowledgeSeedExample/KnowledgeSeedExample.tsx
import React from 'react';
import KnowledgeQuestionAnswerPairs from '../KnowledgeQuestionAnswerPairs/KnowledgeQuestionAnswerPairs';
import type { KnowledgeSeedExample } from '@/types';
import { FormFieldGroupHeader, Accordion, AccordionItem, AccordionToggle, AccordionContent } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';

interface Props {
  seedExamples: KnowledgeSeedExample[];
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  toggleSeedExampleExpansion?: (index: number) => void;
}

const KnowledgeSeedExample: React.FC<Props> = ({
  seedExamples,
  handleContextInputChange,
  handleContextBlur,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur,
  toggleSeedExampleExpansion = () => {}
}) => {
  return (
    <div>
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
            Add seed examples with context and minimum 3 question and answer pairs. A minimum of five seed examples are required.{' '}
            <a href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples" target="_blank" rel="noopener noreferrer">
              {' '}
              Learn more about seed examples
              <ExternalLinkAltIcon style={{ padding: '3px' }}></ExternalLinkAltIcon>
            </a>
          </p>
        }
      />

      <Accordion asDefinitionList={false}>
        {seedExamples.map((seedExample: KnowledgeSeedExample, seedExampleIndex: number) => (
          <AccordionItem key={seedExampleIndex} isExpanded={seedExample.isExpanded}>
            <AccordionToggle onClick={() => toggleSeedExampleExpansion(seedExampleIndex)} id={`seed-example-toggle-${seedExampleIndex}`}>
              Seed Example {seedExampleIndex + 1} {seedExample.immutable && <span style={{ color: 'red' }}>*</span>}
            </AccordionToggle>
            <AccordionContent id={`seed-example-content-${seedExampleIndex}`}>
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
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
};

export default KnowledgeSeedExample;
