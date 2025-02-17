// src/components/Contribute/Knowledge/Native/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
import React from 'react';
import type { KnowledgeSeedExample } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionToggle, Button, Content, Flex, FlexItem } from '@patternfly/react-core';
import { ExternalLinkAltIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import QuestionAnswerPairs from '@/components/Contribute/Knowledge/SeedExamples/QuestionAnswerPairs';
import {
  createEmptySeedExample,
  handleSeedExamplesAnswerBlur,
  handleSeedExamplesAnswerInputChange,
  handleSeedExamplesContextBlur,
  handleSeedExamplesContextInputChange,
  handleSeedExamplesQuestionBlur,
  handleSeedExamplesQuestionInputChange,
  toggleSeedExamplesExpansion
} from '@/components/Contribute/seedExampleUtils';

interface Props {
  isGithubMode: boolean;
  seedExamples: KnowledgeSeedExample[];
  onUpdateSeedExamples: (seedExamples: KnowledgeSeedExample[]) => void;
  addDocumentInfo: (repoUrl: string, commitSha: string, docName: string) => void;
  repositoryUrl: string;
  commitSha: string;
}

const SeedExamples: React.FC<Props> = ({ isGithubMode, seedExamples, onUpdateSeedExamples, addDocumentInfo, repositoryUrl, commitSha }) => {
  const handleContextInputChange = (seedExampleIndex: number, contextValue: string): void => {
    onUpdateSeedExamples(handleSeedExamplesContextInputChange(seedExamples, seedExampleIndex, contextValue));
  };

  const handleContextBlur = (seedExampleIndex: number): void => {
    onUpdateSeedExamples(handleSeedExamplesContextBlur(seedExamples, seedExampleIndex));
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, questionValue: string): void => {
    onUpdateSeedExamples(handleSeedExamplesQuestionInputChange(seedExamples, seedExampleIndex, questionAndAnswerIndex, questionValue));
  };

  const handleQuestionBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    onUpdateSeedExamples(handleSeedExamplesQuestionBlur(seedExamples, seedExampleIndex, questionAndAnswerIndex));
  };

  const handleAnswerInputChange = (seedExampleIndex: number, questionAndAnswerIndex: number, answerValue: string): void => {
    onUpdateSeedExamples(handleSeedExamplesAnswerInputChange(seedExamples, seedExampleIndex, questionAndAnswerIndex, answerValue));
  };

  const handleAnswerBlur = (seedExampleIndex: number, questionAndAnswerIndex: number): void => {
    onUpdateSeedExamples(handleSeedExamplesAnswerBlur(seedExamples, seedExampleIndex, questionAndAnswerIndex));
  };

  const toggleSeedExampleExpansion = (index: number): void => {
    onUpdateSeedExamples(toggleSeedExamplesExpansion(seedExamples, index));
  };

  const addSeedExample = (): void => {
    const seedExample = createEmptySeedExample();
    seedExample.immutable = false;
    seedExample.isExpanded = true;
    onUpdateSeedExamples([...seedExamples, seedExample]);
  };

  const deleteSeedExample = (seedExampleIndex: number): void => {
    onUpdateSeedExamples(seedExamples.filter((_, index: number) => index !== seedExampleIndex));
  };

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
                <QuestionAnswerPairs
                  isGithubMode={isGithubMode}
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

export default SeedExamples;
