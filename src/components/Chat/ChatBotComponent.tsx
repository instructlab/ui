// src/components/Chat/ChatBotComponent.tsx
'use client';

import * as React from 'react';
import {
  Alert,
  AlertActionCloseButton,
  AlertGroup,
  Button,
  Dropdown,
  DropdownItem,
  DropdownList,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectList,
  SelectOption,
  Spinner
} from '@patternfly/react-core';
import {
  Chatbot,
  ChatbotContent,
  ChatbotDisplayMode,
  ChatbotHeader,
  ChatbotHeaderActions,
  ChatbotHeaderMain,
  ChatbotWelcomePrompt,
  Message,
  MessageBox,
  MessageProps
} from '@patternfly/chatbot';
import { Model } from '@/types';
import { modelFetcher } from '@/components/Chat/modelService';
const botAvatar = '/bot-icon-chat-32x32.svg';

import { EllipsisVIcon, TimesIcon } from '@patternfly/react-icons';
import styles from '@/components/Chat/chat.module.css';
import { ModelsContext } from '@/components/Chat/ModelsContext';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export const getId = () => {
  const date = Date.now() + Math.random();
  return date.toString();
};

type ChatbotComponentProps = {
  model: Model;
  messages: MessageProps[];
  setMessages: React.Dispatch<React.SetStateAction<MessageProps[]>>;
  showCompare: boolean;
  onCompare: () => void;
  onChangeModel: (model: Model) => void;
  onClose?: () => void;
  submittedMessage?: string;
  setFetching: (fetching: boolean) => void;
  setStopCallback: (stopFn: () => void) => void;
  setController: (controller: AbortController) => void;
};

