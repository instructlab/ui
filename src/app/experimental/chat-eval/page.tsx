// src/app/experimental/chat-eval/page.tsx
'use client';

import * as React from 'react';
import '@patternfly/react-core/dist/styles/base.css';
import { AppLayout } from '@/components/AppLayout';
import ChatModelEval from '@/components/Experimental/ChatEval/ChatEval';

const ChatEval: React.FunctionComponent = () => {
  return (
    <AppLayout>
      <ChatModelEval />
    </AppLayout>
  );
};

export default ChatEval;
