// src/components/Experimental/ChatEval/ChatEval.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Breadcrumb, BreadcrumbItem, PageBreadcrumb, PageSection, Content, Title, Switch, Badge, Flex, FlexItem } from '@patternfly/react-core';
import { MessageBar, ChatbotFooter, ChatbotFootnote, MessageProps } from '@patternfly/chatbot';
import userLogo from '../../../../public/default-avatar.svg';
import { Endpoint, Model } from '@/types';
import ChatModelEval from '@/components/Experimental/ChatEval/ChatModelEval';
import ChatModelLogViewer from '@/components/Experimental/ChatEval/ChatModelLogViewer';

import './ChatEval.css';

const ChatEval: React.FC = () => {
  const [isUnifiedInput, setIsUnifiedInput] = useState(false);
  const [modelServerURL, setModelServerURL] = useState<string>('');

  // States for unified input
  const [questionUnified, setQuestionUnified] = useState('');
  const [unifiedMessage, setUnifiedMessage] = useState<MessageProps | null>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [freeGpus, setFreeGpus] = useState<number>(0);
  const [totalGpus, setTotalGpus] = useState<number>(0);

  const [customModels, setCustomModels] = useState<Model[]>([]);
  const [defaultModels, setDefaultModels] = useState<Model[]>([]);

  const [leftModelSelected, setLeftModelSelected] = useState<boolean>(false);
  const [rightModelSelected, setRightModelSelected] = useState<boolean>(false);

  const [modelJobIdLeft, setModelJobIdLeft] = useState<string | null>(null);
  const [modelJobIdRight, setModelJobIdRight] = useState<string | null>(null);

  useEffect(() => {
    const fetchGpus = async () => {
      try {
        const res = await fetch('/api/fine-tune/gpu-free');
        if (!res.ok) {
          console.error('Failed to fetch free GPUs:', res.status, res.statusText);
          setFreeGpus(0);
          setTotalGpus(0);
          return;
        }
        const data = await res.json();
        setFreeGpus(data.free_gpus || 0);
        setTotalGpus(data.total_gpus || 0);
      } catch (err) {
        console.error('Error fetching free GPUs:', err);
        setFreeGpus(0);
        setTotalGpus(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGpus();
    const intervalId = setInterval(fetchGpus, 5000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch models on component mount
  useEffect(() => {
    const fetchDefaultModels = async () => {
      const response = await fetch('/api/envConfig');
      const envConfig = await response.json();

      const modelServerURL = envConfig.API_SERVER.replace(/:\d+/, '');
      setModelServerURL(modelServerURL);

      const storedEndpoints = localStorage.getItem('endpoints');
      const cust: Model[] = storedEndpoints
        ? JSON.parse(storedEndpoints).map((endpoint: Endpoint) => ({
            name: endpoint.modelName,
            apiURL: `${endpoint.url}`,
            modelName: endpoint.modelName
          }))
        : [];

      setDefaultModels([]);
      setCustomModels(cust);
    };

    fetchDefaultModels();
  }, []);

  const models = React.useMemo(() => [...defaultModels, ...customModels], [defaultModels, customModels]);

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
      avatar: userLogo.src,
      timestamp: now.toLocaleTimeString()
    };

    setQuestionUnified('');
    setUnifiedMessage(userMessage);
  };

  return (
    <div className="chatbot-ui-page">
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
          <BreadcrumbItem isActive>Model Chat Evaluation</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection>
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10' }}>
              Evaluate Two Models Side-by-Side
            </Title>
          </FlexItem>
          <FlexItem>
            <Content>
              Select a model in each panel to compare responses. You can toggle between using a single input box that sends to both models or using
              two separate input boxes.
            </Content>
          </FlexItem>
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                Free GPUs:{' '}
                <Badge isRead>
                  {freeGpus} / {totalGpus}
                </Badge>
              </FlexItem>
              <FlexItem>
                <Switch
                  id="toggle-unified-input"
                  label="Single Input Box"
                  isChecked={isUnifiedInput}
                  onChange={() => setIsUnifiedInput(!isUnifiedInput)}
                />
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      </PageSection>

      {!isLoading ? (
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapSm' }} flexWrap={{ default: 'nowrap' }}>
          <FlexItem>
            <Flex className="chat-eval__chatbots-container" direction={{ default: 'column', md: 'row' }} gap={{ default: 'gapMd', lg: 'gapSm' }}>
              <ChatModelEval
                isBase
                freeGpus={freeGpus}
                models={models}
                modelServerURL={modelServerURL}
                isUnifiedInput={isUnifiedInput}
                unifiedMessage={unifiedMessage}
                onModelSelected={(model, jobId) => {
                  console.log(`Selected ${model?.name} : ${jobId}`);
                  setUnifiedMessage(null);
                  setLeftModelSelected(!!model);
                  setModelJobIdLeft(jobId);
                }}
              />
              <ChatModelEval
                isBase={false}
                freeGpus={freeGpus}
                models={models}
                modelServerURL={modelServerURL}
                isUnifiedInput={isUnifiedInput}
                unifiedMessage={unifiedMessage}
                onModelSelected={(model, jobId) => {
                  setUnifiedMessage(null);
                  setRightModelSelected(!!model);
                  setModelJobIdRight(jobId);
                }}
              />
            </Flex>
          </FlexItem>

          {/* Unified MessageBar for both models */}
          {isUnifiedInput && (
            <FlexItem>
              <ChatbotFooter className="pf-chatbot__footer">
                <MessageBar
                  onSendMessage={(message) => {
                    handleUnifiedSend(typeof message === 'string' ? message : String(message));
                  }}
                  hasAttachButton={false}
                  onChange={(_, val) => {
                    setQuestionUnified(typeof val === 'string' ? val : String(val));
                  }}
                  // value={questionUnified}
                  // placeholder="Type your prompt here and send to both models..."
                  // Disable send button if message is empty or no models are selected
                  isSendButtonDisabled={!questionUnified.trim() || !leftModelSelected || !rightModelSelected}
                />
                <ChatbotFootnote
                  label="Please verify the accuracy of the responses."
                  popover={{
                    title: 'Verify Accuracy',
                    description: 'While the model strives for accuracy, there can be errors. Verify critical info.',
                    link: { label: 'Learn more', url: 'https://www.redhat.com/' },
                    cta: { label: 'Got it', onClick: () => {} }
                  }}
                />
              </ChatbotFooter>
            </FlexItem>
          )}
          <FlexItem>
            <Flex className="chat-eval__chatbots-container" direction={{ default: 'column', lg: 'row' }} gap={{ default: 'gapMd', lg: 'gapSm' }}>
              <FlexItem flex={{ default: 'flex_1' }} style={{ maxHeight: 400, overflowY: 'auto' }}>
                <ChatModelLogViewer modelJobId={modelJobIdLeft} />
              </FlexItem>
              <FlexItem flex={{ default: 'flex_1' }} style={{ maxHeight: 400, overflowY: 'auto' }}>
                <ChatModelLogViewer modelJobId={modelJobIdRight} />
              </FlexItem>
            </Flex>
          </FlexItem>
        </Flex>
      ) : null}
    </div>
  );
};

export default ChatEval;
