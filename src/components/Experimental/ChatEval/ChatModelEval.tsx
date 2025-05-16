// src/components/Experimental/ChatEval/ChatEval.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import {
  Select,
  SelectList,
  MenuToggleElement,
  MenuToggle,
  SelectOption,
  Flex,
  Dropdown,
  DropdownList,
  DropdownItem,
  Alert
} from '@patternfly/react-core';
import { Model, ServingModel } from '@/types';
import {
  Chatbot,
  ChatbotHeader,
  ChatbotHeaderMain,
  ChatbotHeaderActions,
  ChatbotContent,
  MessageBox,
  Message,
  MessageProps,
  MessageBar,
  ChatbotWelcomePrompt,
  ChatbotFooter,
  ChatbotFootnote,
  ChatbotAlert,
  ChatbotDisplayMode
} from '@patternfly/chatbot';
import logo from '../../../../public/bot-icon-chat-32x32.svg';
import userLogo from '../../../../public/default-avatar.svg';
import { EllipsisVIcon } from '@patternfly/react-icons';
import ChatModelLogViewer from '@/components/Experimental/ChatEval/ChatModelLogViewer';
import { fetchModelJobId, fetchModelStatus, isServingModel, modelFetcher } from '@/services/modelService';

const MAX_MODEL_STARTUP_TIME = 30 * 1000;

const STATUS_POLL_INTERVAL = 10 * 1000;

const mapModelName = (model: Model): string => (model as ServingModel).vvlmName || model.modelName;

interface Props {
  compareSide: 'left' | 'right';
  userName: string;
  userImage: string;
  freeGpus: number;
  models: Model[];
  isUnifiedInput: boolean;
  unifiedMessage?: MessageProps | null;
  onModelSelected: (selected: Model | null) => void;
}

