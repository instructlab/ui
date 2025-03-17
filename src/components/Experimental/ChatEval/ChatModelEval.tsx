// src/components/Experimental/ChatEval/ChatEval.tsx
'use client';

import React, { useState } from 'react';
import { Button, Spinner, FlexItem, Select, SelectList, MenuToggleElement, MenuToggle, SelectOption, Flex } from '@patternfly/react-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { Model } from '@/types';
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
import ModelStatusIndicator from '@/components/Experimental/ModelServeStatus/ModelServeStatus';
import { GRANITE_BASE_MODEL, GRANITE_LATEST_MODEL } from '@/components/Experimental/ChatEval/const';

const systemRole =
  'You are a cautious assistant. You carefully follow instructions.' +
  ' You are helpful and harmless and you follow ethical guidelines and promote positive behavior. Only answer questions on what you are trained on.';

interface ServingModel extends Model {
  endpoint: string;
}

interface Props {
  isBase: boolean;
  freeGpus: number;
  models: Model[];
  modelServerURL: string;
  isUnifiedInput: boolean;
  unifiedMessage?: MessageProps | null;
  onModelSelected: (selected: Model | null, jobId: string | null) => void;
}

const ChatModelEval: React.FC<Props> = ({ isBase, freeGpus, models, modelServerURL, isUnifiedInput, unifiedMessage, onModelSelected }) => {
  const [question, setQuestion] = useState<string>('');
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ title: string; message: string; variant: 'danger' | 'info' } | undefined>();
  const [showModelLoading, setShowModelLoading] = useState(false);
  const [isUnloading, setIsUnloading] = useState(false);
  const lastQuestionRef = React.useRef<string>();
  const scrollToBottomRef = React.useRef<HTMLDivElement>(null);

  const graniteBaseModel: ServingModel = React.useMemo(
    () => ({
      name: GRANITE_BASE_MODEL.name,
      apiURL: `${modelServerURL}:${GRANITE_BASE_MODEL.port}`, // endpoint for base model
      modelName: GRANITE_BASE_MODEL.modelName,
      endpoint: GRANITE_BASE_MODEL.endpoint
    }),
    [modelServerURL]
  );

  const graniteLatestModel: ServingModel = React.useMemo(
    () => ({
      name: GRANITE_LATEST_MODEL.name,
      apiURL: `${modelServerURL}:${GRANITE_LATEST_MODEL.port}`, // endpoint for base model
      modelName: GRANITE_LATEST_MODEL.modelName,
      endpoint: GRANITE_LATEST_MODEL.endpoint
    }),
    [modelServerURL]
  );

  const allModels = React.useMemo(() => [graniteLatestModel, graniteBaseModel, ...models], [graniteBaseModel, graniteLatestModel, models]);

  const handleSendMessage = React.useCallback(
    async (userMessage: MessageProps) => {
      if (userMessage.id === lastQuestionRef.current) {
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

      setMessages((msgs) => [...msgs, userMessage]);
      setQuestion('');

      // Prepare the payload for the backend
      const messagesPayload = [
        { role: 'system', content: systemRole },
        { role: 'user', content: userMessage.content }
      ];

      const chatModelName = mapModelName(selectedModel.modelName);

      const requestData = {
        model: chatModelName,
        messages: messagesPayload,
        stream: true
      };

      const botMsgId = `${Date.now()}_bot`;

      try {
        // Default endpoints (server-side fetch)
        const response = await fetch(
          `/api/playground/chat?apiURL=${encodeURIComponent(selectedModel.apiURL)}&modelName=${encodeURIComponent(requestData.model)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ question: userMessage.content, systemRole })
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Fetch error for ${isBase ? 'base' : 'latest'} model: ${response.status} - ${errorText}`);

          // Update the bot message with the error
          const errorMessage: MessageProps = {
            id: botMsgId,
            role: 'bot',
            content: `Error ${response.status}: ${errorText}`,
            name: 'Bot',
            avatar: logo.src,
            timestamp: new Date().toLocaleTimeString(),
            isLoading: false
          };
          setMessages((msgs) => [...msgs, errorMessage]);
          return;
        }
        if (response.body) {
          const reader = response.body.getReader();
          const textDecoder = new TextDecoder('utf-8');

          await (async () => {
            for (;;) {
              const { value, done } = await reader.read();
              if (done) break;
              const botMessage = textDecoder.decode(value, { stream: true });
              setMessages((prevMessages) => {
                const lastMessage = prevMessages[prevMessages.length - 1];
                if (lastMessage && lastMessage.role === 'bot') {
                  return [
                    ...prevMessages.slice(0, -1),
                    { ...lastMessage, content: `${lastMessage.content}${botMessage}`, timestamp: new Date().toLocaleTimeString() }
                  ];
                }
                return [
                  ...prevMessages,
                  {
                    avatar: logo.src,
                    id: botMsgId,
                    name: 'Bot',
                    role: 'bot',
                    content: botMessage,
                    timestamp: new Date().toLocaleTimeString(),
                    isLoading: false
                  }
                ];
              });
            }
          })();
        } else {
          console.error(`No response body received from ${isBase ? 'base' : 'latest'} side.`);
          return;
        }
      } catch (error) {
        console.error(`Error fetching chat response on the ${isBase ? 'base' : 'latest'} side:`, error);

        // Update the bot message with a generic error
        const errorMessage: MessageProps = {
          id: botMsgId,
          role: 'bot',
          content: 'Error fetching chat response.',
          name: 'Bot',
          avatar: logo.src,
          timestamp: new Date().toLocaleTimeString(),
          isLoading: false
        };

        setMessages((msgs) => [...msgs, errorMessage]);
      }
    },
    [isBase, selectedModel]
  );

  const handleSend = React.useCallback(
    (message: string | number) => {
      const question = String(message).trim();
      const userMsgId = `${Date.now()}_user`;

      // Prevent sending empty messages
      if (!question) {
        console.warn(`Attempted to send an empty message on the ${isBase ? 'base' : 'latest'} side.`);
        return;
      }

      // Add the user's message to the chat
      const userMessage: MessageProps = {
        id: userMsgId,
        role: 'user',
        content: question,
        name: 'User',
        avatar: userLogo.src,
        timestamp: new Date().toLocaleTimeString()
      };

      handleSendMessage(userMessage);
    },
    [handleSendMessage, isBase]
  );

  React.useEffect(() => {
    if (isUnifiedInput && unifiedMessage) {
      if (!selectedModel) {
        setAlertMessage({
          title: 'No Model Selected',
          message: `Please select a model for the ${isBase ? 'left' : 'right'} panel.`,
          variant: 'danger'
        });
        return;
      }

      handleSendMessage(unifiedMessage);
    }
  }, [handleSendMessage, selectedModel, isBase, isUnifiedInput, unifiedMessage]);

  /**
   * Helper function to map internal model identifiers to chat model names.
   * "granite-base" => "pre-train"
   * "granite-latest" => "post-train"
   * Custom models retain their original modelName.
   */
  const mapModelName = (modelName: string): string => {
    if (modelName === GRANITE_BASE_MODEL.modelName) {
      return 'pre-train';
    } else if (modelName === GRANITE_LATEST_MODEL.modelName) {
      return 'post-train';
    }
    return modelName;
  };

  const handleServeModel = async (servingModel: ServingModel) => {
    // Show loading popup
    setShowModelLoading(true);
    setTimeout(() => setShowModelLoading(false), 5000);

    try {
      const response = await fetch(servingModel.endpoint, {
        method: 'POST'
      });

      if (!response.ok) {
        console.error(`Failed to serve model from endpoint ${servingModel.endpoint}`);
        return;
      }

      const data = await response.json();
      const { job_id } = data;
      if (!job_id) {
        console.error('No job_id returned from serving model');
        return;
      }

      const loadingAlert = {
        title: 'Model Loading',
        message: 'One moment while the model is loading. Click "View Logs" below for details.',
        variant: 'info' as const
      };

      setAlertMessage(loadingAlert);
      setTimeout(() => setAlertMessage(undefined), 3000);

      setSelectedModel(servingModel);
      onModelSelected(servingModel, job_id);
    } catch (error) {
      console.error('Error serving model:', error);
    }
  };

  const onSelectModel = async (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    setIsSelectOpen(false);

    const chosen = allModels.find((model) => model.name === value) || null;

    // Handle serving model selection
    if (chosen === graniteLatestModel || chosen === graniteBaseModel) {
      await handleServeModel(graniteBaseModel);
      return;
    }

    // Handle model selection
    setSelectedModel(chosen);
    onModelSelected(chosen, null);
    setAlertMessage(undefined);
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

  // =============== Unload Model Logic ===============
  const handleUnload = async () => {
    if (!selectedModel) {
      return;
    }

    setIsUnloading(true);
    try {
      // TODO: Should this only be done for the granite models??
      const resp = await fetch('/api/fine-tune/model/vllm-unload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: mapModelName(selectedModel.modelName) })
      });
      if (!resp.ok) {
        setIsUnloading(false);
        console.error(`Failed to unload ${selectedModel.name}:`, resp.status, resp.statusText);
        return;
      }

      // Optionally clear out the selected model and job logs
      setSelectedModel(null);
      onModelSelected(null, null);
      setMessages([]);
      setIsUnloading(false);

      setAlertMessage({
        title: 'Model Unloaded',
        message: `Successfully unloaded ${selectedModel?.name}.`,
        variant: 'info'
      });
      setTimeout(() => {
        setAlertMessage(undefined);
      }, 5000);
    } catch (error) {
      setIsUnloading(false);
      console.error(`Error unloading ${selectedModel.name}:`, error);
    }
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

  return (
    <FlexItem flex={{ default: 'flex_1' }}>
      <Chatbot className={isUnifiedInput ? 'unified-message-chatbot' : undefined} displayMode={ChatbotDisplayMode.embedded} isVisible={true}>
        <ChatbotHeader className="pf-chatbot__header">
          <ChatbotHeaderMain>
            <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapSm' }} flexWrap={{ default: 'nowrap' }}>
              {freeGpus < 1 && !selectedModel && (
                <span style={{ color: 'red', marginRight: '0.5rem', padding: '0.5rem', whiteSpace: 'nowrap' }}>No GPUs free</span>
              )}
              {showModelLoading ? <Spinner size="sm" /> : <ModelStatusIndicator modelName={selectedModel?.modelName || null} />}
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
                  {allModels.map((model, index) => (
                    <SelectOption key={index} value={model.name} selected={selectedModel?.modelName === model.name}>
                      {model.name}
                    </SelectOption>
                  ))}
                </SelectList>
              </Select>
            </Flex>
          </ChatbotHeaderMain>
          <ChatbotHeaderActions className="pf-chatbot__header-actions">
            {/* Unload button (pre-train) */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleUnload}
              aria-label="Unload model"
              style={{ marginLeft: '1rem' }}
              className="square-button"
              isDisabled={!selectedModel || isUnloading}
            >
              Unload Model
            </Button>

            {/* Clear chat button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCleanup}
              aria-label="Clear chat"
              style={{ marginLeft: '1rem' }}
              className="square-button"
            >
              <FontAwesomeIcon icon={faBroom} /> Clear chat
            </Button>
          </ChatbotHeaderActions>
        </ChatbotHeader>
        <ChatbotContent className="pf-chatbot__content">
          <MessageBox>
            <ChatbotWelcomePrompt title="" description="" />
            {alertMessage && (
              <ChatbotAlert isLiveRegion variant={alertMessage.variant} onClose={() => setAlertMessage(undefined)} title={alertMessage.title}>
                {alertMessage.message}
              </ChatbotAlert>
            )}
            {messages.map((msg) => (
              <Message key={msg.id} {...msg} />
            ))}
            <div ref={scrollToBottomRef}></div>
          </MessageBox>
        </ChatbotContent>
        {!isUnifiedInput && (
          <ChatbotFooter className="pf-chatbot__footer">
            <MessageBar
              onSendMessage={handleSend}
              hasAttachButton={false}
              onChange={(_, val) => {
                setQuestion(typeof val === 'string' ? val : String(val));
              }}
              // Disable send button if message is empty or no model is selected
              isSendButtonDisabled={!question.trim() || !selectedModel}
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
      </Chatbot>
    </FlexItem>
  );
};

export default ChatModelEval;
