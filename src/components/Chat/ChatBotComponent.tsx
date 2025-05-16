// src/components/Chat/ChatBotComponent.tsx
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
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
  Popover,
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
import { modelFetcher } from '@/services/modelService';
import { ModelsContext } from '@/components/Chat/ModelsContext';
import { EllipsisVIcon, OutlinedQuestionCircleIcon, TimesIcon } from '@patternfly/react-icons';

const botAvatar = '/bot-icon-chat-32x32.svg';

export const getId = () => {
  const date = Date.now() + Math.random();
  return date.toString();
};

type ChatbotComponentProps = {
  model: Model;
  userName: string;
  messages: MessageProps[];
  setMessages: React.Dispatch<React.SetStateAction<MessageProps[]>>;
  showCompare: boolean;
  onCompare: () => void;
  onChangeModel: (model: Model) => void;
  onClose?: () => void;
  submittedMessage?: MessageProps;
  setFetching: (fetching: boolean) => void;
  setStopCallback: (stopFn: () => void) => void;
  setController: (controller: AbortController) => void;
};

const ChatBotComponent: React.FunctionComponent<ChatbotComponentProps> = ({
  model,
  userName,
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
  const router = useRouter();
  const { availableModels } = React.useContext(ModelsContext);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [showNoModelAlert, setShowNoModelAlert] = React.useState<boolean>(false);
  const [showNoQuestionAlert, setShowNoQuestionAlert] = React.useState<boolean>(false);
  const scrollToBottomRef = React.useRef<HTMLDivElement>(null);
  const [announcement, setAnnouncement] = React.useState<string>();
  const [isActionsOpen, setActionsOpen] = React.useState<boolean>(false);
  const stopped = React.useRef<boolean>(false);
  const lastQuestionRef = React.useRef<string>();

  React.useEffect(() => {
    setStopCallback(() => {
      stopped.current = true;
    });
    // only call at startup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = React.useCallback(
    async (message: MessageProps) => {
      if (!model) {
        setShowNoModelAlert(true);
        return;
      }
      if (!message.content?.trim()) {
        setShowNoQuestionAlert(true);
        return;
      }

      const date = new Date();

      setMessages((prevMessages) => {
        return [...prevMessages, message];
      });

      // make announcement to assistive devices that new messages have been added
      setAnnouncement(`Message from You: ${message.content}. Message from Chatbot is loading.`);

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
      try {
        await modelFetcher(model, message.content, setCurrentMessage, setController);
      } catch (e) {
        console.error(`Model fetch failed: `, e);
      }

      setIsLoading(false);
      setFetching(false);
    },
    [model, setController, setFetching, setMessages]
  );

  React.useEffect(() => {
    if (submittedMessage && submittedMessage.id !== lastQuestionRef.current) {
      lastQuestionRef.current = submittedMessage.id;
      handleSubmit(submittedMessage);
    }
    // Do not update when handleSubmit changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submittedMessage, handleSubmit]);

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
      {model && model.enabled ? model.name : 'Select a model'}
    </MenuToggle>
  );

  const dropdownItems = React.useMemo(
    () =>
      availableModels.map((model, index) => (
        <SelectOption isDisabled={!model.enabled ? true : false} key={index} value={model.name}>
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
      <ChatbotHeader>
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
          <Popover
            aria-label="select model help"
            headerContent={`Can't select your model?`}
            bodyContent={
              <div>
                If your model is not selectable, that means you have disabled the custom model endpoint. To change this please see the{' '}
                <Button isInline variant="link" onClick={() => router.push('./endpoints')}>
                  Custom Model Endpoints
                </Button>{' '}
                page.
              </div>
            }
          >
            <Button variant="plain" isInline aria-label="More info">
              <OutlinedQuestionCircleIcon />
            </Button>
          </Popover>
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
        <MessageBox announcement={announcement}>
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
