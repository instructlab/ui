// src/components/Contribute/Knowledge/UploadFile.tsx
'use client';
import { HelperText, HelperTextItem, MultipleFileUpload, MultipleFileUploadMain, Spinner, MultipleFileUploadStatus, MultipleFileUploadStatusItem, Modal, Button, ModalBody, ModalFooter, ModalHeader, ModalVariant } from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';
import React, { useState, useEffect } from 'react';
import { FileRejection, DropEvent } from 'react-dropzone';
import './knowledge.css';

interface readFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

export const UploadFile: React.FunctionComponent<{ onFilesChange: (files: File[]) => void }> = ({ onFilesChange }) => {
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [readFileData, setReadFileData] = useState<readFile[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [statusIcon, setStatusIcon] = useState<'inProgress' | 'success' | 'danger'>('inProgress');
  const [modalText, setModalText] = useState('');

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

  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const newCurrentFiles = currentFiles.filter((file) => !namesOfFilesToRemove.includes(file.name));
    const newReadFiles = readFileData.filter((file) => !namesOfFilesToRemove.includes(file.fileName));
    setCurrentFiles(newCurrentFiles);
    setReadFileData(newReadFiles);
  };

  const handleFileDrop = (_event: DropEvent, droppedFiles: File[]) => {
    setIsUploading(true);
    const currentFileNames = currentFiles.map((file) => file.name);
    const reUploads = droppedFiles.filter((file) => currentFileNames.includes(file.name));

    const newFiles = [
      ...currentFiles.filter((file) => !reUploads.includes(file)),
      ...droppedFiles.filter((file) => !currentFileNames.includes(file.name))
    ];
    setCurrentFiles(newFiles);
    onFilesChange(newFiles);
  };

  const handleReadSuccess = (data: string, file: File) => {
    setReadFileData((prevReadFiles) => {
      const existingFile = prevReadFiles.find((readFile) => readFile.fileName === file.name);
      if (existingFile) {
        return prevReadFiles;
      }
      setIsUploading(false);
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

  const handleDropRejected = (fileRejections: FileRejection[]) => {
    console.warn('Files rejected:', fileRejections);
    if (fileRejections.length === 1) {
      setModalText(`${fileRejections[0].file.name} is not an accepted file type. Please upload a Markdown file.`);
    } else {
      const rejectedMessages = fileRejections.reduce((acc, fileRejection) => (acc += `${fileRejection.file.name}, `), '');
      setModalText(`${rejectedMessages} are not accepted file types. Please upload Markdown files.`);
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

  return (
    <div>
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: {
            'text/markdown': ['.md']
          },
          onDropRejected: handleDropRejected
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types: Markdown"
        />
        <div className="spinner-container">
          {isUploading && (
            <>
              <Spinner size="lg" />
              <p>
                Uploading files to <code>taxonomy-knowledge-docs</code> repo.
              </p>
            </>
          )}
        </div>
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
          variant={ModalVariant.small}
          title="Unsupported file"
          isOpen={!!modalText}
          onClose={() => setModalText('')}
          aria-labelledby="unsupported-file-modal-title"
          aria-describedby="unsupported-file-body-variant"
        >
          <ModalHeader title="Unsupported file" labelId="unsupported-file-modal-title" titleIconVariant="warning" />
          <ModalBody id="unsupported-file-body-variant">
            <p>
              <br />
              {modalText}
              <br />
            </p>

          </ModalBody>
          <ModalFooter >
            <Button key="close" variant="secondary" onClick={() => setModalText('')}>
              Close
            </Button>
          </ModalFooter>
        </Modal>

      </MultipleFileUpload>
    </div>
  );
};
