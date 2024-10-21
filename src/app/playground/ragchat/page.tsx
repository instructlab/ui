// src/app/playground/ragchat
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Form, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import { TextInput } from '@patternfly/react-core/dist/dynamic/components/TextInput';
import { Select } from '@patternfly/react-core/dist/dynamic/components/Select';
import { SelectOption, SelectList } from '@patternfly/react-core/dist/dynamic/components/Select';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { ToggleGroup, ToggleGroupItem } from '@patternfly/react-core/dist/dynamic/components/ToggleGroup';
import {
  MultipleFileUpload,
  MultipleFileUploadMain,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem
} from '@patternfly/react-core/dist/dynamic/components/MultipleFileUpload';
import { Modal } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { HelperText, HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';
import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import UserIcon from '@patternfly/react-icons/dist/dynamic/icons/user-icon';
import CopyIcon from '@patternfly/react-icons/dist/dynamic/icons/copy-icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBroom } from '@fortawesome/free-solid-svg-icons';
import Image from 'next/image';
import styles from './ragchat.module.css';

interface Message {
  text: string;
  isUser: boolean;
}

interface ReadFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

const Page: React.FC = () => {
  // State variables
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCollectionSelectOpen, setIsCollectionSelectOpen] = useState(false);
  const [collections, setCollections] = useState<string[]>([]);
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [uploadCollectionName, setUploadCollectionName] = useState(''); // Collection name input for file upload
  const [uploadURL, setUploadURL] = useState('');
  const [ingestMethod, setIngestMethod] = useState('url');
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // File upload state
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [readFileData, setReadFileData] = useState<ReadFile[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [statusIcon, setStatusIcon] = useState<'inProgress' | 'success' | 'danger'>('inProgress');
  const [modalText, setModalText] = useState('');
  const [urlCollectionName, setUrlCollectionName] = useState(''); // Collection name for URL upload
  const [fileCollectionName, setFileCollectionName] = useState(''); // Collection name for file upload

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    fetchCollections();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Handlers for collection selection and toggle
  const onCollectionToggleClick = () => {
    setIsCollectionSelectOpen((prev) => !prev);

    // Force refresh collections when dropdown is opened
    if (!isCollectionSelectOpen) {
      console.log('Dropdown opened, fetching collections');
      fetchCollections();
    }
  };

  useEffect(() => {
    if (currentFiles.length > 0) {
      setShowStatus(true);
    } else {
      setShowStatus(false);
    }
  }, [currentFiles]);

  useEffect(() => {
    if (readFileData.length < currentFiles.length) {
      setStatusIcon('inProgress');
    } else if (readFileData.every((file) => file.loadResult === 'success')) {
      setStatusIcon('success');
    } else {
      setStatusIcon('danger');
    }
  }, [readFileData, currentFiles]);

  // Handlers for collection selection
  // const onCollectionToggleClick = () => {
  //   setIsCollectionSelectOpen(!isCollectionSelectOpen);
  // };

  // Fetch collections from the server
  const fetchCollections = async () => {
    console.log('Fetching collections...');
    try {
      const response = await fetch('/api/playground/ragchat/collections');
      if (response.ok) {
        const data = await response.json();
        setCollections(data.collections);
        console.log('Collections fetched:', data.collections);
      } else {
        console.error('Failed to fetch collections:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };
  const onCollectionSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    setSelectedCollection(String(value));
    setIsCollectionSelectOpen(false);
  };

  const collectionToggle = (toggleRef: React.Ref<MenuToggleElement>) => (
    <MenuToggle ref={toggleRef} onClick={onCollectionToggleClick} isExpanded={isCollectionSelectOpen} style={{ width: '200px' }}>
      {selectedCollection ? selectedCollection : 'Select a collection'}
    </MenuToggle>
  );

  const collectionItems = collections.map((collection) => (
    <SelectOption key={collection} value={collection}>
      {collection}
    </SelectOption>
  ));

  // Handler for question input change
  const handleQuestionChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setQuestion(value);
  };

  // Handler for file upload
  // Inside Page.tsx
  const handleFileUpload = async () => {
    if (!uploadCollectionName || currentFiles.length === 0) {
      alert('Please enter collection name and select at least one file');
      return;
    }

    const formData = new FormData();
    currentFiles.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`/api/playground/ragchat/collections/${encodeURIComponent(uploadCollectionName)}/documents/file`, {
        method: 'POST',
        body: formData
      });

      const responseText = await response.text();
      console.log('File upload response:', responseText);

      if (response.ok) {
        console.log('File uploaded successfully');
        if (!collections.includes(uploadCollectionName)) {
          setCollections([...collections, uploadCollectionName]);
        }
        // Clear the files after successful upload
        setCurrentFiles([]);
        setReadFileData([]);
        setShowStatus(false);
        setStatusIcon('inProgress');
      } else {
        console.error('Failed to upload file:', responseText);
        alert(`Failed to upload file: ${responseText}`);
      }
    } catch (error) {
      console.error('Error during file upload:', error);
      alert('An error occurred during file upload.');
    }
  };

  // Handler for URL upload
  const handleURLUpload = async () => {
    if (!uploadCollectionName || !uploadURL) {
      alert('Please enter collection name and URL');
      return;
    }

    try {
      const response = await fetch(`/api/playground/ragchat/collections/${encodeURIComponent(uploadCollectionName)}/documents/url`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          http_source: {
            url: uploadURL,
            headers: {}
          }
        })
      });

      const responseData = await response.json();
      console.log('URL upload response:', responseData);

      if (response.ok) {
        console.log('URL uploaded successfully');
        if (!collections.includes(uploadCollectionName)) {
          setCollections([...collections, uploadCollectionName]);
        }
        // Optionally, reset the upload URL input
        setUploadURL('');
      } else {
        console.error('Failed to upload URL:', responseData.error);
        alert(`Failed to upload URL: ${responseData.error}`);
      }
    } catch (error) {
      console.error('Error during URL upload:', error);
      alert('An error occurred during URL upload.');
    }
  };

  // Handler for deleting a collection
  const handleDeleteCollection = async () => {
    if (!selectedCollection) return;

    try {
      const response = await fetch(`/api/playground/ragchat/collections/${encodeURIComponent(selectedCollection)}/delete`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setCollections(collections.filter((collection) => collection !== selectedCollection));
        setSelectedCollection(null);
        console.log('Collection deleted successfully');
      } else {
        console.error('Failed to delete collection:', await response.text());
        alert('Failed to delete collection.');
      }
    } catch (error) {
      console.error('Error during collection deletion:', error);
      alert('An error occurred during collection deletion.');
    }
  };

  // Handler for submitting a query
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!question.trim() || !selectedCollection) return;

    setMessages((messages) => [...messages, { text: question, isUser: true }]);
    setQuestion('');

    setIsLoading(true);
    try {
      const response = await fetch(`/api/playground/ragchat/collections/${encodeURIComponent(selectedCollection)}/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ question })
      });

      if (!response.ok) {
        const errorText = await response.text();
        setMessages((messages) => [...messages, { text: 'Failed to fetch response from the server.', isUser: false }]);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      const answer = data.answer || '';
      const sources = data.sources || [];

      console.log('Answer:', answer);
      console.log('Sources:', sources);

      setMessages((messages) => [...messages, { text: answer, isUser: false, sources }]);
      setIsLoading(false);
    } catch (error) {
      console.error('Error during question submission:', error);
      setIsLoading(false);
      alert('An error occurred during question submission.');
    }
  };

  // Scroll to the bottom of the messages when new messages are added
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Handler for copying text to clipboard
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

  // Handler for cleaning up messages
  const handleCleanup = () => {
    setMessages([]);
  };

  // Handler for changing ingest method
  const handleIngestMethodChange = (event: React.MouseEvent<HTMLButtonElement>) => {
    const id = event.currentTarget.id;
    setIngestMethod(id === 'toggle-group-single-file' ? 'file' : 'url');
  };

  // Functions for file upload
  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const newCurrentFiles = currentFiles.filter((file) => !namesOfFilesToRemove.includes(file.name));
    const newReadFiles = readFileData.filter((file) => !namesOfFilesToRemove.includes(file.fileName));
    setCurrentFiles(newCurrentFiles);
    setReadFileData(newReadFiles);
  };

  const handleFileDrop = (_event: any, droppedFiles: File[]) => {
    const currentFileNames = currentFiles.map((file) => file.name);
    const reUploads = droppedFiles.filter((file) => currentFileNames.includes(file.name));

    const newFiles = [
      ...currentFiles.filter((file) => !reUploads.includes(file)),
      ...droppedFiles.filter((file) => !currentFileNames.includes(file.name))
    ];
    setCurrentFiles(newFiles);
  };

  const handleReadSuccess = (data: string, file: File) => {
    setReadFileData((prevReadFiles) => {
      const existingFile = prevReadFiles.find((readFile) => readFile.fileName === file.name);
      if (existingFile) {
        return prevReadFiles;
      }
      return [...prevReadFiles, { data, fileName: file.name, loadResult: 'success' }];
    });
  };

  const handleReadFail = (error: DOMException, file: File) => {
    setReadFileData((prevReadFiles) => {
      const existingFile = prevReadFiles.find((readFile) => readFile.fileName === file.name);
      if (existingFile) {
        return prevReadFiles;
      }
      return [...prevReadFiles, { loadError: error, fileName: file.name, loadResult: 'danger' }];
    });
  };

  const handleDropRejected = (fileRejections: any[]) => {
    console.warn('Files rejected:', fileRejections);
    if (fileRejections.length === 1) {
      setModalText(`${fileRejections[0].file.name} is not an accepted file type.`);
    } else {
      const rejectedMessages = fileRejections.reduce((acc, fileRejection) => (acc += `${fileRejection.file.name}, `), '');
      setModalText(`${rejectedMessages} are not accepted file types.`);
    }
  };

  const createHelperText = (file: File) => {
    const fileResult = readFileData.find((readFile) => readFile.fileName === file.name);
    if (fileResult?.loadError) {
      return (
        <HelperText isLiveRegion>
          <HelperTextItem variant={'error'}>{fileResult.loadError.toString()}</HelperTextItem>
        </HelperText>
      );
    }
  };

  const successfullyReadFileCount = readFileData.filter((fileData) => fileData.loadResult === 'success').length;

  // Format metadata for display
  const formatMetadata = (metadata: any) => {
    return Object.keys(metadata)
      .map((key) => `${key}: ${metadata[key]}`)
      .join(', ');
  };

  return (
    <AppLayout>
      <div className={styles.chatContainer}>
        {/* Ingest Data Method Toggle */}
        <div className={styles.selectDocumentContainer}>
          <span className={styles.boldLabel}>Ingest Data Method</span>
          <ToggleGroup aria-label="Ingest Method Toggle">
            <ToggleGroupItem
              text="From URL"
              buttonId="toggle-group-single-url"
              isSelected={ingestMethod === 'url'}
              onChange={handleIngestMethodChange}
            />
            <ToggleGroupItem
              text="From File"
              buttonId="toggle-group-single-file"
              isSelected={ingestMethod === 'file'}
              onChange={handleIngestMethodChange}
            />
          </ToggleGroup>
        </div>

        {/* Collection Name Input for File/URL Upload */}
        <FormGroup label="Collection Name for Data Ingestion" fieldId="upload-collection-name">
          <TextInput
            isRequired
            type="text"
            id="upload-collection-name"
            name="upload-collection-name"
            value={uploadCollectionName}
            onChange={(_event, value) => setUploadCollectionName(value)}
            placeholder="Enter collection name for upload"
          />
        </FormGroup>

        {/* Ingest Data Section */}
        {ingestMethod === 'file' ? (
          <>
            {/* File Upload Dropzone */}
            <div>
              <MultipleFileUpload
                onFileDrop={handleFileDrop}
                dropzoneProps={{
                  accept: {
                    'application/pdf': ['.pdf'],
                    'text/plain': ['.txt'],
                    'application/msword': ['.doc', '.docx']
                  },
                  onDropRejected: handleDropRejected
                }}
              >
                <MultipleFileUploadMain
                  titleIcon={<UploadIcon />}
                  titleText="Drag and drop files here"
                  titleTextSeparator="or"
                  infoText="Accepted file types: PDF, TXT, DOC, DOCX"
                />
                {showStatus && (
                  <MultipleFileUploadStatus
                    statusToggleText={`${successfullyReadFileCount} of ${currentFiles.length} files uploaded`}
                    statusToggleIcon={statusIcon}
                    aria-label="Current uploads"
                  >
                    {currentFiles.map((file) => (
                      <MultipleFileUploadStatusItem
                        file={file}
                        key={file.name}
                        onClearClick={() => removeFiles([file.name])}
                        onReadSuccess={handleReadSuccess}
                        onReadFail={handleReadFail}
                        progressHelperText={createHelperText(file)}
                      />
                    ))}
                  </MultipleFileUploadStatus>
                )}
                <Modal
                  isOpen={!!modalText}
                  title="Unsupported file"
                  titleIconVariant="warning"
                  variant="small"
                  aria-label="unsupported file upload attempted"
                  onClose={() => setModalText('')}
                  actions={[
                    <Button key="close" variant="secondary" onClick={() => setModalText('')}>
                      Close
                    </Button>
                  ]}
                >
                  <p>{modalText}</p>
                </Modal>
              </MultipleFileUpload>
            </div>
            {/* Upload Files Button */}
            <Button variant="primary" onClick={handleFileUpload} size="sm" style={{ marginTop: '10px' }}>
              Process Files
            </Button>
          </>
        ) : (
          /* URL Upload Section */
          <div>
            <FormGroup label="URL to Convert and Ingest" fieldId="upload-url">
              <TextInput
                isRequired
                type="text"
                id="upload-url"
                name="upload-url"
                value={uploadURL}
                onChange={(_event, value) => setUploadURL(value)}
                placeholder="Enter URL to Ingest"
              />
            </FormGroup>
            {/* Made the Upload URL button full width */}
            <Button variant="primary" onClick={handleURLUpload} size="sm" isBlock>
              Process URL
            </Button>
          </div>
        )}
        <div style={{ marginBottom: '20px' }}></div>
        {/* Messages Container */}
        <div className={styles.messagesContainer} ref={messagesContainerRef}>
          {messages.map((msg, index) => (
            <div key={index} className={`${styles.message} ${msg.isUser ? styles.chatQuestion : styles.chatAnswer}`}>
              {msg.isUser ? (
                <UserIcon className={styles.userIcon} />
              ) : (
                <Image src="/bot-icon-chat-32x32.svg" alt="Bot" width={32} height={32} className={styles.botIcon} />
              )}
              <div>
                <pre>
                  <code>{msg.text}</code>
                </pre>
                {!msg.isUser && msg.sources && (
                  <div className={styles.sourcesContainer}>
                    <br />
                    <h5>Sources:</h5>
                    {msg.sources.map((source, i) => (
                      <div key={i} className={styles.sourceItem}>
                        <p>
                          <strong>Source {i + 1}:</strong> {source.text}
                        </p>
                        <p>
                          <em>Metadata:</em> {formatMetadata(source.metadata)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {!msg.isUser && (
                <Button variant="plain" onClick={() => handleCopyToClipboard(msg.text)} aria-label="Copy to clipboard">
                  <CopyIcon />
                </Button>
              )}
            </div>
          ))}
          {isLoading && <Spinner aria-label="Loading" size="lg" />}
        </div>

        {/* Cleanup Button */}
        <div className={styles.cleanupButtonContainer}>
          <Button variant="plain" onClick={handleCleanup} aria-label="Cleanup">
            <FontAwesomeIcon icon={faBroom} />
          </Button>
        </div>

        {/* Chat Form */}
        <div className={styles.chatFormContainer}>
          <Form onSubmit={handleSubmit} className={styles.chatForm}>
            {/* Collection Selector for Query Submission */}
            <div>
              <span className={styles.boldLabel}>Select Collection</span>
              <Select
                id="collection-select"
                isOpen={isCollectionSelectOpen}
                selected={selectedCollection ? selectedCollection : 'Select a collection'}
                onSelect={onCollectionSelect}
                onOpenChange={(isOpen) => setIsCollectionSelectOpen(isOpen)}
                toggle={collectionToggle}
                shouldFocusToggleOnSelect
              >
                <SelectList>{collectionItems}</SelectList>
              </Select>
              {selectedCollection && (
                <Button variant="danger" onClick={handleDeleteCollection} size="sm">
                  Delete Collection
                </Button>
              )}
            </div>
            {/* Question Input */}
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
      </div>
    </AppLayout>
  );
};

export default Page;
