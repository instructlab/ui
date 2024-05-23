// src/app/granitechat/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import UserIcon from '@patternfly/react-icons/dist/dynamic/icons/user-icon';
import CopyIcon from '@patternfly/react-icons/dist/dynamic/icons/copy-icon';
import Image from 'next/image';
import styles from './chat.module.css';

interface Message {
  text: string;
  isUser: boolean;
}

const ChatPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const handleQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(event.target.value);
  };

  const handleContextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContext(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;

    setMessages((messages) => [...messages, { text: question, isUser: true }]);
    setQuestion('');
    setContext('');

    setIsLoading(true);
    const response = await fetch('/api/granitechat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ question, context }),
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

          // Update the last bot message with the new chunk
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

  const handleCopyToClipboard = (text: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => {
          console.log('Text copied to clipboard');
        })
        .catch((err) => {
          console.error('Could not copy text: ', err);
        });
    } else {
      // Fallback method for copying text if the browser doesn't support navigator.clipboard
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Text copied to clipboard');
      } catch (err) {
        console.error('Could not copy text: ', err);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <AppLayout>
      <div className={styles.chatContainer}>
        <h1 className={styles.chatTitle}>
          Granite-7b Model Chat - <em>Experimental</em>
        </h1>
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
              {!msg.isUser && (
                <Button variant="plain" onClick={() => handleCopyToClipboard(msg.text)} aria-label="Copy to clipboard">
                  <CopyIcon />
                </Button>
              )}
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
          <FormGroup fieldId="context-field">
            <TextInput
              type="text"
              id="context-field"
              name="context-field"
              value={context}
              onChange={handleContextChange}
              placeholder="Optional context here..."
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
