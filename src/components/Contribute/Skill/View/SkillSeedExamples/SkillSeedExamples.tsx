// src/components/Contribute/Skill/SkillSeedExamples/SkillSeedExamples.tsx
import React from 'react';
import type { SkillSeedExample } from '@/types';
import { Flex, FlexItem } from '@patternfly/react-core';
import SkillSeedExampleCard from '@/components/Contribute/Skill/View/SkillSeedExamples/SkillSeedExampleCard';

interface Props {
  seedExamples: SkillSeedExample[];
}

const SkillSeedExamples: React.FC<Props> = ({ seedExamples }) => (
  <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
    {seedExamples.map((seedExample: SkillSeedExample, seedExampleIndex: number) => (
      <FlexItem key={seedExampleIndex}>
        <SkillSeedExampleCard seedExample={seedExample} seedExampleIndex={seedExampleIndex} />
      </FlexItem>
    ))}
  </Flex>
);

export default SkillSeedExamples;
