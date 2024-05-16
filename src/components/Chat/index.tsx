// src/components/Chat/index.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import UserIcon from '@patternfly/react-icons/dist/dynamic/icons/user-icon';
import CopyIcon from '@patternfly/react-icons/dist/dynamic/icons/copy-icon';
import ArrowUpIcon from '@patternfly/react-icons/dist/dynamic/icons/arrow-up-icon';
import Image from 'next/image';
import { usePostChat } from '../../common/HooksPostChat';
import styles from './chat.module.css';

interface Message {
  text: string;
  isUser: boolean;
}

export const ChatForm: React.FunctionComponent = () => {
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const { postChat } = usePostChat();

  const handleQuestionChange = (event: React.FormEvent<HTMLInputElement>, value: string) => {
    setQuestion(value);
  };

  const handleContextChange = (event: React.FormEvent<HTMLInputElement>, value: string) => {
    setContext(value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;

    setMessages((messages) => [...messages, { text: question, isUser: true }]);
    setIsLoading(true);
    setQuestion('');
    setContext('');

    const result = await postChat({
      question: question.trim(),
      context: context.trim(),
    });

    setIsLoading(false);

    if (result && result.answer) {
      setMessages((messages) => [...messages, { text: result.answer, isUser: false }]);
    } else {
      setMessages((messages) => [...messages, { text: 'Failed to fetch response from the server.', isUser: false }]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        console.log('Text copied to clipboard');
      })
      .catch((err) => {
        console.error('Failed to copy text: ', err);
      });
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className={styles.chatContainer}>
      <h1 className={styles.chatTitle}>
        Model Chat - <em>Experimental</em>
      </h1>
      <div ref={messagesContainerRef} className={styles.messagesContainer}>
        {messages.map((msg, index) => (
          <div key={index} className={`${styles.message} ${msg.isUser ? styles.chatQuestion : styles.chatAnswer}`}>
            {msg.isUser ? (
              <UserIcon className={styles.userIcon} />
            ) : (
              <Image src="/bot-icon-chat-32x32.svg" alt="Bot" className={styles.botIcon} width={32} height={32} />
            )}
            <pre>
              <code>{msg.text}</code>
            </pre>
            {!msg.isUser && (
              <Button variant="plain" onClick={() => copyToClipboard(msg.text)} aria-label="Copy to clipboard">
                <CopyIcon />
              </Button>
            )}
          </div>
        ))}
        {isLoading && <Spinner className={styles.spinner} aria-label="Loading" size="lg" />}
      </div>
      <div className={styles.chatFormContainer}>
        <Form onSubmit={handleSubmit} className={styles.chatForm}>
          <div className={styles.inputFieldsContainer}>
            <div className={styles.inputFields}>
              <FormGroup fieldId="question-field" className={styles.inputField}>
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
              <FormGroup fieldId="context-field" className={styles.inputField}>
                <TextInput
                  type="text"
                  id="context-field"
                  name="context-field"
                  value={context}
                  onChange={handleContextChange}
                  placeholder="Optional context here..."
                />
              </FormGroup>
            </div>
            <Button type="submit" className={styles.sendButton} aria-label="Send">
              <ArrowUpIcon />
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
};