const ChatBotComponent: React.FunctionComponent<ChatbotComponentProps> = ({
  model,
  messages,
  setMessages,
  showCompare,
  onCompare,
  onChangeModel,
  onClose,
  submittedMessage,
  setFetching,
  setStopCallback,
  setController
}) => {
  const { data: session } = useSession();
  const { availableModels } = React.useContext(ModelsContext);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [showNoModelAlert, setShowNoModelAlert] = React.useState<boolean>(false);
  const [showNoQuestionAlert, setShowNoQuestionAlert] = React.useState<boolean>(false);
  const scrollToBottomRef = React.useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = React.useState<string>();
  const [isActionsOpen, setActionsOpen] = React.useState<boolean>(false);
  const stopped = React.useRef<boolean>(false);
  const [userName, setUserName] = useState<string>('');
  const [userImage, setUserImage] = useState<string>('');

  useEffect(() => {
    if (session?.user?.name === 'Admin') {
      setUserName(session?.user?.name);
      setUserImage('/default-avatar.png');
    } else {
      setUserName(session?.user?.name ?? '');
      setUserImage(session?.user?.image || '');
    }
  }, [session?.user?.name, session?.user?.image]);

  React.useEffect(() => {
    setStopCallback(() => {
      stopped.current = true;
    });
    // only call at startup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = React.useCallback(
    async (input: string) => {
      if (!model) {
        setShowNoModelAlert(true);
        return;
      }
      if (!input.trim()) {
        setShowNoQuestionAlert(true);
        return;
      }

      const date = new Date();

      setMessages((prevMessages) => {
        const newMessage: MessageProps = {
          avatar: userImage,
          id: getId(),
          name: userName,
          role: 'user',
          content: input,
          timestamp: `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
        };
        return [...prevMessages, newMessage];
      });

      // make announcement to assistive devices that new messages have been added
      setAnnouncement(`Message from You: ${input}. Message from Chatbot is loading.`);

      setIsLoading(true);
      setFetching(true);

      const setCurrentMessage = (message: string) => {
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const newMessage: MessageProps = {
            avatar: botAvatar,
            id: getId(),
            name: model?.modelName ?? model?.name,
            role: 'bot',
            content: message,
            timestamp: `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
          };

          if (lastMessage.role !== 'bot') {
            return [...prevMessages, newMessage];
          }
          return [...prevMessages.slice(0, -1), newMessage];
        });
      };

      stopped.current = false;
      await modelFetcher(model, input, setCurrentMessage, setController);

      setIsLoading(false);
      setFetching(false);
    },
    [model, setController, setFetching, setMessages, userImage, userName]
  );

  React.useEffect(() => {
    if (submittedMessage) {
      handleSubmit(submittedMessage);
    }
    // Do not update when handleSubmit changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedMessage]);

  const onToggleClick = () => {
    setIsSelectOpen(!isSelectOpen);
  };

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    const selected = availableModels.find((model) => model.name === value) || null;
    if (selected && selected !== model) {
      setIsSelectOpen(false);
      handleCleanup();
      onChangeModel(selected);
    }
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isSelectOpen} style={{ width: '200px' }}>
      {model ? model.name : 'Select a model'}
    </MenuToggle>
  );

  const dropdownItems = React.useMemo(
    () =>
      availableModels.map((model, index) => (
        <SelectOption key={index} value={model.name}>
          {model.name}
        </SelectOption>
      )),
    [availableModels]
  );

  // Auto-scrolls to the latest message
  React.useEffect(() => {
    if (scrollToBottomRef.current) {
      // don't scroll the first load, but scroll if there's a current stream or a new source has popped up
      if (messages.length > 0) {
        scrollToBottomRef.current.scrollIntoView();
      }
    }
  }, [messages]);

  const handleCleanup = () => {
    setMessages([]);
  };

  return (
    <Chatbot displayMode={ChatbotDisplayMode.embedded}>
      <ChatbotHeader className={styles.chatHeader}>
        <ChatbotHeaderMain>
          <Select
            id="single-select"
            isOpen={isSelectOpen}
            selected={model ? model.name : 'Select a model'}
            onSelect={onSelect}
            onOpenChange={(isOpen) => setIsSelectOpen(isOpen)}
            toggle={toggle}
            shouldFocusToggleOnSelect
          >
            <SelectList>{dropdownItems}</SelectList>
          </Select>
        </ChatbotHeaderMain>
        <ChatbotHeaderActions>
          {showCompare ? (
            <Button variant="primary" onClick={onCompare}>
              Compare
            </Button>
          ) : null}
          <Dropdown
            onOpenChange={(isOpened) => setActionsOpen(isOpened)}
            onSelect={() => setActionsOpen(false)}
            toggle={(toggleRef) => (
              <MenuToggle
                aria-label="actions"
                variant="plain"
                ref={toggleRef}
                onClick={() => setActionsOpen(!isActionsOpen)}
                isExpanded={isActionsOpen}
              >
                <EllipsisVIcon />
              </MenuToggle>
            )}
            isOpen={isActionsOpen}
            popperProps={{ position: 'right' }}
          >
            <DropdownList>
              <DropdownItem onClick={handleCleanup}>Clear chat</DropdownItem>
              {onClose ? <DropdownItem onClick={onClose}>Close chat</DropdownItem> : null}
            </DropdownList>
          </Dropdown>
          {onClose ? <Button variant="plain" icon={<TimesIcon />} onClick={onClose} /> : null}
        </ChatbotHeaderActions>
      </ChatbotHeader>
      <ChatbotContent>
        <MessageBox announcement={announcement} className={styles.chatBotMessage}>
          <ChatbotWelcomePrompt title={`Hello, ${userName}`} description="Go ahead and ask me a question." />
          {messages.map((message) => (
            <Message key={message.id} {...message} />
          ))}
          {isLoading && <Spinner aria-label="Loading" size="lg" />}
          <div ref={scrollToBottomRef}></div>
        </MessageBox>
      </ChatbotContent>
      {showNoModelAlert && (
        <div>
          <AlertGroup isToast isLiveRegion>
            <Alert
              timeout
              variant="danger"
              title="No Model Selected. Please select the model from the dropdown list."
              ouiaId="DangerAlert"
              actionClose={<AlertActionCloseButton onClose={() => setShowNoModelAlert(false)} />}
            ></Alert>
          </AlertGroup>
        </div>
      )}
      {showNoQuestionAlert && (
        <div>
          <AlertGroup isToast isLiveRegion>
            <Alert
              timeout
              variant="danger"
              title="No Question Added. Please write a question in the provided text box."
              ouiaId="DangerAlert"
              actionClose={<AlertActionCloseButton onClose={() => setShowNoQuestionAlert(false)} />}
            />
          </AlertGroup>
        </div>
      )}
    </Chatbot>
  );
};

export { ChatBotComponent };
