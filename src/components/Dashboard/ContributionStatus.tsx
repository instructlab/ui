import React from 'react';
import { ContributionInfo } from '@/types';
import { Flex, FlexItem } from '@patternfly/react-core';
import { CheckCircleIcon, PficonTemplateIcon } from '@patternfly/react-icons';
import { t_global_icon_color_status_success_default as SuccessColor } from '@patternfly/react-tokens';

interface Props {
  contribution: ContributionInfo;
}

const ContributionStatus: React.FC<Props> = ({ contribution }) => (
  <Flex gap={{ default: 'gapXs' }} alignItems={{ default: 'alignItemsCenter' }}>
    {contribution.isDraft ? (
      <>
        <PficonTemplateIcon />
        <FlexItem>Draft</FlexItem>
      </>
    ) : (
      <>
        <CheckCircleIcon style={{ color: SuccessColor.var }} />
        <FlexItem>Submitted</FlexItem>
      </>
    )}
  </Flex>
);

export default ContributionStatus;
