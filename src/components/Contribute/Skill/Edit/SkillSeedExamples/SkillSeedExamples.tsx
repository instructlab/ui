// src/components/Contribute/Skill/SkillSeedExamples/SkillSeedExamples.tsx
import React from 'react';
import type { SkillSeedExample } from '@/types';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import {
  createEmptySkillSeedExample,
  handleSkillSeedExamplesAnswerBlur,
  handleSkillSeedExamplesAnswerInputChange,
  handleSkillSeedExamplesContextInputChange,
  handleSkillSeedExamplesQuestionBlur,
  handleSkillSeedExamplesQuestionInputChange
} from '@/components/Contribute/Utils/seedExampleUtils';
import XsExternalLinkAltIcon from '@/components/Common/XsExternalLinkAltIcon';
import FormSectionHeader from '@/components/Common/FormSectionHeader';
import SkillSeedExampleCard from '@/components/Contribute/Skill/Edit/SkillSeedExamples/SkillSeedExampleCard';

interface Props {
  seedExamples: SkillSeedExample[];
  onUpdateSeedExamples: (seedExamples: SkillSeedExample[]) => void;
}

const SkillSeedExamples: React.FC<Props> = ({ seedExamples, onUpdateSeedExamples }) => {
  const onUpdateSeedExample = (seedExampleIndex: number, seedExample: SkillSeedExample): void => {
    onUpdateSeedExamples(seedExamples.map((nextExample, i) => (i === seedExampleIndex ? seedExample : nextExample)));
  };

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

  const addSeedExample = (): void => {
    const seedExample = createEmptySkillSeedExample();
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
        <FormSectionHeader
          title="Create seed data"
          description={
            <>
              Seed data consists of question-and-answer (Q and A) pairs which provide instructions for completing tasks. Provide at least 5 Q and A
              pairs.{' '}
              <Button
                variant="link"
                component="a"
                isInline
                href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples"
                target="_blank"
                rel="noopener noreferrer"
                icon={<XsExternalLinkAltIcon />}
                iconPosition="end"
              >
                Learn more about seed examples
              </Button>
            </>
          }
        />
      </FlexItem>
      {seedExamples.map((seedExample: SkillSeedExample, seedExampleIndex: number) => (
        <FlexItem key={seedExampleIndex}>
          <SkillSeedExampleCard
            seedExample={seedExample}
            onUpdateSeedExample={onUpdateSeedExample}
            seedExampleIndex={seedExampleIndex}
            handleContextInputChange={handleContextInputChange}
            handleQuestionInputChange={handleQuestionInputChange}
            handleQuestionBlur={handleQuestionBlur}
            handleAnswerInputChange={handleAnswerInputChange}
            handleAnswerBlur={handleAnswerBlur}
            onDeleteSeedExample={() => deleteSeedExample(seedExampleIndex)}
          />
        </FlexItem>
      ))}
      <FlexItem>
        <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
          <Button icon={<PlusCircleIcon />} variant="link" type="button" onClick={addSeedExample}>
            Add seed example
          </Button>
        </div>
      </FlexItem>
    </Flex>
  );
};

export default SkillSeedExamples;
