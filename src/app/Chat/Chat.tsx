// Chat.tsx
import React, { useEffect, useRef, useState } from 'react';
import { ActionGroup } from '@patternfly/react-core/dist/dynamic/components/Form'
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button'
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form'
import { FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form'
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner'
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput'
import { usePostChat } from "@app/common/HooksPostChat";
import './ChatForm.css';
import UserIcon from '@patternfly/react-icons/dist/dynamic/icons/user-icon'
import CopyIcon from '@patternfly/react-icons/dist/dynamic/icons/copy-icon'
import botIconSrc from '../bgimages/bot-icon-chat-32x32.svg';

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

  const handleQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(event.target.value);
  };

  const handleContextChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setContext(event.target.value);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim()) return;

    setMessages(messages => [...messages, { text: question, isUser: true }]);
    setIsLoading(true);
    setQuestion('');
    setContext('');

    const result = await postChat({ question: question.trim(), context: context.trim() });
    setIsLoading(false);
    if (result && result.answer) {
      setMessages(messages => [...messages, { text: result.answer, isUser: false }]);
    } else {
      setMessages(messages => [...messages, { text: 'Failed to fetch response from the server.', isUser: false }]);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Text copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy text: ', err);
    });
  };

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="chat-container">
      <h1 className="chat-title">Model Chat - <em>Experimental</em></h1>
      <div ref={messagesContainerRef} className="messages-container">
        {messages.map((msg, index) => (
          <div key={index} className={`message ${msg.isUser ? 'chat-question' : 'chat-answer'}`}>
            {msg.isUser ? (
              <UserIcon className="user-icon" />
            ) : (
              <img src={botIconSrc} alt="Bot" className="bot-icon" />
            )}
            <pre><code>{msg.text}</code></pre>
            {!msg.isUser && (
              <Button variant="plain" onClick={() => copyToClipboard(msg.text)} aria-label="Copy to clipboard">
                <CopyIcon />
              </Button>
            )}
          </div>
        ))}
        {isLoading && <Spinner aria-label="Loading" size="lg" />}
      </div>
      <Form onSubmit={handleSubmit} className="chat-form">
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
        <ActionGroup>
          <Button variant="primary" type="submit">Send</Button>
        </ActionGroup>
      </Form>
    </div>
  );
};
