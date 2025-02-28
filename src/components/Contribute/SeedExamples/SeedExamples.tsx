// src/components/Contribute/Knowledge/Native/KnowledgeSeedExampleNative/KnowledgeQuestionAnswerPairsNative.tsx
import React from 'react';
import type { SeedExample } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionToggle, Button, Flex, FlexItem } from '@patternfly/react-core';
import { ExternalLinkAltIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import QuestionAnswerPairs from '@/components/Contribute/SeedExamples/QuestionAnswerPairs';
import {
  createEmptySeedExample,
  handleSeedExamplesAnswerBlur,
  handleSeedExamplesAnswerInputChange,
  handleSeedExamplesContextBlur,
  handleSeedExamplesContextInputChange,
  handleSeedExamplesQuestionBlur,
  handleSeedExamplesQuestionInputChange,
  toggleSeedExamplesExpansion
} from '@/components/Contribute/Utils/seedExampleUtils';
import PageHeader from '@/components/Contribute/PageHeader';

interface Props {
  isSkillContribution: boolean;
  seedExamples: SeedExample[];
  onSelectContext?: (seedExampleIndex: number) => void;
  onUpdateSeedExamples: (seedExamples: SeedExample[]) => void;
}

const SeedExamples: React.FC<Props> = ({ isSkillContribution, seedExamples, onSelectContext, onUpdateSeedExamples }) => {
  const handleContextInputChange = (seedExampleIndex: number, contextValue: string, validate = false): void => {
    onUpdateSeedExamples(handleSeedExamplesContextInputChange(seedExamples, seedExampleIndex, contextValue, validate));
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
        <PageHeader
          title="Seed Examples"
          description={
            <>
              Add seed examples with context and minimum 3 question and answer pairs. A minimum of five seed examples are required.{' '}
              <Button
                variant="link"
                isInline
                href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples"
                target="_blank"
                rel="noopener noreferrer"
                icon={<ExternalLinkAltIcon />}
                iconPosition="end"
              >
                Learn more about seed examples
              </Button>
            </>
          }
        />
      </FlexItem>
      <FlexItem>
        <Accordion asDefinitionList={false}>
          {seedExamples.map((seedExample: SeedExample, seedExampleIndex: number) => (
            <AccordionItem key={seedExampleIndex} isExpanded={seedExample.isExpanded}>
              <AccordionToggle onClick={() => toggleSeedExampleExpansion(seedExampleIndex)} id={`seed-example-toggle-${seedExampleIndex}`}>
                <Flex gap={{ default: 'gapMd' }} justifyContent={{ default: 'justifyContentSpaceBetween' }} style={{ width: '100%' }}>
                  <FlexItem>
                    Seed Example {seedExampleIndex + 1}{' '}
                    {seedExample.immutable ? <span style={{ color: 'var(--pf-t--global--color--status--danger--default)' }}>*</span> : null}
                  </FlexItem>
                  {!seedExample.immutable ? (
                    <FlexItem>
                      <Button
                        component="a"
                        icon={<TrashIcon />}
                        variant="plain"
                        aria-label="Remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSeedExample(seedExampleIndex);
                        }}
                      />
                    </FlexItem>
                  ) : null}
                </Flex>
              </AccordionToggle>
              <AccordionContent id={`seed-example-content-${seedExampleIndex}`}>
                <QuestionAnswerPairs
                  isSkillContribution={isSkillContribution}
                  seedExample={seedExample}
                  seedExampleIndex={seedExampleIndex}
                  onSelectContext={onSelectContext}
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
