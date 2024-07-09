// src/app/playground/ragchat/page.tsx
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput, TextArea } from '@patternfly/react-core/';
import { Select } from '@patternfly/react-core/dist/dynamic/components/Select';
import { SelectOption, SelectList } from '@patternfly/react-core/dist/dynamic/components/Select';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import UserIcon from '@patternfly/react-icons/dist/dynamic/icons/user-icon';
import CopyIcon from '@patternfly/react-icons/dist/dynamic/icons/copy-icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import styles from './ragchat.module.css';
import { DsDataIndex, DsDocument } from '@/types';

interface Message {
  text: string;
  isUser: boolean;
}

interface Model {
  name: string;
  apiURL: string;
  modelName: string;
}

const ChatPage: React.FC = () => {
  const [question, setQuestion] = useState('');
  const [systemRole, setSystemRole] = useState(
    'You are a cautious assistant. You carefully follow instructions. You are helpful and harmless and you follow' +
      ' ethical guidelines and promote positive behavior. Given the following information from relevant documentation,' +
      " answer the user's question using only that information, outputted in markdown format. If you are unsure and" +
      ' the answer is not explicitly written in the documentation, say "Sorry, I don\'t have any documentation on that' +
      ' topic." Always include citations from the documentation after you answer the user\'s query.'
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModelSelectOpen, setIsModelSelectOpen] = useState(false);
  const [isDataIndexSelectOpen, setIsDataIndexSelectOpen] = useState(false);
  const [isDocumentSelectOpen, setIsDocumentSelectOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [customModels, setCustomModels] = useState<Model[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dataIndices, setDataIndices] = useState<DsDataIndex[]>([]);
  const [selectedDataIndex, setSelectedDataIndex] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DsDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);
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
        ? JSON.parse(storedEndpoints).map((endpoint: any) => ({
            name: endpoint.modelName,
            apiURL: `${endpoint.url}`,
            modelName: endpoint.modelName
          }))
        : [];

      const allModels = [...defaultModels, ...customModels];
      setCustomModels(allModels);
      setSelectedModel(allModels[0] || null);
    };

    fetchDefaultModels();
  }, []);

  useEffect(() => {
    const fetchDataIndices = async () => {
      try {
        const response = await fetch('/api/playground/ragchat/data-indices');
        if (response.ok) {
          const data = await response.json();
          setDataIndices(data.dataIndices);
        } else {
          console.error('Failed to fetch data indices:', await response.text());
        }
      } catch (error) {
        console.error('Error fetching data indices:', error);
      }
    };

    fetchDataIndices();
  }, []);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!selectedDataIndex) return;

      try {
        const response = await fetch(`/api/playground/ragchat/index-files?indexKey=${encodeURIComponent(selectedDataIndex)}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setDocuments(data.documents);
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch documents:', errorText);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      }
    };

    fetchDocuments();
  }, [selectedDataIndex]);

  const onModelToggleClick = () => {
    setIsModelSelectOpen(!isModelSelectOpen);
  };

  const onDataIndexToggleClick = () => {
    setIsDataIndexSelectOpen(!isDataIndexSelectOpen);
  };

  const onDocumentToggleClick = () => {
    setIsDocumentSelectOpen(!isDocumentSelectOpen);
  };

  const onModelSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    const selected = customModels.find((model) => model.name === value) || null;
    setSelectedModel(selected);
    setIsModelSelectOpen(false);
  };

  const onDataIndexSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    setSelectedDataIndex(value as string);
    setIsDataIndexSelectOpen(false);
  };

  const onDocumentSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    setSelectedDocument(value as string);
    setIsDocumentSelectOpen(false);
  };

  const modelToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onModelToggleClick} isExpanded={isModelSelectOpen} style={{ width: '200px' }}>
      {selectedModel ? selectedModel.name : 'Select a model'}
    </MenuToggle>
  );

  const dataIndexToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onDataIndexToggleClick} isExpanded={isDataIndexSelectOpen} style={{ width: '200px' }}>
      {selectedDataIndex ? dataIndices.find((index) => index.source.index_key === selectedDataIndex)?.name : 'Select a data index'}
    </MenuToggle>
  );

  const documentToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onDocumentToggleClick} isExpanded={isDocumentSelectOpen} style={{ width: '200px' }}>
      {selectedDocument ? documents.find((doc) => doc.document_hash === selectedDocument)?.filename : 'Select a document'}
    </MenuToggle>
  );

  const modelDropdownItems = customModels
    .filter((model) => model.name && model.apiURL && model.modelName)
    .map((model, index) => (
      <SelectOption key={index} value={model.name}>
        {model.name}
      </SelectOption>
    ));

  const dataIndexItems = dataIndices.map((index) => (
    <SelectOption key={index.source.index_key} value={index.source.index_key}>
      {index.name}
    </SelectOption>
  ));

  const handleQuestionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuestion(event.target.value);
  };

  const handleSystemRoleChange = (value: string) => {
    setSystemRole(value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleFileUpload = async () => {
    const fileUrl = 'ADD_URL_HERE_CAN_ALSO_BE_A_FILE_TBD_SEE_DOC_CONVERSION';

    try {
      const response = await fetch('/api/playground/ragchat/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileUrl })
      });

      const responseText = await response.text();
      console.log('File upload response:', responseText);

      if (response.ok) {
        console.log('File uploaded successfully');
      } else {
        console.error('Failed to upload file:', responseText);
      }
    } catch (error) {
      console.error('Error during file upload:', error);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim() || !selectedModel || !selectedDataIndex) return;

    setMessages((messages) => [...messages, { text: question, isUser: true }]);
    setQuestion('');

    setIsLoading(true);
    try {
      // Step 1: Send question to RAG backend and get the prompt
      const ragResponse = await fetch('/api/playground/ragchat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question, dataIndex: selectedDataIndex, docHash: selectedDocument })
      });

      if (!ragResponse.ok) {
        const errorText = await ragResponse.text();
        setMessages((messages) => [...messages, { text: 'Failed to fetch response from RAG backend.', isUser: false }]);
        console.error('Failed to fetch response from RAG backend:', errorText);
        setIsLoading(false);
        return;
      }

      const ragData = await ragResponse.json();
      const prompt = ragData.prompt;
      console.log('Prompt:', prompt);

      // Step 2: Send the prompt to the chat API
      const chatResponse = await fetch(
        `/api/playground/chat?apiURL=${encodeURIComponent(selectedModel.apiURL)}&modelName=${encodeURIComponent(selectedModel.modelName)}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ question: prompt, systemRole })
        }
      );

      if (chatResponse.body) {
        const reader = chatResponse.body.getReader();
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
        const errorText = await chatResponse.text();
        setMessages((messages) => [...messages, { text: 'Failed to fetch response from the server.', isUser: false }]);
        console.error('Failed to fetch response from the server:', errorText);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error during question submission:', error);
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

  const handleCleanup = () => {
    setMessages([]);
  };

  const documentDropdownItems = documents.map((doc) => (
    <SelectOption key={doc.document_hash} value={doc.document_hash}>
      {doc.filename}
    </SelectOption>
  ));

  return (
    <AppLayout>
      <div className={styles.chatContainer}>
        <div className={styles.modelAndUploadContainer}>
          <div className={styles.modelSelector}>
            <span className={styles.modelSelectorLabel}>Model Selector</span>
            <Select
              id="single-select"
              isOpen={isModelSelectOpen}
              selected={selectedModel ? selectedModel.name : 'Select a model'}
              onSelect={onModelSelect}
              onOpenChange={(isOpen) => setIsModelSelectOpen(isOpen)}
              toggle={modelToggle}
              shouldFocusToggleOnSelect
            >
              <SelectList>{modelDropdownItems}</SelectList>
            </Select>
          </div>
          <div className={styles.fileUpload}>
            <span className={styles.boldLabel}>Upload Documents</span>
            <input type="file" onChange={handleFileChange} />
            <Button variant="primary" onClick={handleFileUpload} size="sm">
              Upload
            </Button>
          </div>
        </div>
        <div>
          <span className={styles.boldLabel}>Select Data Collection</span>
          <Select
            id="data-index-select"
            isOpen={isDataIndexSelectOpen}
            selected={selectedDataIndex ? dataIndices.find((index) => index.source.index_key === selectedDataIndex)?.name : 'Select a data index'}
            onSelect={onDataIndexSelect}
            onOpenChange={(isOpen) => setIsDataIndexSelectOpen(isOpen)}
            toggle={dataIndexToggle}
            shouldFocusToggleOnSelect
          >
            <SelectList>{dataIndexItems}</SelectList>
          </Select>
        </div>
        <div className={styles.selectDocumentContainer}>
          <span className={styles.boldLabel}>Select Document</span>
          <Select
            id="document-select"
            isOpen={isDocumentSelectOpen}
            selected={selectedDocument ? documents.find((doc) => doc.document_hash === selectedDocument)?.filename : 'Select a document'}
            onSelect={onDocumentSelect}
            onOpenChange={(isOpen) => setIsDocumentSelectOpen(isOpen)}
            toggle={documentToggle}
            shouldFocusToggleOnSelect
          >
            <SelectList>{documentDropdownItems}</SelectList>
          </Select>
        </div>
        <FormGroup fieldId="system-role-field" label={<span className={styles.boldLabel}>System Role</span>}>
          <TextArea
            isRequired
            id="system-role-field"
            name="system-role-field"
            value={systemRole}
            onChange={(event) => handleSystemRoleChange(event.currentTarget.value)}
            placeholder="Enter system role..."
            aria-label="System Role"
            rows={4}
          />
        </FormGroup>
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
        <div className={styles.cleanupButtonContainer}>
          <Button variant="plain" onClick={handleCleanup} aria-label="Cleanup">
            <FontAwesomeIcon icon={faBroom} />
          </Button>
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
