// src/components/Contribute/Knowledge/Native/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
import React from 'react';
import KnowledgeQuestionAnswerPairsNative from '../KnowledgeQuestionAnswerPairsNative/KnowledgeQuestionAnswerPairs';
import type { KnowledgeSeedExample } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionToggle, Button, FormFieldGroupHeader } from '@patternfly/react-core';
import { ExternalLinkAltIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';

interface Props {
  seedExamples: KnowledgeSeedExample[];
  handleContextInputChange: (seedExampleIndex: number, contextValue: string) => void;
  handleContextBlur: (seedExampleIndex: number) => void;
  handleQuestionInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string) => void;
  handleQuestionBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  handleAnswerInputChange: (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string) => void;
  handleAnswerBlur: (seedExampleIndex: number, questionAndAnswerIndex: number) => void;
  toggleSeedExampleExpansion?: (index: number) => void;
  addDocumentInfo: (repoUrl: string, commitSha: string, docName: string) => void;
  addSeedExample: () => void;
  deleteSeedExample: (seedExampleIndex: number) => void;
  repositoryUrl: string;
  commitSha: string;
}

const KnowledgeSeedExampleNative: React.FC<Props> = ({
  seedExamples,
  handleContextInputChange,
  handleContextBlur,
  handleQuestionInputChange,
  handleQuestionBlur,
  handleAnswerInputChange,
  handleAnswerBlur,
  toggleSeedExampleExpansion = () => {},
  addDocumentInfo,
  addSeedExample,
  deleteSeedExample,
  repositoryUrl,
  commitSha
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
          <div key={seedExampleIndex} style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <div style={{ flex: 9 }}>
              <AccordionItem key={seedExampleIndex} isExpanded={seedExample.isExpanded}>
                <AccordionToggle onClick={() => toggleSeedExampleExpansion(seedExampleIndex)} id={`seed-example-toggle-${seedExampleIndex}`}>
                  <span style={{ display: 'flex', alignItems: 'normal', justifyContent: 'space-between', width: '100%' }}>
                    Seed Example {seedExampleIndex + 1} {seedExample.immutable && '*'}
                  </span>
                </AccordionToggle>
                <AccordionContent id={`seed-example-content-${seedExampleIndex}`}>
                  <KnowledgeQuestionAnswerPairsNative
                    seedExample={seedExample}
                    seedExampleIndex={seedExampleIndex}
                    handleContextInputChange={handleContextInputChange}
                    handleContextBlur={handleContextBlur}
                    handleQuestionInputChange={handleQuestionInputChange}
                    handleQuestionBlur={handleQuestionBlur}
                    handleAnswerInputChange={handleAnswerInputChange}
                    handleAnswerBlur={handleAnswerBlur}
                    addDocumentInfo={addDocumentInfo}
                    repositoryUrl={repositoryUrl}
                    commitSha={commitSha}
                  />
                </AccordionContent>
              </AccordionItem>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {!seedExample.immutable && (
                <Button icon={<TrashIcon />} variant="plain" aria-label="Remove" onClick={() => deleteSeedExample(seedExampleIndex)} />
              )}
            </div>
          </div>
        ))}
      </Accordion>
      <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
        <Button icon={<PlusCircleIcon />} variant="link" type="button" onClick={addSeedExample}>
          Add Seed Example
        </Button>
      </div>
    </div>
  );
};

export default KnowledgeSeedExampleNative;
