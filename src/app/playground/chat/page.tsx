// src/app/playground/chat/page.tsx
'use client';

import React from 'react';
import { PageSection, Content } from '@patternfly/react-core/';
import { AppLayout } from '@/components/AppLayout';
import ChatPageSidePanelHelp from '@/components/SidePanelContents/ChatPageSidePanelHelp';
import PageDescriptionWithHelp from '@/components/Common/PageDescriptionWithHelp';
import ModelsContextProvider from '../../../components/Chat/ModelsContext';
import ChatBotContainer from '../../../components/Chat/ChatBotContainer';

import './chatbotPage.css';

const ChatPage: React.FC = () => (
  <AppLayout className="chatBotPage">
    <PageSection>
      <Content component="h1">Chat with a model</Content>
      <PageDescriptionWithHelp
        description={`Before you start adding new skills and knowledge to your model, you can check its baseline
          performance by chatting with a language model that's hosted on your cloud. Choose a supported model
           from the model selector or configure your own custom endpoints to gain direct access
          to a specific model you've trained.`}
        helpText="Learn more about chatting with models"
        sidePanelContent={<ChatPageSidePanelHelp />}
      />
    </PageSection>
    <ModelsContextProvider>
      <ChatBotContainer />
    </ModelsContextProvider>
  </AppLayout>
);

export default ChatPage;
