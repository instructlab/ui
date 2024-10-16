// src/app/playground/chat/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Breadcrumb, BreadcrumbItem, PageBreadcrumb, PageSection, TextContent, TextInput, Title } from '@patternfly/react-core/';
import { Select } from '@patternfly/react-core/dist/dynamic/components/Select';
import { SelectOption, SelectList } from '@patternfly/react-core/dist/dynamic/components/Select';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import UserIcon from '@patternfly/react-icons/dist/dynamic/icons/user-icon';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import styles from './chat.module.css';
import { Endpoint, Message, Model } from '@/types';
import CopyToClipboardButton from '@/components/CopyToClipboardButton';

const ChatPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const systemRole =
    'You are a cautious assistant. You carefully follow instructions.' +
    ' You are helpful and harmless and you follow ethical guidelines and promote positive behavior.';
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [isModelSelectedOnSend, setIsModelSelectedOnSend] = useState(true);
  const [isPromptOnSend, setIsPromptOnSend] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [customModels, setCustomModels] = useState<Model[]>([]);
  const [defaultModels, setDefaultModels] = useState<Model[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDefaultModels = async () => {
      const response = await fetch('/api/envConfig');
      const envConfig = await response.json();

      const defaultModels: Model[] = [
        { name: 'Granite-7b', apiURL: envConfig.GRANITE_API, modelName: envConfig.GRANITE_MODEL_NAME, apiKey: 'default' },
        { name: 'Merlinite-7b', apiURL: envConfig.MERLINITE_API, modelName: envConfig.MERLINITE_MODEL_NAME, apiKey: 'default' }
      ];

      const storedEndpoints = localStorage.getItem('endpoints');

      const customModels = storedEndpoints
        ? JSON.parse(storedEndpoints).map((endpoint: Endpoint) => ({
            name: endpoint.modelName,
            apiURL: `${endpoint.url}`,
            modelName: endpoint.modelName,
            apiKey: endpoint.apiKey
          }))
        : [];

      setDefaultModels(defaultModels);
      setCustomModels(customModels);
    };

    fetchDefaultModels();
  }, []);

  const onToggleClick = () => {
    setIsSelectOpen(!isSelectOpen);
  };

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    const selected = [...defaultModels, ...customModels].find((model) => model.name === value) || null;
    setSelectedModel(selected);
    setIsSelectOpen(false);
    setIsModelSelectedOnSend(true);
  };

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isSelectOpen} style={{ width: '200px' }}>
      {selectedModel ? selectedModel.name : 'Select a model'}
    </MenuToggle>
  );

  const dropdownItems = [...defaultModels, ...customModels]
    .filter((model) => model.name && model.apiURL && model.modelName)
    .map((model, index) => (
      <SelectOption key={index} value={model.name}>
        {model.name}
      </SelectOption>
    ));

  const handleQuestionChange = (event: React.FormEvent<HTMLInputElement>, value: string) => {
    setQuestion(value);
  };

  const handleQuestionFieldSelected = () => {
    setIsPromptOnSend(true);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedModel) {
      setIsModelSelectedOnSend(false);
      return;
    }
    if (!question.trim()) {
      setIsPromptOnSend(false);
      return;
    }

    setMessages((messages) => [...messages, { text: question, isUser: true }]);
    setQuestion('');

    setIsLoading(true);

    const requestData = {
      question: question,
      systemRole: systemRole,
      apiURL: selectedModel.apiURL,
      modelName: selectedModel.modelName,
      apiKey: selectedModel.apiKey
    };
    // Server-side fetch for default endpoints
    const response = await fetch(`/api/playground/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    if (response.body) {
      const reader = response.body.getReader();
      const textDecoder = new TextDecoder('utf-8');
      let botMessage = '';

      setMessages((messages) => [...messages, { text: '', isUser: false }]);

      (async () => {
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = textDecoder.decode(value, { stream: true });
          botMessage += chunk;

          setMessages((messages) => {
            const updatedMessages = [...messages];
            updatedMessages[updatedMessages.length - 1].text = botMessage;
            return updatedMessages;
          });
        }
        setIsLoading(false);
      })();
    } else {
      setMessages((messages) => [...messages, { text: 'Failed to fetch response from the server.', isUser: false }]);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const handleCleanup = () => {
    setMessages([]);
  };

  return (
    <AppLayout>
      <PageBreadcrumb>
        <Breadcrumb>
          <BreadcrumbItem to="/"> Dashboard </BreadcrumbItem>
          <BreadcrumbItem isActive>Chat</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>

      <PageSection style={{ backgroundColor: 'white' }}>
        <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10' }}>
          Chat with a Model
        </Title>
        <TextContent>
          <br />
          Chat with the served models. Currently it allows you to chat with Merlinite-7b and Granite-7B models hosted on your Cloud. Users can add
          their own custom endpoint using the &quot;Custom Model Endpoints&quot; feature. Once the custom endpoint is configured, it will be available
          in the model selector dropdown with the pre hosted models.
        </TextContent>
      </PageSection>
      <div className={styles.chatContainer}>
        <div className={styles.modelSelector}>
          <span className={styles.modelSelectorLabel}>Model Selector</span>
          <Select
            id="single-select"
            isOpen={isSelectOpen}
            selected={selectedModel ? selectedModel.name : 'Select a model'}
            onSelect={onSelect}
            onOpenChange={(isOpen) => setIsSelectOpen(isOpen)}
            toggle={toggle}
            shouldFocusToggleOnSelect
          >
            <SelectList>{dropdownItems}</SelectList>
          </Select>
          <Button variant="plain" onClick={handleCleanup} aria-label="Cleanup" style={{ marginLeft: 'auto' }}>
            <FontAwesomeIcon icon={faBroom} />
          </Button>
        </div>
        <div ref={messagesContainerRef} className={styles.messagesContainer}>
          {messages.map((msg, index) => (
            <div key={index} className={`${styles.message} ${msg.isUser ? styles.chatQuestion : styles.chatAnswer}`}>
              {msg.isUser ? (
                <UserIcon className={styles.userIcon} />
              ) : (
                <Image src="/bot-icon-chat-32x32.svg" alt="Bot" width={32} height={32} className={styles.botIcon} />
              )}
              <pre>
                <code>{msg.text}</code>
              </pre>
              {!msg.isUser && <CopyToClipboardButton text={msg.text} />}
            </div>
          ))}
          {isLoading && <Spinner aria-label="Loading" size="lg" />}
        </div>
        <Form onSubmit={handleSubmit} className={styles.chatForm}>
          <FormGroup fieldId="question-field">
            <TextInput
              isRequired
              type="text"
              id="question-field"
              name="question-field"
              value={question}
              onChange={handleQuestionChange}
              onSelect={handleQuestionFieldSelected}
              placeholder="Type your question here..."
            />
          </FormGroup>
          <Button variant="primary" type="submit">
            Send
          </Button>
          {!isModelSelectedOnSend && (
            <div>
              <Alert variant="danger" title="No Model Selected" ouiaId="DangerAlert" />
            </div>
          )}
          {!isPromptOnSend && (
            <div>
              <Alert variant="danger" title="No Question Added!" ouiaId="DangerAlert" />
            </div>
          )}
        </Form>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
