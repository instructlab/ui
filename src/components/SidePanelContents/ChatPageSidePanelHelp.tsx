import * as React from 'react';
import { Content } from '@patternfly/react-core';
import SidePanelHelp from '@/components/SidePanelContents/SidePanelHelp';
import { CustomEndpointsBody, CustomEndpointsDescription, CustomEndpointsTitle } from '@/components/SidePanelContents/CustomEndpointsSidePanelHelp';

const ChatPageSidePanelHelp: React.FC = () => (
  <SidePanelHelp
    header="Chat with a model"
    description={
      <>
        Use <strong>Chat with a model</strong> to test the performance of 1 or 2 models at a time. You can select a supported model to chat with, or
        select one of your own models if it has a custom model endpoint configured.
      </>
    }
    body={
      <div>
        <strong>Comparing model responses</strong>
        <Content component="p">
          To change how many models you are chatting with at a time, click the <strong>Compare</strong> toggle. Toggling on the{' '}
          <strong>Compare</strong> feature enables you to send messages to 2 models or versions at once. This feature can be used to inspect the
          models’ outputs and identify differences in style or accuracy.
        </Content>
        <strong>{CustomEndpointsTitle}</strong>
        <Content component="p">
          <CustomEndpointsDescription />
        </Content>
        <CustomEndpointsBody />
      </div>
    }
  />
);

export default ChatPageSidePanelHelp;
