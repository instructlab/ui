import React from 'react';
import { Content, Popover, Button, Flex, FlexItem } from '@patternfly/react-core';
import { t_global_spacer_sm as SmallSpacerSize } from '@patternfly/react-tokens';
import XsOutlinedQuestionCircleIcon from '@/components/Common/XsOutlinedQuestionCircleIcon';

interface Props {
  title: React.ReactNode;
  description?: React.ReactNode;
  helpInfo?: React.ReactNode;
}
const FormSectionHeader: React.FC<Props> = ({ title, description, helpInfo }) => (
  <>
    <Flex gap={{ default: 'gapSm' }} alignItems={{ default: 'alignItemsCenter' }}>
      <FlexItem>
        <Content component="h3">{title}</Content>
      </FlexItem>
      {helpInfo ? (
        <FlexItem>
          <Popover bodyContent={helpInfo}>
            <Button isInline variant="link" aria-label="more info">
              <XsOutlinedQuestionCircleIcon />
            </Button>
          </Popover>
        </FlexItem>
      ) : null}
    </Flex>
    {description ? (
      <Content component="small" style={{ marginTop: SmallSpacerSize.var }}>
        {description}
      </Content>
    ) : null}
  </>
);

export default FormSectionHeader;
