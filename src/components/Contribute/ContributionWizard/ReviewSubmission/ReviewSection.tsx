import * as React from 'react';
import { Content, ContentVariants, DescriptionList, Flex, FlexItem } from '@patternfly/react-core';

interface Props {
  title: React.ReactNode;
  descriptionText?: React.ReactNode;
  descriptionItems: React.ReactNode[];
}

const ReviewSection: React.FC<Props> = ({ title, descriptionText, descriptionItems }) => (
  <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
    <FlexItem>
      <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
        <FlexItem>
          <Content>{title}</Content>
        </FlexItem>
        {descriptionText ? (
          <FlexItem>
            <Content component={ContentVariants.small} className="submission-subtitles">
              {descriptionText}
            </Content>
          </FlexItem>
        ) : null}
      </Flex>
    </FlexItem>
    <FlexItem>
      <DescriptionList isCompact>{descriptionItems}</DescriptionList>
    </FlexItem>
  </Flex>
);

export default ReviewSection;
