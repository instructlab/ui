// src/app/playground/chat/page.tsx
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button, PageSection, Content } from '@patternfly/react-core/';
import { t_global_spacer_sm as SmSpacerSize } from '@patternfly/react-tokens';
import { AppLayout } from '@/components/AppLayout';
import ModelsContextProvider from '../../../components/Chat/ModelsContext';
import ChatBotContainer from '../../../components/Chat/ChatBotContainer';

import './chatbotPage.css';

const ChatPage: React.FC = () => {
  const router = useRouter();

  return (
    <AppLayout className="chatBotPage">
      <PageSection>
        <Content component="h1">Chat with a model</Content>
        <Content style={{ marginBottom: SmSpacerSize.var }}>
          {`Before you start adding new skills and knowledge to your model, you can check its baseline
          performance by chatting with a language model that's hosted on your cloud. Choose a supported model
           from the model selector or configure your own custom endpoints to gain direct access
          to a specific model you've trained.`}
        </Content>
        <Button
          component="a"
          href="/playground/endpoints"
          variant="link"
          isInline
          onClick={(e) => {
            e.preventDefault();
            router.push('/playground/endpoints');
          }}
        >
          Learn more about managing custom model endpoints
        </Button>
      </PageSection>
      <ModelsContextProvider>
        <ChatBotContainer />
      </ModelsContextProvider>
    </AppLayout>
  );
};

export default ChatPage;
