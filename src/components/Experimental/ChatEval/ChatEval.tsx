// src/components/Experimental/ChatEval/ChatEval.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  Breadcrumb,
  BreadcrumbItem,
  PageBreadcrumb,
  PageSection,
  Content,
  Title,
  Button,
  DropdownList,
  DropdownItem,
  ExpandableSection,
  Spinner,
  CodeBlock,
  CodeBlockCode,
  Switch,
  Badge
} from '@patternfly/react-core';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import { Endpoint, Model } from '@/types';
import {
  Chatbot,
  ChatbotHeader,
  ChatbotHeaderMain,
  ChatbotHeaderActions,
  ChatbotHeaderSelectorDropdown,
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

import './ChatEval.css';

const ChatModelEval: React.FC = () => {
  const [isUnifiedInput, setIsUnifiedInput] = useState(false);
  const [modelServerURL, setModelServerURL] = useState<string>('');

  // States for unified input
  const [questionUnified, setQuestionUnified] = useState('');

  // States for left chat
  const [questionLeft, setQuestionLeft] = useState<string>('');
  const [messagesLeft, setMessagesLeft] = useState<MessageProps[]>([]);
  const [currentMessageLeft, setCurrentMessageLeft] = React.useState<string[]>([]);
  const [selectedModelLeft, setSelectedModelLeft] = useState<Model | null>(null);
  const [alertMessageLeft, setAlertMessageLeft] = useState<{ title: string; message: string; variant: 'danger' | 'info' } | undefined>(undefined);

  // States for right chat
  const [questionRight, setQuestionRight] = useState<string>('');
  const [messagesRight, setMessagesRight] = useState<MessageProps[]>([]);
  const [currentMessageRight, setCurrentMessageRight] = React.useState<string[]>([]);
  const [selectedModelRight, setSelectedModelRight] = useState<Model | null>(null);
  const [alertMessageRight, setAlertMessageRight] = useState<{ title: string; message: string; variant: 'danger' | 'info' } | undefined>(undefined);

  const [freeGpus, setFreeGpus] = useState<number>(0);
  const [totalGpus, setTotalGpus] = useState<number>(0);

  const systemRole =
    'You are a cautious assistant. You carefully follow instructions.' +
    ' You are helpful and harmless and you follow ethical guidelines and promote positive behavior. Only answer questions on what you are trained on.';

  const [customModels, setCustomModels] = useState<Model[]>([]);
  const [defaultModels, setDefaultModels] = useState<Model[]>([]);
  const allModels = [...defaultModels, ...customModels];

  const [modelJobIdLeft, setModelJobIdLeft] = useState<string | undefined>(undefined);
  const [modelJobIdRight, setModelJobIdRight] = useState<string | undefined>(undefined);

  const [showModelLoadingLeft, setShowModelLoadingLeft] = useState(false);
  const [showModelLoadingRight, setShowModelLoadingRight] = useState(false);

  // For logs viewing
  const [expandedJobsLeft, setExpandedJobsLeft] = useState<Record<string, boolean>>({});
  const [jobLogsLeft, setJobLogsLeft] = useState<Record<string, string>>({});

  const [expandedJobsRight, setExpandedJobsRight] = useState<Record<string, boolean>>({});
  const [jobLogsRight, setJobLogsRight] = useState<Record<string, string>>({});

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
      console.log('Model server url is set to :', modelServerURL);
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

  /**
   * Helper function to map internal model identifiers to chat model names.
   * "granite-base" => "pre-train"
   * "granite-latest" => "post-train"
   * Custom models retain their original modelName.
   */
  const mapModelName = (modelName: string): string => {
    if (modelName === 'granite-base') {
      return 'pre-train';
    } else if (modelName === 'granite-latest') {
      return 'post-train';
    }
    return modelName;
  };

  const handleServeModel = async (endpoint: string, side: 'left' | 'right') => {
    // Show loading popup
    if (side === 'left') {
      setShowModelLoadingLeft(true);
      setTimeout(() => setShowModelLoadingLeft(false), 5000);
    } else {
      setShowModelLoadingRight(true);
      setTimeout(() => setShowModelLoadingRight(false), 5000);
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST'
      });

      if (!response.ok) {
        console.error(`Failed to serve model from endpoint ${endpoint}`);
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

      if (side === 'left') {
        setModelJobIdLeft(job_id);
        setAlertMessageLeft(loadingAlert);
        setTimeout(() => setAlertMessageLeft(undefined), 3000);
      } else {
        setModelJobIdRight(job_id);
        setAlertMessageRight(loadingAlert);
        setTimeout(() => setAlertMessageRight(undefined), 3000);
      }

      // Once the model is served, set the selected model to the served endpoint
      // For base model: port 8000
      // For latest checkpoint: port 8001
      if (endpoint.includes('serve-base')) {
        const servedModel: Model = {
          name: 'Granite base model (Serving)',
          apiURL: `${modelServerURL}:8000`, // endpoint for base model
          modelName: 'granite-base'
        };

        if (side === 'left') {
          setSelectedModelLeft(servedModel);
        } else {
          setSelectedModelRight(servedModel);
        }
      } else if (endpoint.includes('serve-latest')) {
        const servedModel: Model = {
          name: 'Granite fine tune checkpoint (Serving)',
          apiURL: `${modelServerURL}:8001`, // endpoint for latest checkpoint
          modelName: 'granite-latest'
        };

        if (side === 'left') {
          setSelectedModelLeft(servedModel);
        } else {
          setSelectedModelRight(servedModel);
        }
      }
    } catch (error) {
      console.error('Error serving model:', error);
    }
  };

  const onSelectModelLeft = async (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    // If "Granite fine tune checkpoint" selected
    if (value === 'Granite fine tune checkpoint') {
      await handleServeModel('/api/fine-tune/model/serve-latest', 'left');
      return;
    }

    // If "Granite base model" selected
    if (value === 'Granite base model') {
      await handleServeModel('/api/fine-tune/model/serve-base', 'left');
      return;
    }

    const chosen = allModels.find((model) => model.name === value) || null;
    setSelectedModelLeft(chosen);
    setAlertMessageLeft(undefined);
  };

  const onSelectModelRight = async (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    if (value === 'Granite fine tune checkpoint') {
      await handleServeModel('/api/fine-tune/model/serve-latest', 'right');
      return;
    }

    if (value === 'Granite base model') {
      await handleServeModel('/api/fine-tune/model/serve-base', 'right');
      return;
    }

    const chosen = allModels.find((model) => model.name === value) || null;
    setSelectedModelRight(chosen);
    setAlertMessageRight(undefined);
  };

  // =============== Unload Model Logic (Left / Right) ===============
  // Left uses model_name=pre-train, right uses model_name=post-train
  const handleUnloadLeft = async () => {
    try {
      const resp = await fetch('/api/fine-tune/model/vllm-unload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: 'pre-train' })
      });
      if (!resp.ok) {
        console.error('Failed to unload granite base model:', resp.status, resp.statusText);
        return;
      }
      const data = await resp.json();
      console.log('Successfully unloaded model served in left:', data);

      // Optionally clear out the selected model and job logs on the left
      setSelectedModelLeft(null);
      setModelJobIdLeft(undefined);
      setMessagesLeft([]);
      setCurrentMessageLeft([]);
      setAlertMessageLeft({
        title: 'Model Unloaded',
        message: 'Successfully unloaded the granite-base model.',
        variant: 'info'
      });
      setTimeout(() => {
        setAlertMessageLeft(undefined);
      }, 5000);
    } catch (error) {
      console.error('Error unloading model on left:', error);
    }
  };

  const handleUnloadRight = async () => {
    try {
      const resp = await fetch('/api/fine-tune/model/vllm-unload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model_name: 'post-train' })
      });
      if (!resp.ok) {
        console.error('Failed to unload granite latest model:', resp.status, resp.statusText);
        return;
      }
      const data = await resp.json();
      console.log('Successfully unloaded model served in right:', data);

      // Optionally clear out the selected model and job logs on the right
      setSelectedModelRight(null);
      setModelJobIdRight(undefined);
      setMessagesRight([]);
      setCurrentMessageRight([]);
      setAlertMessageRight({
        title: 'Model Unloaded',
        message: 'Successfully unloaded the granite latest model.',
        variant: 'info'
      });
      setTimeout(() => {
        setAlertMessageRight(undefined);
      }, 5000);
    } catch (error) {
      console.error('Error unloading model on right:', error);
    }
  };

  // =============== Cleanup (Left / Right) ===============
  const handleCleanupLeft = () => {
    setMessagesLeft([]);
    setCurrentMessageLeft([]);
    setAlertMessageLeft(undefined);
  };

  const handleCleanupRight = () => {
    setMessagesRight([]);
    setCurrentMessageRight([]);
    setAlertMessageRight(undefined);
  };

  const handleSend = async (side: 'left' | 'right', message: string) => {
    const question = message.trim();
    const userMsgId = `${Date.now()}_user_${side}`;
    const botMsgId = `${Date.now()}_bot_${side}`;

    // Prevent sending empty messages
    if (!question) {
      console.warn(`Attempted to send an empty message on the ${side} side.`);
      return;
    }

    // Determine the selected model based on the side
    const selectedModel = side === 'left' ? selectedModelLeft : selectedModelRight;

    // Alert the user if no model is selected
    if (!selectedModel) {
      if (side === 'left') {
        setAlertMessageLeft({
          title: 'No Model Selected',
          message: 'Please select a model before sending a prompt.',
          variant: 'danger'
        });
      } else {
        setAlertMessageRight({
          title: 'No Model Selected',
          message: 'Please select a model before sending a prompt.',
          variant: 'danger'
        });
      }
      return;
    }

    if (side === 'left') {
      if (currentMessageLeft.length > 0) {
        const botMessage: MessageProps = {
          avatar: logo.src,
          id: botMsgId,
          name: 'Bot',
          role: 'bot',
          content: currentMessageLeft.join(''),
          timestamp: new Date().toLocaleTimeString(),
          isLoading: false,
          actions: {
            copy: { onClick: () => navigator.clipboard.writeText(currentMessageLeft.join('') || '') }
          }
        };
        setCurrentMessageLeft([]);
        setMessagesLeft((msgs) => [...msgs, botMessage]);
      }
    } else {
      if (currentMessageRight.length > 0) {
        const botMessage: MessageProps = {
          avatar: logo.src,
          id: botMsgId,
          name: 'Bot',
          role: 'bot',
          content: currentMessageRight.join(''),
          timestamp: new Date().toLocaleTimeString(),
          isLoading: false,
          actions: {
            copy: { onClick: () => navigator.clipboard.writeText(currentMessageRight.join('') || '') }
          }
        };
        setCurrentMessageRight([]);
        setMessagesRight((msgs) => [...msgs, botMessage]);
      }
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

    if (side === 'left') {
      setMessagesLeft((msgs) => [...msgs, userMessage]);
      setQuestionLeft('');
    } else {
      setMessagesRight((msgs) => [...msgs, userMessage]);
      setQuestionRight('');
    }

    // Prepare the payload for the backend
    const messagesPayload = [
      { role: 'system', content: systemRole },
      { role: 'user', content: question }
    ];

    const chatModelName = mapModelName(selectedModel.modelName);

    const requestData = {
      model: chatModelName,
      messages: messagesPayload,
      stream: true
    };

    console.log('Sending message to chat endpoint:', selectedModel.apiURL);
    try {
      // Default endpoints (server-side fetch)
      const response = await fetch(
        `/api/playground/chat?apiURL=${encodeURIComponent(selectedModel.apiURL)}&modelName=${encodeURIComponent(requestData.model)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question, systemRole })
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Fetch error for ${side} side: ${response.status} - ${errorText}`);

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
        if (side === 'left') {
          setMessagesLeft((msgs) => [...msgs, errorMessage]);
        } else {
          setMessagesRight((msgs) => [...msgs, errorMessage]);
        }
        return;
      }
      if (response.body) {
        const reader = response.body.getReader();
        const textDecoder = new TextDecoder('utf-8');
        let botMessage = '';

        (async () => {
          for (;;) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = textDecoder.decode(value, { stream: true });
            botMessage = chunk;

            if (side === 'left') {
              setCurrentMessageLeft((prevMsg) => [...prevMsg, botMessage]);
            } else {
              setCurrentMessageRight((prevMsg) => [...prevMsg, botMessage]);
            }
          }
        })();
      } else {
        console.error(`No response body received from ${side} side.`);
        return;
      }
    } catch (error) {
      console.error(`Error fetching chat response on the ${side} side:`, error);

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

      if (side === 'left') {
        setMessagesLeft((msgs) => [...msgs, errorMessage]);
      } else {
        setMessagesRight((msgs) => [...msgs, errorMessage]);
      }
    }
  };

  const handleSendLeft = (message: string) => {
    handleSend('left', message);
  };

  const handleSendRight = (message: string) => {
    handleSend('right', message);
  };

  const handleToggleLogsLeft = async (jobId: string, isExpanding: boolean) => {
    setExpandedJobsLeft((prev) => ({ ...prev, [jobId]: isExpanding }));
    if (isExpanding && !jobLogsLeft[jobId]) {
      try {
        const response = await fetch(`/api/fine-tune/jobs/${jobId}/logs`, {
          method: 'GET'
        });
        if (response.ok) {
          const logsText = await response.text();
          setJobLogsLeft((prev) => ({ ...prev, [jobId]: logsText }));
        } else {
          setJobLogsLeft((prev) => ({ ...prev, [jobId]: 'Failed to fetch logs.' }));
        }
      } catch (error) {
        console.error('Error fetching job logs:', error);
        setJobLogsLeft((prev) => ({ ...prev, [jobId]: 'Error fetching logs.' }));
      }
    }
  };

  const handleToggleLogsRight = async (jobId: string, isExpanding: boolean) => {
    setExpandedJobsRight((prev) => ({ ...prev, [jobId]: isExpanding }));
    if (isExpanding && !jobLogsRight[jobId]) {
      try {
        const response = await fetch(`/api/fine-tune/jobs/${jobId}/logs`, {
          method: 'GET'
        });
        if (response.ok) {
          const logsText = await response.text();
          setJobLogsRight((prev) => ({ ...prev, [jobId]: logsText }));
        } else {
          setJobLogsRight((prev) => ({ ...prev, [jobId]: 'Failed to fetch logs.' }));
        }
      } catch (error) {
        console.error('Error fetching job logs:', error);
        setJobLogsRight((prev) => ({ ...prev, [jobId]: 'Error fetching logs.' }));
      }
    }
  };

  const handleUnifiedSend = (message: string) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setQuestionUnified('');
    // Send to both models if both are selected
    let shouldSendLeft = true;
    let shouldSendRight = true;

    if (!selectedModelLeft) {
      setAlertMessageLeft({
        title: 'No Model Selected',
        message: 'Please select a model for the left panel.',
        variant: 'danger'
      });
      shouldSendLeft = false;
    }

    if (!selectedModelRight) {
      setAlertMessageRight({
        title: 'No Model Selected',
        message: 'Please select a model for the right panel.',
        variant: 'danger'
      });
      shouldSendRight = false;
    }

    if (shouldSendLeft) {
      handleSend('left', trimmedMessage);
    }
    if (shouldSendRight) {
      handleSend('right', trimmedMessage);
    }
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
        <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10' }}>
          Evaluate Two Models Side-by-Side
        </Title>
        <Content>
          <br />
          Select a model in each panel to compare responses. You can toggle between using a single input box that sends to both models or using two
          separate input boxes.
          <br />
          <br />
          Free GPUs:{' '}
          <Badge isRead>
            {freeGpus} / {totalGpus}
          </Badge>
        </Content>
      </PageSection>

      {/* Toggle Switch */}
      <PageSection style={{ backgroundColor: 'white', padding: '1rem' }}>
        <Switch id="toggle-unified-input" label="Single Input Box" isChecked={isUnifiedInput} onChange={() => setIsUnifiedInput(!isUnifiedInput)} />
      </PageSection>

      <div className="chat-eval__chatbots-container">
        {/* Left Chat */}
        <div style={{ flex: '1 1 45%', marginBottom: '2rem' }}>
          <Chatbot displayMode={ChatbotDisplayMode.embedded} isVisible={true} className="chatbot-ui-page">
            <ChatbotHeader className="pf-chatbot__header">
              <ChatbotHeaderMain>{''}</ChatbotHeaderMain>
              <ChatbotHeaderActions className="pf-chatbot__header-actions">
                <ModelStatusIndicator modelName={selectedModelLeft?.modelName || null} />
                {freeGpus < 1 && !selectedModelLeft && (
                  <span style={{ color: 'red', marginRight: '0.5rem', padding: '0.5rem', whiteSpace: 'nowrap' }}>No GPUs free</span>
                )}
                {showModelLoadingLeft && <Spinner size="sm" />}
                <ChatbotHeaderSelectorDropdown
                  // disabled={(freeGpus < 1 && !selectedModelLeft) || showModelLoadingLeft}
                  value={selectedModelLeft?.name || 'Select a model'}
                  onSelect={onSelectModelLeft}
                >
                  <DropdownList>
                    <DropdownItem value="Granite fine tune checkpoint">Granite fine tune checkpoint</DropdownItem>
                    <DropdownItem value="Granite base model">Granite base model</DropdownItem>
                    {allModels.map((m) => (
                      <DropdownItem value={m.name} key={m.name}>
                        {m.name}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </ChatbotHeaderSelectorDropdown>

                {/* Unload button (pre-train) */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUnloadLeft}
                  aria-label="Unload left model"
                  style={{ marginLeft: '1rem' }}
                  className="square-button"
                >
                  Unload Model
                </Button>

                {/* Clear chat button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCleanupLeft}
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
                {alertMessageLeft && (
                  <ChatbotAlert
                    isLiveRegion
                    variant={alertMessageLeft.variant}
                    onClose={() => setAlertMessageLeft(undefined)}
                    title={alertMessageLeft.title}
                  >
                    {alertMessageLeft.message}
                  </ChatbotAlert>
                )}
                {messagesLeft.map((msg) => (
                  <Message key={msg.id} {...msg} />
                ))}
                {currentMessageLeft.length > 0 && (
                  <Message
                    avatar={logo.src}
                    name="Bot"
                    key="currentMessage"
                    role="bot"
                    content={currentMessageLeft.join('')}
                    timestamp={new Date().toLocaleTimeString()}
                  />
                )}
              </MessageBox>
            </ChatbotContent>
            {!isUnifiedInput && (
              <ChatbotFooter className="pf-chatbot__footer">
                <MessageBar
                  onSendMessage={(message) => {
                    handleSendLeft(typeof message === 'string' ? message : String(message));
                  }}
                  hasAttachButton={false}
                  onChange={(_, val) => {
                    setQuestionLeft(typeof val === 'string' ? val : String(val));
                  }}
                  // value={questionLeft}
                  // placeholder="Type your prompt for the left model..."
                  // Disable send button if message is empty or no model is selected
                  isSendButtonDisabled={!questionLeft.trim() || !selectedModelLeft}
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
          {modelJobIdLeft && (
            <div style={{ marginTop: '1rem', maxHeight: 400, overflowY: 'auto' }}>
              <ExpandableSection
                toggleText={expandedJobsLeft[modelJobIdLeft] ? 'Hide Logs' : 'View Logs'}
                onToggle={(_event, expanded) => handleToggleLogsLeft(modelJobIdLeft, expanded)}
                isExpanded={expandedJobsLeft[modelJobIdLeft]}
              >
                {jobLogsLeft[modelJobIdLeft] ? (
                  <CodeBlock>
                    <CodeBlockCode id={`logs-${modelJobIdLeft}`}>{jobLogsLeft[modelJobIdLeft]}</CodeBlockCode>
                  </CodeBlock>
                ) : (
                  <Spinner size="md" />
                )}
              </ExpandableSection>
            </div>
          )}
        </div>

        {/* Right Chat */}
        <div style={{ flex: '1 1 45%', marginBottom: '2rem' }}>
          <Chatbot displayMode={ChatbotDisplayMode.embedded} isVisible={true} className="chatbot-ui-page">
            <ChatbotHeader className="pf-chatbot__header">
              <ChatbotHeaderMain>{''}</ChatbotHeaderMain>
              <ChatbotHeaderActions className="pf-chatbot__header-actions">
                <ModelStatusIndicator modelName={selectedModelRight?.modelName || null} />
                {freeGpus < 1 && !selectedModelRight && (
                  <span style={{ color: 'red', marginRight: '0.5rem', padding: '0.5rem', whiteSpace: 'nowrap' }}>No GPUs free</span>
                )}
                {showModelLoadingRight && <Spinner size="sm" />}
                <ChatbotHeaderSelectorDropdown
                  // disabled={(freeGpus < 1 && !selectedModelRight) || showModelLoadingRight}
                  value={selectedModelRight?.name || 'Select a model'}
                  onSelect={onSelectModelRight}
                >
                  <DropdownList>
                    <DropdownItem value="Granite fine tune checkpoint">Granite fine tune checkpoint</DropdownItem>
                    <DropdownItem value="Granite base model">Granite base model</DropdownItem>
                    {allModels.map((m) => (
                      <DropdownItem value={m.name} key={m.name}>
                        {m.name}
                      </DropdownItem>
                    ))}
                  </DropdownList>
                </ChatbotHeaderSelectorDropdown>

                {/* Unload button (post-train) */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleUnloadRight}
                  aria-label="Unload right model"
                  style={{ marginLeft: '1rem' }}
                  className="square-button"
                >
                  Unload Model
                </Button>

                {/* Clear chat button */}
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCleanupRight}
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
                {alertMessageRight && (
                  <ChatbotAlert
                    isLiveRegion
                    variant={alertMessageRight.variant}
                    onClose={() => setAlertMessageRight(undefined)}
                    title={alertMessageRight.title}
                  >
                    {alertMessageRight.message}
                  </ChatbotAlert>
                )}
                {messagesRight.map((msg) => (
                  <Message key={msg.id} {...msg} />
                ))}
                {currentMessageRight.length > 0 && (
                  <Message
                    avatar={logo.src}
                    name="Bot"
                    key="currentMessage"
                    role="bot"
                    content={currentMessageRight.join('')}
                    timestamp={new Date().toLocaleTimeString()}
                  />
                )}
              </MessageBox>
            </ChatbotContent>
            {!isUnifiedInput && (
              <ChatbotFooter className="pf-chatbot__footer">
                <MessageBar
                  onSendMessage={(message) => {
                    handleSendRight(typeof message === 'string' ? message : String(message));
                  }}
                  hasAttachButton={false}
                  onChange={(_, val) => {
                    setQuestionRight(typeof val === 'string' ? val : String(val));
                  }}
                  // value={questionRight}
                  // placeholder="Type your prompt for the right model..."
                  // Disable send button if message is empty or no model is selected
                  isSendButtonDisabled={!questionRight.trim() || !selectedModelRight}
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
          {modelJobIdRight && (
            <div style={{ marginTop: '1rem', maxHeight: 400, overflowY: 'auto' }}>
              <ExpandableSection
                toggleText={expandedJobsRight[modelJobIdRight] ? 'Hide Logs' : 'View Logs'}
                onToggle={(_event, expanded) => handleToggleLogsRight(modelJobIdRight, expanded)}
                isExpanded={expandedJobsRight[modelJobIdRight]}
              >
                {jobLogsRight[modelJobIdRight] ? (
                  <CodeBlock>
                    <CodeBlockCode id={`logs-${modelJobIdRight}`}>{jobLogsRight[modelJobIdRight]}</CodeBlockCode>
                  </CodeBlock>
                ) : (
                  <Spinner size="md" />
                )}
              </ExpandableSection>
            </div>
          )}
        </div>
      </div>

      {/* Unified MessageBar for both models */}
      {isUnifiedInput && (
        <PageSection style={{ backgroundColor: 'white', padding: '1rem' }}>
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
              isSendButtonDisabled={!questionUnified.trim() || !selectedModelLeft || !selectedModelRight}
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
        </PageSection>
      )}
    </div>
  );
};

export default ChatModelEval;
