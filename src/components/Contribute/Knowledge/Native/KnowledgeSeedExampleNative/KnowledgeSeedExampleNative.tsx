// src/components/Contribute/Knowledge/Native/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
import React from 'react';
import { Accordion, AccordionItem, AccordionContent, AccordionToggle } from '@patternfly/react-core/dist/dynamic/components/Accordion';
import { FormFieldGroupHeader } from '@patternfly/react-core/dist/dynamic/components/Form';
import KnowledgeQuestionAnswerPairsNative from '../KnowledgeQuestionAnswerPairsNative/KnowledgeQuestionAnswerPairs';
import type { KnowledgeSeedExample } from '@/types';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/esm/icons/external-link-alt-icon';

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
          <AccordionItem key={seedExampleIndex} isExpanded={seedExample.isExpanded}>
            <AccordionToggle onClick={() => toggleSeedExampleExpansion(seedExampleIndex)} id={`seed-example-toggle-${seedExampleIndex}`}>
              Seed Example {seedExampleIndex + 1} {seedExample.immutable && <span style={{ color: 'red' }}>*</span>}
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
        ))}
      </Accordion>
    </div>
  );
};

export default KnowledgeSeedExampleNative;
