// src/app/playground/devchat/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { TextArea } from '@patternfly/react-core/dist/dynamic/components/TextArea';
import { Select, SelectOption, SelectList } from '@patternfly/react-core/dist/dynamic/components/Select';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Slider } from '@patternfly/react-core/dist/dynamic/components/Slider';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import CodeIcon from '@patternfly/react-icons/dist/dynamic/icons/code-icon';
import TimesIcon from '@patternfly/react-icons/dist/dynamic/icons/times-icon';
import styles from './playground.module.css';
import CurlCommandModal from '../../../components/CurlCommandModal';
import CopyToClipboardButton from '../../../components/CopyToClipboardButton';
import { Endpoint, Message, Model } from '@/types';
import {
  handleQuestionChange,
  handleContextChange,
  handleParameterChange,
  handleSliderChange,
  handleAddMessage,
  handleDeleteMessage,
  handleRunMessages,
} from './handlers';

const DevChatPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [systemRole, setSystemRole] = useState(
    'You are a cautious assistant. You carefully follow instructions.' +
      ' You are helpful and harmless and you follow ethical guidelines and promote positive behavior.'
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessages, setNewMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [temperature, setTemperature] = useState(1);
  const [maxTokens, setMaxTokens] = useState(1792);
  const [topP, setTopP] = useState(1);
  const [frequencyPenalty, setFrequencyPenalty] = useState(0);
  const [presencePenalty, setPresencePenalty] = useState(0);
  const [repetitionPenalty, setRepetitionPenalty] = useState(1.05);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [isSelectOpen, setIsSelectOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [customModels, setCustomModels] = useState<Model[]>([]);
  const [defaultModels, setDefaultModels] = useState<Model[]>([]);

  useEffect(() => {
    const fetchDefaultModels = async () => {
      const response = await fetch('/api/envConfig');
      const envConfig = await response.json();

      const defaultModels: Model[] = [
        { name: 'Granite-7b', apiURL: envConfig.GRANITE_API, modelName: envConfig.GRANITE_MODEL_NAME },
        { name: 'Merlinite-7b', apiURL: envConfig.MERLINITE_API, modelName: envConfig.MERLINITE_MODEL_NAME },
      ];

      const storedEndpoints = localStorage.getItem('endpoints');

      const customModels = storedEndpoints
        ? JSON.parse(storedEndpoints).map((endpoint: Endpoint) => ({
            name: endpoint.modelName,
            apiURL: `${endpoint.url}`,
            modelName: endpoint.modelName,
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

  const handleCleanup = () => {
    setMessages([]);
    setNewMessages([]);
    setQuestion('');
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const runMessage = async (
    newMessages: Message[],
    setNewMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>,
    setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
    systemRole: string,
    temperature: number,
    maxTokens: number,
    topP: number,
    frequencyPenalty: number,
    presencePenalty: number,
    repetitionPenalty: number,
    selectedModel: Model | null
  ) => {
    if (!selectedModel) return;

    setIsLoading(true);

    const messagesPayload = [
      { role: 'system', content: systemRole },
      ...newMessages.map((msg) => ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text })),
    ];

    const requestData = {
      model: selectedModel.modelName,
      messages: messagesPayload,
      temperature,
      max_tokens: maxTokens,
      top_p: topP,
      frequency_penalty: frequencyPenalty,
      presence_penalty: presencePenalty,
      repetition_penalty: repetitionPenalty,
      stream: true,
    };

    setMessages((messages) => [...messages, ...newMessages]);
    setNewMessages([]);

    if (customModels.some((model) => model.name === selectedModel.name)) {
      // Client-side fetch if the model is a custom endpoint
      try {
        const chatResponse = await fetch(`${selectedModel.apiURL}/v1/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          body: JSON.stringify(requestData),
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
        const lastIndex = messages.length + 1;

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
                      updatedMessages[lastIndex].text = botMessage;
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
      // Run default server side models messaging if the model is not a custom endpoint
      handleRunMessages(
        newMessages,
        setNewMessages,
        setMessages,
        setIsLoading,
        systemRole,
        temperature,
        maxTokens,
        topP,
        frequencyPenalty,
        presencePenalty,
        repetitionPenalty,
        selectedModel
      );
    }
  };

  return (
    <AppLayout>
      <div className={styles.pageContainer}>
        <div className={styles.headerSection}>
          <div className={styles.modelSelector}>
            <span className={styles.modelSelectorLabel}>
              {' '}
              <b>Model Selector </b>
            </span>
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
          </div>
          <div className={styles.headerButtons}>
            <Button variant="plain" onClick={() => setIsModalOpen(true)} aria-label="Show Code">
              <CodeIcon />
            </Button>
            <Button variant="plain" onClick={handleCleanup} aria-label="Cleanup">
              <FontAwesomeIcon icon={faBroom} />
            </Button>
          </div>
        </div>
        <div className={styles.contentContainer}>
          <div className={styles.chatSection}>
            <FormGroup fieldId="system-role-field" label={<span className={styles.boldLabel}>System Role</span>}>
              <TextArea
                isRequired
                id="system-role-field"
                name="system-role-field"
                value={systemRole}
                onChange={(event) => handleContextChange(setSystemRole)(event.currentTarget.value)}
                placeholder="Enter system role..."
                aria-label="System Role"
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </FormGroup>
            <div ref={messagesContainerRef} className={styles.messagesContainer}>
              {messages.map((msg, index) => (
                <div key={index} className={`${styles.message} ${msg.isUser ? styles.chatQuestion : styles.chatAnswer}`}>
                  <div className={styles.messageHeader}>
                    <div className={styles.messageType}>{msg.isUser ? 'User' : 'Model Response'}</div>
                    <div className={styles.messageActions}>
                      {!msg.isUser && <CopyToClipboardButton text={msg.text} />}
                      <Button variant="plain" onClick={() => handleDeleteMessage(index, messages, setMessages)} aria-label="Delete message">
                        <TimesIcon />
                      </Button>
                    </div>
                  </div>
                  {msg.isUser ? (
                    <TextInput
                      id={`message-${index}`}
                      aria-label={`Message ${index}`}
                      value={msg.text}
                      onChange={(event, value) => {
                        const newMessages = [...messages];
                        newMessages[index].text = value;
                        setMessages(newMessages);
                      }}
                    />
                  ) : (
                    <div>{msg.text}</div>
                  )}
                </div>
              ))}
              {newMessages.map((msg, index) => (
                <div key={index} className={`${styles.message} ${msg.isUser ? styles.chatQuestion : styles.chatAnswer}`}>
                  <div className={styles.messageHeader}>
                    <div className={styles.messageType}>{msg.isUser ? 'User' : 'Model Response'}</div>
                    <div className={styles.messageActions}>
                      <Button variant="plain" onClick={() => handleDeleteMessage(index, newMessages, setNewMessages)} aria-label="Delete message">
                        <TimesIcon />
                      </Button>
                    </div>
                  </div>
                  <TextInput
                    id={`new-message-${index}`}
                    aria-label={`New Message ${index}`}
                    value={msg.text}
                    onChange={(event, value) => {
                      const newMsgs = [...newMessages];
                      newMsgs[index].text = value;
                      setNewMessages(newMsgs);
                    }}
                  />
                </div>
              ))}
              {isLoading && <Spinner aria-label="Loading" size="lg" />}
            </div>
            <div className={styles.chatInputContainer}>
              <TextInput
                isRequired
                type="text"
                id="question-field"
                name="question-field"
                value={question}
                onChange={(event, value) => handleQuestionChange(setQuestion)(value)}
                placeholder="Enter Text..."
                aria-label="Question"
              />
              <Button variant="secondary" onClick={() => handleAddMessage(question, setQuestion, newMessages, setNewMessages, true)}>
                Add
              </Button>
              <Button
                variant="primary"
                onClick={() =>
                  runMessage(
                    newMessages,
                    setNewMessages,
                    setMessages,
                    setIsLoading,
                    systemRole,
                    temperature,
                    maxTokens,
                    topP,
                    frequencyPenalty,
                    presencePenalty,
                    repetitionPenalty,
                    selectedModel
                  )
                }
              >
                Run
              </Button>
            </div>
          </div>
          <div className={styles.parametersSection}>
            <Form>
              <FormGroup fieldId="temperature-field" label="Temperature">
                <div className={styles.parameterGroup}>
                  <TextInput
                    type="number"
                    value={temperature}
                    onChange={(event, value) => handleParameterChange(setTemperature)(value)}
                    className={styles.parameterInput}
                    min={0}
                    max={2}
                    step={0.1}
                    aria-label="Temperature input"
                    style={{ MozAppearance: 'textfield' }}
                  />
                  <Slider
                    value={temperature}
                    onChange={(event, value, inputValue, setLocalInputValue) =>
                      handleSliderChange(setTemperature)(event, value, inputValue, setLocalInputValue)
                    }
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
              </FormGroup>
              <FormGroup fieldId="max-tokens-field" label="Maximum Tokens">
                <div className={styles.parameterGroup}>
                  <TextInput
                    type="number"
                    value={maxTokens}
                    onChange={(event, value) => handleParameterChange(setMaxTokens)(value)}
                    className={styles.parameterInput}
                    min={1}
                    max={1792}
                    aria-label="Max tokens input"
                    style={{ MozAppearance: 'textfield' }}
                  />
                  <Slider
                    value={maxTokens}
                    onChange={(event, value, inputValue, setLocalInputValue) =>
                      handleSliderChange(setMaxTokens)(event, value, inputValue, setLocalInputValue)
                    }
                    min={1}
                    max={1792}
                  />
                </div>
              </FormGroup>
              <FormGroup fieldId="top-p-field" label="Top P">
                <div className={styles.parameterGroup}>
                  <TextInput
                    type="number"
                    value={topP}
                    onChange={(event, value) => handleParameterChange(setTopP)(value)}
                    className={styles.parameterInput}
                    min={0}
                    max={1}
                    step={0.1}
                    aria-label="Top P input"
                    style={{ MozAppearance: 'textfield' }}
                  />
                  <Slider
                    value={topP}
                    onChange={(event, value, inputValue, setLocalInputValue) =>
                      handleSliderChange(setTopP)(event, value, inputValue, setLocalInputValue)
                    }
                    min={0}
                    max={1}
                    step={0.1}
                  />
                </div>
              </FormGroup>
              <FormGroup fieldId="frequency-penalty-field" label="Frequency Penalty">
                <div className={styles.parameterGroup}>
                  <TextInput
                    type="number"
                    value={frequencyPenalty}
                    onChange={(event, value) => handleParameterChange(setFrequencyPenalty)(value)}
                    className={styles.parameterInput}
                    min={0}
                    max={2}
                    step={0.1}
                    aria-label="Frequency penalty input"
                    style={{ MozAppearance: 'textfield' }}
                  />
                  <Slider
                    value={frequencyPenalty}
                    onChange={(event, value, inputValue, setLocalInputValue) =>
                      handleSliderChange(setFrequencyPenalty)(event, value, inputValue, setLocalInputValue)
                    }
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
              </FormGroup>
              <FormGroup fieldId="presence-penalty-field" label="Presence Penalty">
                <div className={styles.parameterGroup}>
                  <TextInput
                    type="number"
                    value={presencePenalty}
                    onChange={(event, value) => handleParameterChange(setPresencePenalty)(value)}
                    className={styles.parameterInput}
                    min={0}
                    max={2}
                    step={0.1}
                    aria-label="Presence penalty input"
                    style={{ MozAppearance: 'textfield' }}
                  />
                  <Slider
                    value={presencePenalty}
                    onChange={(event, value, inputValue, setLocalInputValue) =>
                      handleSliderChange(setPresencePenalty)(event, value, inputValue, setLocalInputValue)
                    }
                    min={0}
                    max={2}
                    step={0.1}
                  />
                </div>
              </FormGroup>
              <FormGroup fieldId="repetition-penalty-field" label="Repetition Penalty">
                <div className={styles.parameterGroup}>
                  <TextInput
                    type="number"
                    value={repetitionPenalty}
                    onChange={(event, value) => handleParameterChange(setRepetitionPenalty)(value)}
                    className={styles.parameterInput}
                    min={0}
                    max={2}
                    step={0.05}
                    aria-label="Repetition penalty input"
                    style={{ MozAppearance: 'textfield' }}
                  />
                  <Slider
                    value={repetitionPenalty}
                    onChange={(event, value, inputValue, setLocalInputValue) =>
                      handleSliderChange(setRepetitionPenalty)(event, value, inputValue, setLocalInputValue)
                    }
                    min={0}
                    max={2}
                    step={0.05}
                  />
                </div>
              </FormGroup>
            </Form>
          </div>
        </div>
      </div>

      <CurlCommandModal
        isModalOpen={isModalOpen}
        handleModalToggle={() => setIsModalOpen(!isModalOpen)}
        systemRole={systemRole}
        messages={messages}
        newMessages={newMessages}
        temperature={temperature}
        maxTokens={maxTokens}
        topP={topP}
        frequencyPenalty={frequencyPenalty}
        presencePenalty={presencePenalty}
        repetitionPenalty={repetitionPenalty}
        selectedModel={selectedModel}
      />
    </AppLayout>
  );
};

export default DevChatPage;
