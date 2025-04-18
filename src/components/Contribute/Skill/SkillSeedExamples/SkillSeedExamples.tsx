// src/components/Contribute/Skill/SkillSeedExamples/SkillSeedExamples.tsx
import React from 'react';
import type { SkillSeedExample } from '@/types';
import { Accordion, AccordionContent, AccordionItem, AccordionToggle, Button, Flex, FlexItem } from '@patternfly/react-core';
import { ExternalLinkAltIcon, PlusCircleIcon, TrashIcon } from '@patternfly/react-icons';
import {
  createEmptySkillSeedExample,
  handleSkillSeedExamplesAnswerBlur,
  handleSkillSeedExamplesAnswerInputChange,
  handleSkillSeedExamplesContextInputChange,
  handleSkillSeedExamplesQuestionBlur,
  handleSkillSeedExamplesQuestionInputChange,
  toggleSkillSeedExamplesExpansion
} from '@/components/Contribute/Utils/seedExampleUtils';
import SkillQuestionAnswerPairs from '@/components/Contribute/Skill/SkillSeedExamples/SkillQuestionAnswerPairs';
import WizardPageHeader from '@/components/Common/WizardPageHeader';

interface Props {
  seedExamples: SkillSeedExample[];
  onUpdateSeedExamples: (seedExamples: SkillSeedExample[]) => void;
}

const SkillSeedExamples: React.FC<Props> = ({ seedExamples, onUpdateSeedExamples }) => {
  const handleContextInputChange = (seedExampleIndex: number, contextValue: string): void => {
    onUpdateSeedExamples(handleSkillSeedExamplesContextInputChange(seedExamples, seedExampleIndex, contextValue));
  };

  const handleQuestionInputChange = (seedExampleIndex: number, questionValue: string): void =>
    onUpdateSeedExamples(handleSkillSeedExamplesQuestionInputChange(seedExamples as SkillSeedExample[], seedExampleIndex, questionValue));

  const handleQuestionBlur = (seedExampleIndex: number): void =>
    onUpdateSeedExamples(handleSkillSeedExamplesQuestionBlur(seedExamples, seedExampleIndex));

  const handleAnswerInputChange = (seedExampleIndex: number, answerValue: string): void => {
    onUpdateSeedExamples(handleSkillSeedExamplesAnswerInputChange(seedExamples, seedExampleIndex, answerValue));
  };

  const handleAnswerBlur = (seedExampleIndex: number): void => {
    onUpdateSeedExamples(handleSkillSeedExamplesAnswerBlur(seedExamples, seedExampleIndex));
  };

  const toggleSeedExampleExpansion = (index: number): void => {
    onUpdateSeedExamples(toggleSkillSeedExamplesExpansion(seedExamples, index));
  };

  const addSeedExample = (): void => {
    const seedExample = createEmptySkillSeedExample();
    seedExample.immutable = false;
    seedExample.isExpanded = true;
    onUpdateSeedExamples([...seedExamples, seedExample]);
    window.analytics.trackSingleItem("Added Seed", {isSkillContribution: true});
  };

  const deleteSeedExample = (seedExampleIndex: number): void => {
    onUpdateSeedExamples(seedExamples.filter((_, index: number) => index !== seedExampleIndex));
    window.analytics.trackSingleItem("Deleted Seed", {isSkillContribution: true});
  };

  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader
          title="Create seed data"
          description={
            <>
              Seed data consists of question-and-answer (Q and A) pairs which provide instructions for completing tasks. Provide at least 5 Q and A
              pairs.{' '}
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
          {seedExamples.map((seedExample: SkillSeedExample, seedExampleIndex: number) => (
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
                <SkillQuestionAnswerPairs
                  seedExample={seedExample}
                  seedExampleIndex={seedExampleIndex}
                  handleContextInputChange={handleContextInputChange}
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
            Add Q and A pair
          </Button>
        </div>
      </FlexItem>
    </Flex>
  );
};

export default SkillSeedExamples;