const ChatModelEval: React.FC<Props> = ({ compareSide, userName, userImage, freeGpus, models, isUnifiedInput, unifiedMessage, onModelSelected }) => {
  const [question, setQuestion] = useState<string>('');
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ title: string; message: string; variant: 'danger' | 'info' } | undefined>();
  const [loadError, setLoadError] = useState<string | undefined>();
  const [isUnloading, setIsUnloading] = useState(false);
  const [modelStatus, setModelStatus] = useState<string | undefined>();
  const [jobId, setJobId] = useState<string>();
  const lastQuestionRef = useRef<string>();
  const scrollToBottomRef = useRef<HTMLDivElement>(null);
  const [isActionsOpen, setActionsOpen] = useState<boolean>(false);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  const handleSendMessage = React.useCallback(
    async (userMessage: MessageProps) => {
      if (userMessage.id === lastQuestionRef.current || !userMessage.content) {
        return;
      }
      lastQuestionRef.current = userMessage.id;

      // Alert the user if no model is selected
      if (!selectedModel) {
        setAlertMessage({
          title: 'No Model Selected',
          message: 'Please select a model before sending a prompt.',
          variant: 'danger'
        });
        return;
      }

      setMessages((prev) => [...prev, userMessage]);
      setQuestion('');

      const botMsgId = `${Date.now()}_bot`;

      const setCurrentMessage = (message: string) => {
        setMessages((prevMessages) => {
          const lastMessage = prevMessages[prevMessages.length - 1];
          const newMessage: MessageProps = {
            avatar: logo.src,
            id: botMsgId,
            name: 'Bot',
            role: 'bot',
            content: message,
            timestamp: new Date().toLocaleTimeString(),
            isLoading: false
          };

          if (lastMessage.role !== 'bot') {
            return [...prevMessages, newMessage];
          }
          return [...prevMessages.slice(0, -1), newMessage];
        });
      };

      await modelFetcher(selectedModel, userMessage.content, setCurrentMessage);
    },
    [selectedModel]
  );

  const handleSend = React.useCallback(
    async (message: string | number) => {
      const question = String(message).trim();
      const userMsgId = `${Date.now()}_user`;

      // Prevent sending empty messages
      if (!question) {
        console.warn(`Attempted to send an empty message on the ${compareSide} side.`);
        return;
      }

      // Add the user's message to the chat
      const userMessage: MessageProps = {
        id: userMsgId,
        role: 'user',
        content: question,
        name: 'User',
        avatar: userImage || userLogo.src,
        timestamp: new Date().toLocaleTimeString()
      };

      await handleSendMessage(userMessage);
    },
    [handleSendMessage, compareSide, userImage]
  );

  React.useEffect(() => {
    if (isUnifiedInput && unifiedMessage) {
      if (!selectedModel) {
        setAlertMessage({
          title: 'No Model Selected',
          message: `Please select a model for the ${compareSide} panel.`,
          variant: 'danger'
        });
        return;
      }

      handleSendMessage(unifiedMessage);
    }
  }, [handleSendMessage, selectedModel, compareSide, isUnifiedInput, unifiedMessage]);

  useEffect(() => {
    let canceled = false;
    let intervalId: NodeJS.Timeout;

    if (!selectedModel) {
      return;
    }

    const watchStatus = async () => {
      let initStatus = false;
      const startTime = new Date().getTime();
      setModelStatus('pending');
      setJobId(undefined);
      setLoadError(undefined);

      const fetchStatus = async () => {
        const status = await fetchModelStatus(selectedModel);

        if (!canceled) {
          if (status !== 'stopped') {
            setModelStatus(status);
            initStatus = true;
          } else if (initStatus || Date.now() - startTime > MAX_MODEL_STARTUP_TIME) {
            // Keep loading until we have tried long enough
            setModelStatus('stopped');
          }
        }
      };

      // Get the job id for serving models
      if (isServingModel(selectedModel)) {
        const { jobId: job_id, error } = await fetchModelJobId(selectedModel as ServingModel);
        if (error) {
          setLoadError('Invalid response returned from serving model');
        }
        if (job_id) {
          const loadingAlert = {
            title: 'Model Loading',
            message: 'One moment while the model is loading. Click "View Logs" in the menu above for details',
            variant: 'info' as const
          };

          setAlertMessage(loadingAlert);
          setTimeout(() => setAlertMessage(undefined), 3000);

          setJobId(job_id);
        }
      }

      // fetch once
      await fetchStatus();

      // poll every X seconds
      if (!canceled) {
        intervalId = setInterval(fetchStatus, STATUS_POLL_INTERVAL);
      }
    };

    watchStatus();

    return () => {
      clearInterval(intervalId);
      canceled = true;
    };
  }, [selectedModel]);

  const onSelectModel = async (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    setIsSelectOpen(false);

    const chosen = models.find((model) => model.name === value) || null;
    if (!chosen || chosen === selectedModel) {
      return;
    }

    // clear out the current messages and job logs
    setJobId(undefined);
    setMessages([]);

    onModelSelected(chosen);
    setSelectedModel(chosen);
  };

  // Auto-scrolls to the latest message
  React.useEffect(() => {
    if (scrollToBottomRef.current) {
      // don't scroll the first load, but scroll if there's a current stream or a new source has popped up
      if (messages.length > 0) {
        scrollToBottomRef.current.scrollIntoView();
      }
    }
  }, [messages]);

  const sendButtonProps = React.useMemo(
    () => ({
      send: {
        tooltipContent: selectedModel ? '' : 'You must select a model to send message'
      }
    }),
    [selectedModel]
  );

  // =============== Unload Model Logic ===============
  const handleUnload = async () => {
    if (!selectedModel) {
      return;
    }

    setIsUnloading(true);

    if (isServingModel(selectedModel)) {
      try {
        const resp = await fetch('/api/fine-tune/model/vllm-unload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ model_name: mapModelName(selectedModel) })
        });
        if (!resp.ok) {
          setIsUnloading(false);
          console.error(`Failed to unload ${selectedModel.name}:`, resp.status, resp.statusText);
          return;
        }
        setAlertMessage({
          title: 'Model Unloaded',
          message: `Successfully unloaded ${selectedModel?.name}.`,
          variant: 'info'
        });
        setTimeout(() => {
          setAlertMessage(undefined);
        }, 5000);
      } catch (error) {
        console.error(`Error unloading ${selectedModel.name}:`, error);
      }
    }

    // clear out the selected model and job logs
    setSelectedModel(null);
    setJobId(undefined);
    setMessages([]);

    setIsUnloading(false);
    onModelSelected(null);
  };

  const handleCleanup = () => {
    setMessages([]);
    setAlertMessage(undefined);
  };

  const onToggleClick = () => {
    setIsSelectOpen(!isSelectOpen);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isSelectOpen} style={{ width: '200px' }}>
      {selectedModel ? selectedModel.name : 'Select a model'}
    </MenuToggle>
  );

  const renderMessages = (): React.ReactNode => {
    if (modelStatus === 'loading' || modelStatus === 'pending') {
      return (
        <ChatbotAlert isLiveRegion variant="info" title="Loading model...">
          {jobId ? <span>{`One moment while the model is loading. Click "View Logs" in the menu above for more details.`}</span> : null}
        </ChatbotAlert>
      );
    }

    if (isUnloading) {
      return <ChatbotAlert isLiveRegion variant="info" title="Unloading model..." />;
    }

    if (loadError) {
      return <ChatbotAlert isLiveRegion variant="danger" title={loadError} />;
    }

    if (modelStatus === 'stopped') {
      return <ChatbotAlert isLiveRegion variant="danger" title={`${selectedModel?.name} is not available`} />;
    }

    return (
      <>
        <ChatbotWelcomePrompt
          title={`Hello${userName ? ` ${userName}` : ''},`}
          description={!selectedModel ? 'Please select a model to get started' : 'Go ahead and ask me a question.'}
        />
        {alertMessage && (
          <ChatbotAlert isLiveRegion variant={alertMessage.variant} onClose={() => setAlertMessage(undefined)} title={alertMessage.title}>
            {alertMessage.message}
          </ChatbotAlert>
        )}
        {messages.map((msg) => (
          <Message key={msg.id} {...msg} />
        ))}
      </>
    );
  };

  return (
    <Chatbot className={isUnifiedInput ? 'unified-message-chatbot' : undefined} displayMode={ChatbotDisplayMode.embedded} isVisible={true}>
      <ChatbotHeader className="pf-chatbot__header">
        <ChatbotHeaderMain>
          <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} flexWrap={{ default: 'nowrap' }}>
            <Select
              id="model-select"
              isOpen={isSelectOpen}
              selected={selectedModel ? selectedModel.name : 'Select a model'}
              onSelect={onSelectModel}
              onOpenChange={(isOpen) => setIsSelectOpen(isOpen)}
              toggle={toggle}
              shouldFocusToggleOnSelect
            >
              <SelectList>
                {models.map((model, index) => (
                  <SelectOption key={index} value={model.name} selected={selectedModel?.modelName === model.name}>
                    {model.name}
                  </SelectOption>
                ))}
              </SelectList>
            </Select>
            {freeGpus < 1 && !selectedModel ? <Alert variant="warning" isInline isPlain title="No GPUs available" /> : null}
          </Flex>
        </ChatbotHeaderMain>
        <ChatbotHeaderActions className="pf-chatbot__header-actions">
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
              <DropdownItem
                onClick={handleUnload}
                isDisabled={!selectedModel || isUnloading || modelStatus === 'loading' || modelStatus === 'stopped'}
              >
                Unload model
              </DropdownItem>
              <DropdownItem onClick={handleCleanup}>Clear chat</DropdownItem>
              <DropdownItem onClick={() => setShowLogs(true)} isDisabled={!selectedModel || !jobId}>
                View logs
              </DropdownItem>
            </DropdownList>
          </Dropdown>
        </ChatbotHeaderActions>
      </ChatbotHeader>
      <ChatbotContent className={!isUnifiedInput ? 'chatbot-content' : undefined}>
        <MessageBox>
          {renderMessages()}
          <div ref={scrollToBottomRef}></div>
        </MessageBox>
      </ChatbotContent>
      {!isUnifiedInput && (
        <ChatbotFooter className="pf-chatbot__footer">
          <MessageBar
            alwayShowSendButton
            onSendMessage={handleSend}
            hasAttachButton={false}
            hasMicrophoneButton
            onChange={(_, val) => {
              setQuestion(typeof val === 'string' ? val : String(val));
            }}
            // Disable send button if message is empty or no model is selected
            isSendButtonDisabled={!question.trim() || !selectedModel || modelStatus === 'stopped' || modelStatus === 'loading'}
            buttonProps={sendButtonProps}
            placeholder="Enter prompt..."
          />
          <ChatbotFootnote
            label="Please verify the accuracy of the responses."
            popover={{
              title: 'Verify Accuracy',
              description: 'While the model strives for accuracy, there can be errors. Verify critical info.',
              link: { label: 'Learn more', url: 'https://www.redhat.com/' },
              cta: { label: 'Close', onClick: () => {} }
            }}
          />
        </ChatbotFooter>
      )}
      {showLogs && selectedModel && jobId ? <ChatModelLogViewer model={selectedModel} modelJobId={jobId} onClose={() => setShowLogs(false)} /> : null}
    </Chatbot>
  );
};

export default ChatModelEval;
