// src/components/Experimental/ChatEval/ChatEval.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { PageSection, Content, Title, Switch, Badge, Flex, FlexItem, Spinner } from '@patternfly/react-core';
import { MessageBar, ChatbotFooter, ChatbotFootnote, MessageProps, Compare } from '@patternfly/chatbot';
import { css } from '@patternfly/react-styles';
import userLogo from '../../../../public/default-avatar.svg';
import { Endpoint, Model, ServingModel } from '@/types';
import { useUserInfo } from '@/hooks/useUserInfo';
import { GRANITE_BASE_MODEL, GRANITE_LATEST_MODEL } from '@/components/Experimental/ChatEval/const';
import ChatModelEval from '@/components/Experimental/ChatEval/ChatModelEval';
import { useWatchGPUs } from '@/components/Experimental/ChatEval/useWatchGPUs';

import './ChatEval.css';

const ChatEval: React.FC = () => {
  const { userName, userImage } = useUserInfo();

  // States for unified input
  const [questionUnified, setQuestionUnified] = useState('');
  const [isUnifiedInput, setIsUnifiedInput] = useState(true);
  const [unifiedMessage, setUnifiedMessage] = useState<MessageProps | null>();
  const { freeGpus, totalGpus, loaded: gpusLoaded } = useWatchGPUs();

  const [models, setModels] = useState<Model[]>([]);

  const [leftModel, setLeftModel] = useState<Model | null>();
  const [rightModel, setRightModel] = useState<Model | null>();

  // Fetch models on component mount
  useEffect(() => {
    const fetchModels = async () => {
      const response = await fetch('/api/envConfig');
      const envConfig = await response.json();

      const modelServerURL = envConfig.API_SERVER.replace(/:\d+/, '');

      const graniteBaseModel: ServingModel = {
        isDefault: true,
        name: GRANITE_BASE_MODEL.name,
        apiURL: `${modelServerURL}:${GRANITE_BASE_MODEL.port}`, // endpoint for base model
        modelName: GRANITE_BASE_MODEL.modelName,
        enabled: true,
        endpoint: GRANITE_BASE_MODEL.endpoint,
        vvlmName: GRANITE_BASE_MODEL.vvlmName
      };

      const graniteLatestModel: ServingModel = {
        isDefault: true,
        name: GRANITE_LATEST_MODEL.name,
        apiURL: `${modelServerURL}:${GRANITE_LATEST_MODEL.port}`, // endpoint for base model
        modelName: GRANITE_LATEST_MODEL.modelName,
        enabled: true,
        endpoint: GRANITE_LATEST_MODEL.endpoint,
        vvlmName: GRANITE_LATEST_MODEL.vvlmName
      };

      const storedEndpoints = localStorage.getItem('endpoints');
      const cust: Model[] = storedEndpoints
        ? JSON.parse(storedEndpoints).map((endpoint: Endpoint) => ({
            name: endpoint.modelName,
            apiURL: `${endpoint.url}`,
            modelName: endpoint.modelName,
            isDefault: false
          }))
        : [];

      setModels([graniteBaseModel, graniteLatestModel, ...cust]);
    };

    fetchModels();
  }, []);

  const sendButtonProps = React.useMemo(
    () => ({
      send: {
        tooltipContent: leftModel && rightModel ? undefined : 'You must select models to send message'
      }
    }),
    [leftModel, rightModel]
  );

  const handleUnifiedSend = (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // Add the user's message to the chat
    const now = new Date();
    const question = message.trim();
    const userMsgId = `${now.getTime()}_user`;

    const userMessage: MessageProps = {
      id: userMsgId,
      role: 'user',
      content: question,
      name: 'User',
      avatar: userImage || userLogo.src,
      timestamp: now.toLocaleTimeString()
    };

    setQuestionUnified('');
    setUnifiedMessage(userMessage);
  };

  const leftChat = (
    <ChatModelEval
      compareSide="left"
      userName={userName}
      userImage={userImage}
      freeGpus={freeGpus}
      models={models}
      isUnifiedInput={isUnifiedInput}
      unifiedMessage={unifiedMessage}
      onModelSelected={(model) => {
        setUnifiedMessage(null);
        setLeftModel(model);
      }}
    />
  );
  const rightChat = (
    <ChatModelEval
      compareSide="right"
      userName={userName}
      userImage={userImage}
      freeGpus={freeGpus}
      models={models}
      isUnifiedInput={isUnifiedInput}
      unifiedMessage={unifiedMessage}
      onModelSelected={(model) => {
        setUnifiedMessage(null);
        setRightModel(model);
      }}
    />
  );

  return (
    <>
      <PageSection>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10' }}>
              Compare models
            </Title>
          </FlexItem>
          <FlexItem>
            <Content>
              View two models side-by-side to compare their responses to prompts. To send prompts to one or both models at a time, toggle the{' '}
              <b>Use separate prompts</b> to switch.
            </Content>
          </FlexItem>
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <Flex gap={{ default: 'gapSm' }}>
                  <FlexItem>Available GPUs:</FlexItem>
                  <FlexItem>
                    {gpusLoaded ? (
                      <Badge isRead>
                        {freeGpus} / {totalGpus}
                      </Badge>
                    ) : (
                      <Spinner size="sm" />
                    )}
                  </FlexItem>
                </Flex>
              </FlexItem>
              <FlexItem>
                <Switch
                  id="toggle-unified-input"
                  label="Use separate prompts"
                  isChecked={!isUnifiedInput}
                  onChange={() => setIsUnifiedInput(!isUnifiedInput)}
                />
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>
      <div className={css('pf-chatbot__compare-container', isUnifiedInput && 'm-is-unified')}>
        <Compare
          firstChild={leftChat}
          secondChild={rightChat}
          firstChildDisplayName={leftModel?.name || 'Select a model'}
          secondChildDisplayName={rightModel?.name || 'Select a model'}
        />
      </div>
      {isUnifiedInput ? (
        <ChatbotFooter>
          <MessageBar
            alwayShowSendButton
            onSendMessage={(message) => {
              handleUnifiedSend(typeof message === 'string' ? message : String(message));
            }}
            hasAttachButton={false}
            hasMicrophoneButton
            onChange={(_, val) => {
              setQuestionUnified(typeof val === 'string' ? val : String(val));
            }}
            // value={questionUnified}
            // placeholder="Type your prompt here and send to both models..."
            // Disable send button if message is empty or no models are selected
            isSendButtonDisabled={!questionUnified.trim() || !leftModel || !rightModel}
            buttonProps={sendButtonProps}
            placeholder="Enter prompt..."
          />
          <ChatbotFootnote label="Please verify the accuracy of the responses." />
        </ChatbotFooter>
      ) : null}
    </>
  );
};

export default ChatEval;
