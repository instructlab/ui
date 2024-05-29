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
import { useModelSelector } from './useModelSelector';
import CurlCommandModal from '../../../components/CurlCommandModal';
import CopyToClipboardButton from '../../../components/CopyToClipboardButton';
import {
  handleQuestionChange,
  handleContextChange,
  handleParameterChange,
  handleSliderChange,
  handleAddMessage,
  handleDeleteMessage,
  handleRunMessages,
} from './handlers';

interface Message {
  text: string;
  isUser: boolean;
}

const ChatPage: React.FC = () => {
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

  const { isSelectOpen, selectedModel, customModels, setIsSelectOpen, onToggleClick, onSelect } = useModelSelector();

  const toggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onToggleClick} isExpanded={isSelectOpen} style={{ width: '200px' }}>
      {selectedModel ? selectedModel.name : 'Select a model'}
    </MenuToggle>
  );

  const dropdownItems = customModels
    .filter((model) => model.name && model.apiURL && model.modelName) // Filter out models with missing properties
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

export default ChatPage;
