// src/app/playground/chat/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/';
import { Select } from '@patternfly/react-core/dist/dynamic/components/Select';
import { SelectOption, SelectList } from '@patternfly/react-core/dist/dynamic/components/Select';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import UserIcon from '@patternfly/react-icons/dist/dynamic/icons/user-icon';
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
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [customModels, setCustomModels] = useState<Model[]>([]);
  const [defaultModels, setDefaultModels] = useState<Model[]>([]);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDefaultModels = async () => {
      const response = await fetch('/api/envConfig');
      const envConfig = await response.json();

      const defaultModels: Model[] = [
        { name: 'Granite-7b', apiURL: envConfig.GRANITE_API, modelName: envConfig.GRANITE_MODEL_NAME },
        { name: 'Merlinite-7b', apiURL: envConfig.MERLINITE_API, modelName: envConfig.MERLINITE_MODEL_NAME }
      ];

      const storedEndpoints = localStorage.getItem('endpoints');

      const customModels = storedEndpoints
        ? JSON.parse(storedEndpoints).map((endpoint: Endpoint) => ({
            name: endpoint.modelName,
            apiURL: `${endpoint.url}`,
            modelName: endpoint.modelName
          }))
        : [];

      setDefaultModels(defaultModels);
      setCustomModels(customModels);
      setSelectedModel([...defaultModels, ...customModels][0] || null);
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim() || !selectedModel) return;

    setMessages((messages) => [...messages, { text: question, isUser: true }]);
    setQuestion('');

    setIsLoading(true);

    const messagesPayload = [
      { role: 'system', content: systemRole },
      { role: 'user', content: question }
    ];

    const requestData = {
      model: selectedModel.modelName,
      messages: messagesPayload,
      stream: true
    };

    if (customModels.some((model) => model.name === selectedModel.name)) {
      // Client-side fetch if the selected model is a custom endpoint
      try {
        const chatResponse = await fetch(`${selectedModel.apiURL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json'
          },
          body: JSON.stringify(requestData)
        });

        if (!chatResponse.body) {
          setMessages((messages) => [...messages, { text: 'Failed to fetch chat response', isUser: false }]);
          setIsLoading(false);
          return;
        }

        const reader = chatResponse.body.getReader();
        const textDecoder = new TextDecoder('utf-8');
        let botMessage = '';

        setMessages((messages) => [...messages, { text: '', isUser: false }]);

        let done = false;
        while (!done) {
          const { value, done: isDone } = await reader.read();
          done = isDone;
          if (value) {
            const chunk = textDecoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter((line) => line.trim() !== '');

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const json = line.replace('data: ', '');
                if (json === '[DONE]') {
                  setIsLoading(false);
                  return;
                }

                try {
                  const parsed = JSON.parse(json);
                  const deltaContent = parsed.choices[0].delta?.content;

                  if (deltaContent) {
                    botMessage += deltaContent;

                    setMessages((messages) => {
                      const updatedMessages = [...messages];
                      updatedMessages[updatedMessages.length - 1].text = botMessage;
                      return updatedMessages;
                    });
                  }
                } catch (err) {
                  console.error('Error parsing chunk:', err);
                }
              }
            }
          }
        }

        setIsLoading(false);
      } catch (error) {
        setMessages((messages) => [...messages, { text: 'Error fetching chat response', isUser: false }]);
        setIsLoading(false);
      }
    } else {
      // Server-side fetch for default endpoints
      const response = await fetch(
        `/api/playground/chat?apiURL=${encodeURIComponent(selectedModel.apiURL)}&modelName=${encodeURIComponent(selectedModel.modelName)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question, systemRole })
        }
      );

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
              placeholder="Type your question here..."
            />
          </FormGroup>
          <Button variant="primary" type="submit">
            Send
          </Button>
        </Form>
      </div>
    </AppLayout>
  );
};

export default ChatPage;
