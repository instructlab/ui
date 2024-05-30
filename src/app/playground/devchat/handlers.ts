// src/app/playground/devchat/handlers.ts
import { Dispatch, SetStateAction } from 'react';
import { SliderOnChangeEvent } from '@patternfly/react-core/components';

interface Message {
  text: string;
  isUser: boolean;
}

interface Model {
  name: string;
  apiURL: string;
  modelName: string;
}

export const handleQuestionChange = (setQuestion: Dispatch<SetStateAction<string>>) => (value: string) => {
  setQuestion(value);
};

export const handleContextChange = (setContext: Dispatch<SetStateAction<string>>) => (value: string) => {
  setContext(value);
};

export const handleParameterChange = (setter: Dispatch<SetStateAction<number>>) => (value: string) => {
  const numValue = Number(value);
  setter(numValue);
};

/* eslint-disable @typescript-eslint/no-unused-vars */
export const handleSliderChange =
  (setter: Dispatch<SetStateAction<number>>) =>
  (_event: SliderOnChangeEvent, value: number, _inputValue?: number, _setLocalInputValue?: Dispatch<SetStateAction<number>>) => {
    setter(value);
  };

export const handleAddMessage = (
  question: string,
  setQuestion: Dispatch<SetStateAction<string>>,
  newMessages: Message[],
  setNewMessages: Dispatch<SetStateAction<Message[]>>,
  isUser: boolean
) => {
  if (question.trim()) {
    setNewMessages([...newMessages, { text: question, isUser }]);
    setQuestion('');
  }
};

export const handleDeleteMessage = (index: number, newMessages: Message[], setNewMessages: Dispatch<SetStateAction<Message[]>>) => {
  setNewMessages(newMessages.filter((_, i) => i !== index));
};

export const handleRunMessages = async (
  newMessages: Message[],
  setNewMessages: Dispatch<SetStateAction<Message[]>>,
  setMessages: Dispatch<SetStateAction<Message[]>>,
  setIsLoading: Dispatch<SetStateAction<boolean>>,
  systemRole: string,
  temperature: number,
  maxTokens: number,
  topP: number,
  frequencyPenalty: number,
  presencePenalty: number,
  repetitionPenalty: number,
  selectedModel: Model | null
) => {
  if (!newMessages.length || !selectedModel) return;

  const params = {
    question: newMessages.map((msg) => msg.text).join('\n'),
    systemRole,
    temperature,
    maxTokens,
    topP,
    frequencyPenalty,
    presencePenalty,
    repetitionPenalty,
    selectedModel,
  };

  // Remove parameters with a value of 0 or empty string
  const filteredParams = Object.fromEntries(
    Object.entries(params).filter(([key, value]) => {
      if (key === 'systemRole') return value !== '';
      return value !== 0;
    })
  );
  // Clear the user message, so it isn't printed again since its already in the chatbox
  setNewMessages([]);
  setIsLoading(true);

  const response = await fetch('/api/playground/devchat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(filteredParams),
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
