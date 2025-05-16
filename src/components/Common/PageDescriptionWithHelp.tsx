// src/app/components/Common/PageDescriptionWithHelp.tsx
'use client';

import * as React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { useSideDrawer } from '@/context/SideDrawerContext';
import XsOpenDrawerRightIcon from '@/components/Common/XsOpenDrawerRightIcon';

interface Props {
  description: React.ReactNode;
  helpText: React.ReactNode;
  sidePanelContent: React.ReactNode;
}

const PageDescriptionWithHelp: React.FC<Props> = ({ description, helpText, sidePanelContent }) => {
  const sideDrawerContext = useSideDrawer();

  return (
    <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }}>
      <FlexItem>{description}</FlexItem>
      <FlexItem>
        <Button
          variant="link"
          isInline
          icon={<XsOpenDrawerRightIcon />}
          iconPosition="end"
          onClick={() => sideDrawerContext.setSideDrawerContent(sidePanelContent)}
        >
          {helpText}
        </Button>
      </FlexItem>
    </Flex>
  );
};

export default PageDescriptionWithHelp;
