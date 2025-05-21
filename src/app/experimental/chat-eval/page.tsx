// src/app/experimental/chat-eval/page.tsx
'use client';

import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout, FeaturePages } from '@/components/AppLayout';
import ChatEval from '@/components/Experimental/ChatEval/ChatEval';

const ChatEvalPage: React.FunctionComponent = () => {
  return (
    <AppLayout className="chatBotPage" requiredFeature={FeaturePages.Experimental}>
      <ChatEval />
    </AppLayout>
  );
};

export default ChatEvalPage;
