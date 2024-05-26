// src/components/CurlCommandModal
'use client';
import React from 'react';
import { Modal } from '@patternfly/react-core/components';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/next/components/Modal';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { CodeBlock } from '@patternfly/react-core/dist/dynamic/components/CodeBlock';
import { CodeBlockCode } from '@patternfly/react-core/dist/dynamic/components/CodeBlock';
import CopyToClipboardButton from '../../components/CopyToClipboardButton';

interface CurlCommandModalProps {
  isModalOpen: boolean;
  handleModalToggle: () => void;
  systemRole: string;
  messages: Message[];
  newMessages: Message[];
  temperature: number;
  maxTokens: number;
  topP: number;
  frequencyPenalty: number;
  presencePenalty: number;
  repetitionPenalty: number;
  selectedModel: Model | null;
}

interface Message {
  text: string;
  isUser: boolean;
}

interface Model {
  name: string;
  apiURL: string;
  modelName: string;
}

const sanitizeMessages = (messages: Message[]) => {
  return messages.map((message) => ({
    role: message.isUser ? 'user' : 'assistant',
    content: message.text,
  }));
};

const CurlCommandModal: React.FC<CurlCommandModalProps> = ({
  isModalOpen,
  handleModalToggle,
  systemRole,
  messages,
  newMessages,
  temperature,
  maxTokens,
  topP,
  frequencyPenalty,
  presencePenalty,
  repetitionPenalty,
  selectedModel,
}) => {
  const allMessages = [{ role: 'system', content: systemRole }, ...sanitizeMessages(messages), ...sanitizeMessages(newMessages)].filter(
    (msg) => msg.content
  ); // Filter out any empty messages

  const curlCommand = `
curl ${selectedModel?.apiURL}/v1/chat/completions \\
-H "Content-Type: application/json" \\
-H "Authorization: Bearer $OPENAI_API_KEY" \\
-k \\
-d '{
  "model": "${selectedModel?.modelName}",
  "messages": ${JSON.stringify(allMessages, null, 2)},
  "temperature": ${temperature},
  "max_tokens": ${maxTokens},
  "top_p": ${topP},
  "frequency_penalty": ${frequencyPenalty},
  "presence_penalty": ${presencePenalty},
  "repetition_penalty": ${repetitionPenalty},
  "stop": ["<|endoftext|>"]
}'`;

  return (
    <Modal
      variant={ModalVariant.medium}
      title="View code"
      isOpen={isModalOpen}
      onClose={handleModalToggle}
      actions={[
        <Button key="close" variant="primary" onClick={handleModalToggle}>
          Close
        </Button>,
        <CopyToClipboardButton key="copy" text={curlCommand} />,
      ]}
    >
      <CodeBlock>
        <CodeBlockCode>{curlCommand}</CodeBlockCode>
      </CodeBlock>
    </Modal>
  );
};

export default CurlCommandModal;
