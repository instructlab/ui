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
  CodeBlockCode
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

// TODO: get nextjs app router server side render working with the patternfly chatbot component.
const MODEL_SERVER_IP = 'http://x.x.x.x';

const ChatModelEval: React.FC = () => {
  const [questionLeft, setQuestionLeft] = useState('');
  const [messagesLeft, setMessagesLeft] = useState<MessageProps[]>([]);
  const [selectedModelLeft, setSelectedModelLeft] = useState<Model | null>(null);
  const [alertMessageLeft, setAlertMessageLeft] = useState<{ title: string; message: string; variant: 'danger' | 'info' } | undefined>(undefined);
  const [isLoadingLeft, setIsLoadingLeft] = useState(false);

  const [questionRight, setQuestionRight] = useState('');
  const [messagesRight, setMessagesRight] = useState<MessageProps[]>([]);
  const [selectedModelRight, setSelectedModelRight] = useState<Model | null>(null);
  const [alertMessageRight, setAlertMessageRight] = useState<{ title: string; message: string; variant: 'danger' | 'info' } | undefined>(undefined);
  const [isLoadingRight, setIsLoadingRight] = useState(false);

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

  // Fetch models
  useEffect(() => {
    const fetchDefaultModels = async () => {
      const response = await fetch('/api/envConfig');
      const envConfig = await response.json();

      const defs: Model[] = [
        { name: 'Granite-7b', apiURL: envConfig.GRANITE_API, modelName: envConfig.GRANITE_MODEL_NAME },
        { name: 'Merlinite-7b', apiURL: envConfig.MERLINITE_API, modelName: envConfig.MERLINITE_MODEL_NAME }
      ];

      const storedEndpoints = localStorage.getItem('endpoints');
      const cust: Model[] = storedEndpoints
        ? JSON.parse(storedEndpoints).map((endpoint: Endpoint) => ({
            name: endpoint.modelName,
            apiURL: `${endpoint.url}`,
            modelName: endpoint.modelName
          }))
        : [];

      setDefaultModels(defs);
      setCustomModels(cust);
    };

    fetchDefaultModels();
  }, []);

  const handleServeModel = async (endpoint: string, side: 'left' | 'right') => {
    // Show loading popup
    if (side === 'left') {
      setShowModelLoadingLeft(true);
      setTimeout(() => setShowModelLoadingLeft(false), 3000);
    } else {
      setShowModelLoadingRight(true);
      setTimeout(() => setShowModelLoadingRight(false), 3000);
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
          name: 'Granite base model (Served)',
          apiURL: `${MODEL_SERVER_IP}:8000`, // API endpoint for base model
          modelName: 'granite-base-served'
        };

        if (side === 'left') {
          setSelectedModelLeft(servedModel);
        } else {
          setSelectedModelRight(servedModel);
        }
      } else if (endpoint.includes('serve-latest')) {
        const servedModel: Model = {
          name: 'Granite fine tune checkpoint (Served)',
          apiURL: `${MODEL_SERVER_IP}:8001`, // API endpoint for latest model
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
      const updated = [...msgs];
      const idx = updated.findIndex((m) => m.id === id);
      if (idx !== -1) {
        updated[idx].content = newContent;
      }
      return updated;
    });
  };

  const handleSend = async (
    side: 'left' | 'right',
    message: string,
    selectedModel: Model | null,
    setSelectedModelFn: React.Dispatch<React.SetStateAction<Model | null>>,
    setQuestionFn: React.Dispatch<React.SetStateAction<string>>,
    setIsLoadingFn: React.Dispatch<React.SetStateAction<boolean>>,
    setAlertMessageFn: React.Dispatch<React.SetStateAction<{ title: string; message: string; variant: 'danger' | 'info' } | undefined>>,
    setMessagesFn: React.Dispatch<React.SetStateAction<MessageProps[]>>
  ) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    if (!selectedModel) {
      setTimeout(() => {
        setAlertMessageFn({
          title: 'No Model Selected',
          message: 'Please select a model before sending a prompt.',
          variant: 'danger'
        });
      }, 0);
      return;
    }

    setAlertMessageFn(undefined);

    const userMsgId = `${Date.now()}_user_${side}`;
    setMessagesFn((msgs) => [
      ...msgs,
      {
        id: userMsgId,
        role: 'user',
        content: trimmedMessage,
        name: 'User',
        avatar: userLogo.src,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);

    setQuestionFn('');
    setIsLoadingFn(true);

    const messagesPayload = [
      { role: 'system', content: systemRole },
      { role: 'user', content: trimmedMessage }
    ];

    const requestData = {
      model: selectedModel.modelName,
      messages: messagesPayload,
      stream: true
    };

    const botMessageId = `${Date.now()}_bot_${side}`;
    setMessagesFn((msgs) => [
      ...msgs,
      {
        id: botMessageId,
        role: 'bot',
        content: '',
        name: 'Bot',
        avatar: logo.src,
        timestamp: new Date().toLocaleTimeString(),
        isLoading: true
      }
    ]);

    try {
      const chatResponse = await fetch(`${selectedModel.apiURL}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream'
        },
        body: JSON.stringify(requestData)
      });

      if (!chatResponse.body) {
        setIsLoadingFn(false);
        setMessagesFn((msgs) => {
          const updated = [...msgs];
          const idx = updated.findIndex((m) => m.id === botMessageId);
          if (idx !== -1) {
            updated[idx].isLoading = false;
            updated[idx].content = 'Failed to fetch response from the server.';
          }
          return updated;
        });
        return;
      }

      const reader = chatResponse.body.getReader();
      const textDecoder = new TextDecoder('utf-8');
      let botMessage = '';

      let done = false;
      let firstTokenReceived = false;
      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;
        if (!value) {
          continue;
        }

        const chunk = textDecoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter((line) => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const json = line.replace('data: ', '');
            if (json === '[DONE]') {
              setIsLoadingFn(false);
              setMessagesFn((msgs) => {
                const updated = [...msgs];
                const idx = updated.findIndex((m) => m.id === botMessageId);
                if (idx !== -1) {
                  updated[idx].isLoading = false;
                }
                return updated;
              });
              return;
            }

            try {
              const parsed = JSON.parse(json);
              const deltaContent = parsed.choices[0].delta?.content;
              if (deltaContent) {
                if (!firstTokenReceived) {
                  firstTokenReceived = true;
                  setMessagesFn((msgs) => {
                    const updated = [...msgs];
                    const idx = updated.findIndex((m) => m.id === botMessageId);
                    if (idx !== -1) {
                      updated[idx].isLoading = false;
                    }
                    return updated;
                  });
                }

                botMessage += deltaContent;
                handleStreamUpdate(botMessageId, botMessage, setMessagesFn);
              }
            } catch (err) {
              console.error('Error parsing chunk as JSON:', err);
            }
          }
        }
      }

      // If stream ends without [DONE]
      setIsLoadingFn(false);
      setMessagesFn((msgs) => {
        const updated = [...msgs];
        const idx = updated.findIndex((m) => m.id === botMessageId);
        if (idx !== -1) {
          updated[idx].isLoading = false;
        }
        return updated;
      });
    } catch (error) {
      console.error('Error fetching chat response:', error);
      setIsLoadingFn(false);
      setMessagesFn((msgs) => {
        const updated = [...msgs];
        const idx = updated.findIndex((m) => m.id === botMessageId);
        if (idx !== -1) {
          updated[idx].isLoading = false;
          updated[idx].content = 'Error fetching chat response';
        }
        return updated;
      });
    }
  };

  const handleSendLeft = (message: string) => {
    handleSend('left', message, selectedModelLeft, setSelectedModelLeft, setQuestionLeft, setIsLoadingLeft, setAlertMessageLeft, setMessagesLeft);
  };

  const handleSendRight = (message: string) => {
    handleSend(
      'right',
      message,
      selectedModelRight,
      setSelectedModelRight,
      setQuestionRight,
      setIsLoadingRight,
      setAlertMessageRight,
      setMessagesRight
    );
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

  // Logs Handling - now calling the Next.js API routes
  // Example: /api/fine-tune/jobs/[job_id]/logs
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

  return (
    <div>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
          <BreadcrumbItem isActive>Model Chat Evaluation</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10' }}>
          Evaluate Two Models Side-by-Side
        </Title>
        <Content>
          <br />
          Select a model in each panel to compare responses. For example, compare the base Granite model with a fine-tuned Granite model.
        </Content>
      </PageSection>

      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '0.25rem', marginLeft: '1rem', marginRight: '1rem' }}>
        {/* Left Chat */}
        <div style={{ flex: '1 1 45%', maxWidth: '45%', marginBottom: '2rem' }}>
          <Chatbot isVisible={true} className="chatbot-ui-page">
            <ChatbotHeader>
              <ChatbotHeaderMain />
              <ChatbotHeaderActions>
                <ChatbotHeaderSelectorDropdown value={selectedModelLeft?.name || 'Select a model'} onSelect={onSelectModelLeft}>
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
                <Button variant="secondary" onClick={handleCleanupLeft} aria-label="Clear chat" style={{ marginLeft: '1rem' }}>
                  <FontAwesomeIcon icon={faBroom} /> Clear chat
                </Button>
              </ChatbotHeaderActions>
            </ChatbotHeader>
            <ChatbotContent>
              <MessageBox>
                <ChatbotWelcomePrompt title="" description="" />
                {alertMessageLeft && (
                  <ChatbotAlert variant={alertMessageLeft.variant} onClose={() => setAlertMessageLeft(undefined)} title={alertMessageLeft.title}>
                    {alertMessageLeft.message}
                  </ChatbotAlert>
                )}
                {messagesLeft.map((msg) => (
                  <Message key={msg.id} {...msg} />
                ))}
              </MessageBox>
            </ChatbotContent>
            <ChatbotFooter>
              <MessageBar
                onSendMessage={(message) => handleSendLeft(message)}
                hasAttachButton={false}
                onChange={(event, val) => setQuestionLeft(val)}
                value={questionLeft}
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
        <div style={{ flex: '1 1 45%', maxWidth: '45%', marginBottom: '2rem' }}>
          <Chatbot isVisible={true} className="chatbot-ui-page">
            <ChatbotHeader>
              <ChatbotHeaderMain />
              <ChatbotHeaderActions>
                <ChatbotHeaderSelectorDropdown value={selectedModelRight?.name || 'Select a model'} onSelect={onSelectModelRight}>
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
                <Button variant="secondary" onClick={handleCleanupRight} aria-label="Clear chat" style={{ marginLeft: '1rem' }}>
                  <FontAwesomeIcon icon={faBroom} /> Clear chat
                </Button>
              </ChatbotHeaderActions>
            </ChatbotHeader>
            <ChatbotContent>
              <MessageBox>
                <ChatbotWelcomePrompt title="" description="" />
                {alertMessageRight && (
                  <ChatbotAlert variant={alertMessageRight.variant} onClose={() => setAlertMessageRight(undefined)} title={alertMessageRight.title}>
                    {alertMessageRight.message}
                  </ChatbotAlert>
                )}
                {messagesRight.map((msg) => (
                  <Message key={msg.id} {...msg} />
                ))}
              </MessageBox>
            </ChatbotContent>
            <ChatbotFooter>
              <MessageBar
                onSendMessage={(message) => handleSendRight(message)}
                hasAttachButton={false}
                onChange={(event, val) => setQuestionRight(val)}
                value={questionRight}
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
    </div>
  );
};

export default ChatModelEval;
