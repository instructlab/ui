// src/components/Contribute/Knowledge/UploadFile.tsx
'use client';
import React, { useState, useEffect } from 'react';
import {
  MultipleFileUploadStatusItem,
  MultipleFileUploadStatus,
  MultipleFileUpload,
  MultipleFileUploadMain
} from '@patternfly/react-core/dist/dynamic/components/MultipleFileUpload';
import { Modal } from '@patternfly/react-core/dist/dynamic/next/components/Modal';
import UploadIcon from '@patternfly/react-icons/dist/esm/icons/upload-icon';
import { ExclamationTriangleIcon } from '@patternfly/react-icons/dist/dynamic/icons/exclamation-triangle-icon';
import { FileRejection, DropEvent } from 'react-dropzone';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { HelperText, HelperTextItem } from '@patternfly/react-core/dist/dynamic/components/HelperText';

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
      setModalText(`${fileRejections[0].file.name} is not an accepted file type`);
    } else {
      const rejectedMessages = fileRejections.reduce((acc, fileRejection) => (acc += `${fileRejection.file.name}, `), '');
      setModalText(`${rejectedMessages} are not accepted file types`);
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
  console.log('Successfully read file count:', successfullyReadFileCount);
  console.log('Current files count:', currentFiles.length);

  return (
    <>
      <MultipleFileUpload
        onFileDrop={handleFileDrop}
        dropzoneProps={{
          accept: {
            'application/pdf': ['.pdf'],
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
          variant="small"
          aria-label="unsupported file upload attempted"
          onClose={() => setModalText('')}
        >
          <div>
            <ExclamationTriangleIcon /> {modalText}
          </div>
          <Button key="close" variant="primary" onClick={() => setModalText('')}>
            Close
          </Button>
        </Modal>
      </MultipleFileUpload>
    </>
  );
};
