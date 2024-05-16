// src/app/chat/page.tsx
import * as React from 'react';
import { ChatForm } from '../../components/Chat';
import { AppLayout } from '../../components/AppLayout';

const ChatPage: React.FC = () => {
  return (
    <AppLayout>
      <ChatForm />
    </AppLayout>
  );
};

export default ChatPage;
