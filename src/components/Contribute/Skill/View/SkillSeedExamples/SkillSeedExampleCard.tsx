// src/components/Contribute/Skill/View/SkillSeedExampleCard.tsx
import React from 'react';
import { Button, Card, CardBody, CardHeader, CardTitle, Flex, FlexItem, Icon } from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons';
import { SkillSeedExample } from '@/types';
import SkillQuestionAnswerPairs from '@/components/Contribute/Skill/View/SkillSeedExamples/SkillQuestionAnswerPairs';

interface Props {
  seedExample: SkillSeedExample;
  seedExampleIndex: number;
}

const SkillSeedExampleCard: React.FC<Props> = ({ seedExample, seedExampleIndex }) => {
  const [expanded, setExpanded] = React.useState<boolean>(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <Flex gap={{ default: 'gapMd' }}>
            <FlexItem>
              <Button
                variant="link"
                isInline
                onClick={() => setExpanded((prev) => !prev)}
                aria-label={`Expand seed example ${seedExampleIndex + 1}`}
                icon={<Icon>{seedExample.isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}</Icon>}
              />
            </FlexItem>
            <FlexItem>Seed example {seedExampleIndex + 1}</FlexItem>
          </Flex>
        </CardTitle>
      </CardHeader>
      {expanded ? (
        <CardBody>
          <SkillQuestionAnswerPairs seedExample={seedExample} />
        </CardBody>
      ) : null}
    </Card>
  );
};

export default SkillSeedExampleCard;
