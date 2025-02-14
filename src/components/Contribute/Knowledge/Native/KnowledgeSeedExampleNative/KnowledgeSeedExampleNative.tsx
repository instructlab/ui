// src/components/Contribute/Knowledge/Native/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
import React from 'react';
import KnowledgeQuestionAnswerPairsNative from '../KnowledgeQuestionAnswerPairsNative/KnowledgeQuestionAnswerPairs';
import type { KnowledgeSeedExample } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionToggle, Button, Content, Flex, FlexItem } from '@patternfly/react-core';
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
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <Content component="h4">Seed Examples</Content>
        <Content component="p">
          Add seed examples with context and minimum 3 question and answer pairs. A minimum of five seed examples are required.{' '}
          <Button
            variant="link"
            isInline
            href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Flex gap={{ default: 'gapXs' }}>
              <FlexItem>Learn more about seed examples</FlexItem>
              <FlexItem>
                <ExternalLinkAltIcon />
              </FlexItem>
            </Flex>
          </Button>
        </Content>
      </FlexItem>
      <FlexItem>
        <Accordion asDefinitionList={false}>
          {seedExamples.map((seedExample: KnowledgeSeedExample, seedExampleIndex: number) => (
            <AccordionItem key={seedExampleIndex} isExpanded={seedExample.isExpanded}>
              <AccordionToggle onClick={() => toggleSeedExampleExpansion(seedExampleIndex)} id={`seed-example-toggle-${seedExampleIndex}`}>
                <span>
                  Seed Example {seedExampleIndex + 1}{' '}
                  {seedExample.immutable && <span style={{ color: 'var(--pf-t--global--color--status--danger--default)' }}>*</span>}
                  {!seedExample.immutable && (
                    <Button icon={<TrashIcon />} variant="plain" aria-label="Remove" onClick={() => deleteSeedExample(seedExampleIndex)} />
                  )}
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
          ))}
        </Accordion>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button icon={<PlusCircleIcon />} variant="link" type="button" onClick={addSeedExample}>
            Add Seed Example
          </Button>
        </div>
      </FlexItem>
    </Flex>
  );
};

export default KnowledgeSeedExampleNative;
