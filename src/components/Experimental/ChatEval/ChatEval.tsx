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
  ChatbotAlert
} from '@patternfly/chatbot';
import logo from '../../../../public/bot-icon-chat-32x32.svg';
import userLogo from '../../../../public/default-avatar.svg';
import ModelStatusIndicator from '@/components/Experimental/ModelServeStatus/ModelServeStatus';

// TODO: get nextjs app router server side render working with the patternfly chatbot component.
const MODEL_SERVER_URL = process.env.NEXT_PUBLIC_MODEL_SERVER_URL;
// const MODEL_SERVER_IP = 'http://128.31.20.81';

const ChatModelEval: React.FC = () => {
  const [isUnifiedInput, setIsUnifiedInput] = useState(false);

  // States for unified input
  const [questionUnified, setQuestionUnified] = useState('');

  // States for left chat
  const [questionLeft, setQuestionLeft] = useState('');
  const [messagesLeft, setMessagesLeft] = useState<MessageProps[]>([]);
  const [selectedModelLeft, setSelectedModelLeft] = useState<Model | null>(null);
  const [alertMessageLeft, setAlertMessageLeft] = useState<{ title: string; message: string; variant: 'danger' | 'info' } | undefined>(undefined);

  // States for right chat
  const [questionRight, setQuestionRight] = useState('');
  const [messagesRight, setMessagesRight] = useState<MessageProps[]>([]);
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
    const intervalId = setInterval(fetchGpus, 20000);
    return () => clearInterval(intervalId);
  }, []);

  // Fetch models on component mount
  useEffect(() => {
    const fetchDefaultModels = async () => {
      const response = await fetch('/api/envConfig');
      const envConfig = await response.json();

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
   * "granite-base-served" => "pre-train"
   * "granite-latest-served" => "post-train"
   * Custom models retain their original modelName.
   */
  const mapModelName = (modelName: string): string => {
    if (modelName === 'granite-base-served') {
      return 'pre-train';
    } else if (modelName === 'granite-latest-served') {
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
          apiURL: `${MODEL_SERVER_URL}:8000`, // endpoint for base model
          modelName: 'granite-base-served'
        };

        if (side === 'left') {
          setSelectedModelLeft(servedModel);
        } else {
          setSelectedModelRight(servedModel);
        }
      } else if (endpoint.includes('serve-latest')) {
        const servedModel: Model = {
          name: 'Granite fine tune checkpoint (Serving)',
          apiURL: `${MODEL_SERVER_URL}:8001`, // endpoint for latest model
          modelName: 'granite-latest-served'
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
        console.error('Failed to unload pre-train:', resp.status, resp.statusText);
        return;
      }
      const data = await resp.json();
      console.log('Unload left success:', data);

      // Optionally clear out the selected model and job logs on the left
      setSelectedModelLeft(null);
      setModelJobIdLeft(undefined);
      setMessagesLeft([]);
      setAlertMessageLeft({
        title: 'Model Unloaded',
        message: 'Successfully unloaded the pre-train model.',
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
        console.error('Failed to unload post-train:', resp.status, resp.statusText);
        return;
      }
      const data = await resp.json();
      console.log('Unload right success:', data);

      // Optionally clear out the selected model and job logs on the right
      setSelectedModelRight(null);
      setModelJobIdRight(undefined);
      setMessagesRight([]);
      setAlertMessageRight({
        title: 'Model Unloaded',
        message: 'Successfully unloaded the post-train model.',
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
    setAlertMessageLeft(undefined);
  };

  const handleCleanupRight = () => {
    setMessagesRight([]);
    setAlertMessageRight(undefined);
  };

  // Common stream update handler
  const handleStreamUpdate = (id: string, newContent: string, setMessagesFn: React.Dispatch<React.SetStateAction<MessageProps[]>>) => {
    setMessagesFn((msgs) => {
      if (!msgs) {
        console.error('msgs is undefined in handleStreamUpdate');
        return [];
      }
      const updated = [...msgs];
      const idx = updated.findIndex((m) => m.id === id);
      if (idx !== -1) {
        updated[idx].content = newContent;
      }
      return updated;
    });
  };

  const handleSend = async (side: 'left' | 'right', message: string) => {
    const trimmedMessage = message.trim();

    // Prevent sending empty messages
    if (!trimmedMessage) {
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

    // Add the user's message to the chat
    const userMsgId = `${Date.now()}_user_${side}`;
    const userMessage: MessageProps = {
      id: userMsgId,
      role: 'user',
      content: trimmedMessage,
      name: 'User',
      avatar: userLogo.src,
      timestamp: new Date().toLocaleTimeString()
    };

    if (side === 'left') {
      setMessagesLeft((msgs) => [...msgs, userMessage]);
      setQuestionLeft(''); // Clear the input field
    } else {
      setMessagesRight((msgs) => [...msgs, userMessage]);
      setQuestionRight('');
    }

    // Add a loading message from the bot
    const botMsgId = `${Date.now()}_bot_${side}`;
    const botMessage: MessageProps = {
      id: botMsgId,
      role: 'bot',
      content: '',
      name: 'Bot',
      avatar: logo.src,
      timestamp: new Date().toLocaleTimeString(),
      isLoading: true
    };

    if (side === 'left') {
      setMessagesLeft((msgs) => [...msgs, botMessage]);
    } else {
      setMessagesRight((msgs) => [...msgs, botMessage]);
    }

    // Prepare the payload for the backend
    const messagesPayload = [
      { role: 'system', content: systemRole },
      { role: 'user', content: trimmedMessage }
    ];

    const chatModelName = mapModelName(selectedModel.modelName);

    const requestData = {
      model: chatModelName,
      messages: messagesPayload,
      stream: true
    };

    console.log('Sending message to chat endpoint:', selectedModel.apiURL);

    try {
      // Send the message to the backend
      const response = await fetch(`${selectedModel.apiURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        body: JSON.stringify(requestData)
      });

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
          setMessagesLeft((msgs) => msgs.map((msg) => (msg.id === botMsgId ? errorMessage : msg)));
        } else {
          setMessagesRight((msgs) => msgs.map((msg) => (msg.id === botMsgId ? errorMessage : msg)));
        }
        return;
      }

      if (!response.body) {
        console.error(`No response body received from ${side} side.`);
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let doneReading = false;
      let botContent = '';

      while (!doneReading) {
        const { value, done: isDone } = await reader.read();
        doneReading = isDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter((line) => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.replace('data: ', '');
              if (data === '[DONE]') {
                doneReading = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices[0].delta?.content;
                if (delta) {
                  botContent += delta;
                  if (side === 'left') {
                    setMessagesLeft((msgs) => msgs.map((msg) => (msg.id === botMsgId ? { ...msg, content: botContent } : msg)));
                  } else {
                    setMessagesRight((msgs) => msgs.map((msg) => (msg.id === botMsgId ? { ...msg, content: botContent } : msg)));
                  }
                }
              } catch (e) {
                console.error('Error parsing JSON:', e);
              }
            }
          }
        }
      }

      // Finalize the bot message by removing the loading state
      if (side === 'left') {
        setMessagesLeft((msgs) => msgs.map((msg) => (msg.id === botMsgId ? { ...msg, isLoading: false } : msg)));
      } else {
        setMessagesRight((msgs) => msgs.map((msg) => (msg.id === botMsgId ? { ...msg, isLoading: false } : msg)));
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
        setMessagesLeft((msgs) => msgs.map((msg) => (msg.id === botMsgId ? errorMessage : msg)));
      } else {
        setMessagesRight((msgs) => msgs.map((msg) => (msg.id === botMsgId ? errorMessage : msg)));
      }
    }
  };

  const handleSendLeft = (message: string) => {
    handleSend('left', message);
  };

  const handleSendRight = (message: string) => {
    handleSend('right', message);
  };

  // Add a copy action to bot messages when they are fully loaded
  const transformedMessagesLeft = messagesLeft.map((m) => {
    if (m.role === 'bot' && m.content && !m.isLoading) {
      return {
        ...m,
        actions: {
          copy: { onClick: () => navigator.clipboard.writeText(m.content || '') }
        }
      };
    }
    return m;
  });

  const transformedMessagesRight = messagesRight.map((m) => {
    if (m.role === 'bot' && m.content && !m.isLoading) {
      return {
        ...m,
        actions: {
          copy: { onClick: () => navigator.clipboard.writeText(m.content || '') }
        }
      };
    }
    return m;
  });

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

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.25rem', marginLeft: '1rem', marginRight: '1rem' }}>
        {/* Left Chat */}
        <div style={{ flex: '1 1 45%', maxWidth: '45%', marginBottom: '2rem' }}>
          <Chatbot isVisible={true} className="chatbot-ui-page">
            <ChatbotHeader className="pf-chatbot__header">
              <ChatbotHeaderMain />
              <ChatbotHeaderActions className="pf-chatbot__header-actions">
                <ModelStatusIndicator modelName={selectedModelLeft?.modelName || null} />
                {freeGpus < 1 && !selectedModelLeft && <span style={{ color: 'red', marginRight: '0.5rem', padding: '0.5rem' }}>No GPUs free</span>}
                <ChatbotHeaderSelectorDropdown
                  disabled={freeGpus < 1 && !selectedModelLeft}
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
                  <ChatbotAlert variant={alertMessageLeft.variant} onClose={() => setAlertMessageLeft(undefined)} title={alertMessageLeft.title}>
                    {alertMessageLeft.message}
                  </ChatbotAlert>
                )}
                {transformedMessagesLeft.map((msg) => (
                  <Message key={msg.id} {...msg} />
                ))}
              </MessageBox>
            </ChatbotContent>
            {!isUnifiedInput && (
              <ChatbotFooter className="pf-chatbot__footer">
                <MessageBar
                  onSendMessage={(message) => {
                    console.debug(`onSendMessage triggered for left side with message: "${message}"`);
                    handleSendLeft(message);
                  }}
                  hasAttachButton={false}
                  onChange={(event, val) => {
                    console.debug(`Left MessageBar onChange: "${val}"`);
                    setQuestionLeft(val);
                  }}
                  value={questionLeft}
                  placeholder="Type your prompt for the left model..."
                  // Disable send button if message is empty or no model is selected
                  isSendButtonDisabled={!questionLeft.trim() || !selectedModelLeft}
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
            )}
          </Chatbot>
          {modelJobIdLeft && (
            <div style={{ marginTop: '1rem' }}>
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
        <div style={{ flex: '1 1 45%', maxWidth: '55%', marginBottom: '2rem' }}>
          <Chatbot isVisible={true} className="chatbot-ui-page">
            <ChatbotHeader className="pf-chatbot__header">
              <ChatbotHeaderMain />
              <ChatbotHeaderActions className="pf-chatbot__header-actions">
                <ModelStatusIndicator modelName={selectedModelRight?.modelName || null} />
                {freeGpus < 1 && !selectedModelRight && <span style={{ color: 'red', marginRight: '0.5rem', padding: '0.5rem' }}>No GPUs free</span>}
                <ChatbotHeaderSelectorDropdown
                  disabled={freeGpus < 1 && !selectedModelLeft}
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
                  <ChatbotAlert variant={alertMessageRight.variant} onClose={() => setAlertMessageRight(undefined)} title={alertMessageRight.title}>
                    {alertMessageRight.message}
                  </ChatbotAlert>
                )}
                {transformedMessagesRight.map((msg) => (
                  <Message key={msg.id} {...msg} />
                ))}
              </MessageBox>
            </ChatbotContent>
            {!isUnifiedInput && (
              <ChatbotFooter className="pf-chatbot__footer">
                <MessageBar
                  onSendMessage={(message) => {
                    console.debug(`onSendMessage triggered for right side with message: "${message}"`);
                    handleSendRight(message);
                  }}
                  hasAttachButton={false}
                  onChange={(event, val) => {
                    console.debug(`Right MessageBar onChange: "${val}"`);
                    setQuestionRight(val);
                  }}
                  value={questionRight}
                  placeholder="Type your prompt for the right model..."
                  // Disable send button if message is empty or no model is selected
                  isSendButtonDisabled={!questionRight.trim() || !selectedModelRight}
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
            )}
          </Chatbot>
          {modelJobIdRight && (
            <div style={{ marginTop: '1rem' }}>
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
                console.debug(`onSendMessage triggered for unified input with message: "${message}"`);
                handleUnifiedSend(message);
              }}
              hasAttachButton={false}
              onChange={(event, val) => {
                console.debug(`Unified MessageBar onChange: "${val}"`);
                setQuestionUnified(val);
              }}
              value={questionUnified}
              placeholder="Type your prompt here and send to both models..."
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
