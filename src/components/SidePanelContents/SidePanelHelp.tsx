import * as React from 'react';
import {
  DrawerActions,
  DrawerCloseButton,
  DrawerContentBody,
  DrawerHead,
  DrawerPanelContent,
  DrawerPanelDescription,
  Title
} from '@patternfly/react-core';
import { useSideDrawer } from '@/context/SideDrawerContext';

import './SidePanelContents.scss';

interface Props {
  header: React.ReactNode;
  actions?: React.ReactNode;
  description?: React.ReactNode;
  body: React.ReactNode;
}
const SidePanelHelp: React.FC<Props> = ({ header, actions, description, body }) => {
  const sideDrawerContext = useSideDrawer();

  return (
    <DrawerPanelContent isResizable defaultSize={'300px'} minSize={'150px'}>
      <DrawerHead>
        <Title headingLevel="h2">{header}</Title>
        <DrawerActions>
          {actions}
          <DrawerCloseButton onClick={() => sideDrawerContext.close()} />
        </DrawerActions>
      </DrawerHead>
      {description ? <DrawerPanelDescription>{description}</DrawerPanelDescription> : null}
      <DrawerContentBody className="side-panel-contents">{body}</DrawerContentBody>
    </DrawerPanelContent>
  );
};

export default SidePanelHelp;
