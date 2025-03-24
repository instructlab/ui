// src/components/Chat/ChatBotContainer.tsx
'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChatbotFooter, ChatbotFootnote, Compare, MessageBar, MessageProps } from '@patternfly/chatbot';
import { Model } from '@/types';
import { ModelsContext } from './ModelsContext';
import { ChatBotComponent } from './ChatBotComponent';

import '@patternfly/chatbot/dist/css/main.css';
import styles from './chat.module.css';

const MAX_COMPARES = 2;

const ChatBotContainer: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { availableModels } = React.useContext(ModelsContext);
  const modelNames: string[] = React.useMemo(
    () => searchParams.get('models')?.split(',') ?? [availableModels[0]?.name],
    [searchParams, availableModels]
  );
  const [submittedMessage, setSubmittedMessage] = React.useState<string>();

  const [mainChatMessages, setMainChatMessages] = React.useState<MessageProps[]>([]);
  const [mainChatFetching, setMainChatFetching] = React.useState<boolean>();
  const [mainChatController, setMainChatController] = React.useState<AbortController>();
  const stopMainChatFn = React.useRef<() => void>();

  const [altChatMessages, setAltChatMessages] = React.useState<MessageProps[]>([]);
  const [altChatFetching, setAltChatFetching] = React.useState<boolean>();
  const [altChatController, setAltChatController] = React.useState<AbortController | null>();
  const stopAltChatFn = React.useRef<() => void>();

  const selectedModels = React.useMemo(
    () =>
      modelNames.reduce<Model[]>((acc, nextName) => {
        const model = availableModels.find((m) => m.name === nextName);
        if (model) {
          acc.push(model);
        }
        return acc;
      }, []),
    [modelNames, availableModels]
  );

  const onCloseChat = (indexToRemove: number) => {
    const remaining = [...modelNames.slice(0, indexToRemove), ...modelNames.slice(indexToRemove + 1)];

    // If the main chat is closed, move the alt messages to the main messages os they are retained
    if (indexToRemove === 0) {
      setMainChatMessages(altChatMessages);
    }

    // Clear the alt info
    setAltChatMessages([]);
    setAltChatController(null);
    stopAltChatFn.current = undefined;

    router.push(`/playground/chat/?models=${remaining.join(',')}`);
  };

  const onChangeModel = (indexToChange: number, model: Model) => {
    const updateNames = [...modelNames];
    updateNames[indexToChange] = model.name;
    router.push(`/playground/chat/?models=${updateNames.join(',')}`);
  };

  const onCompare = () => {
    console.log(`OnCompare: ${modelNames.length} of ${MAX_COMPARES}`);
    if (modelNames.length < MAX_COMPARES && availableModels.length > 1) {
      const updateNames = [...modelNames, availableModels[0].name];
      router.push(`/playground/chat/?models=${updateNames.join(',')}`);
    }
  };

  const handleStopButton = () => {
    if (mainChatController) {
      mainChatController.abort();
    }
    if (altChatController) {
      altChatController.abort();
    }
  };

  const mainChat = (
    <ChatBotComponent
      model={selectedModels[0]}
      showCompare={selectedModels.length < MAX_COMPARES}
      onCompare={onCompare}
      messages={mainChatMessages}
      setMessages={setMainChatMessages}
      submittedMessage={submittedMessage}
      setFetching={setMainChatFetching}
      setController={setMainChatController}
      setStopCallback={(stopFunction) => {
        stopMainChatFn.current = stopFunction;
      }}
      onChangeModel={(model) => onChangeModel(0, model)}
      onClose={selectedModels.length > 1 ? () => onCloseChat(0) : undefined}
    />
  );

  const altChat =
    selectedModels.length > 1 ? (
      <ChatBotComponent
        model={selectedModels[1]}
        showCompare={false}
        onCompare={onCompare}
        messages={altChatMessages}
        setMessages={setAltChatMessages}
        submittedMessage={submittedMessage}
        setFetching={setAltChatFetching}
        setController={setAltChatController}
        setStopCallback={(stopFunction) => {
          stopAltChatFn.current = stopFunction;
        }}
        onChangeModel={(model) => onChangeModel(1, model)}
        onClose={() => onCloseChat(1)}
      />
    ) : null;

  return (
    <>
      {altChat ? (
        <div className="pf-chatbot__compare-container">
          <Compare
            firstChild={mainChat}
            secondChild={altChat}
            firstChildDisplayName={selectedModels[0]?.modelName || 'Select a model'}
            secondChildDisplayName={selectedModels[1]?.modelName || 'Select a model'}
          />
        </div>
      ) : (
        <div className={styles.chatBotContainer}>{mainChat}</div>
      )}
      <ChatbotFooter>
        <MessageBar
          className={styles.chatBotMessageBar}
          onSendMessage={(message) => {
            setSubmittedMessage(typeof message === 'string' ? message : String(message));
          }}
          hasMicrophoneButton
          hasAttachButton={false}
          isSendButtonDisabled={mainChatFetching || altChatFetching}
          hasStopButton={mainChatFetching || altChatFetching}
          handleStopButton={handleStopButton}
        />
        <ChatbotFootnote label="Verify all information from this tool. LLMs make mistakes." />
      </ChatbotFooter>
    </>
  );
};

export default ChatBotContainer;
