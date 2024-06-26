// src/components/Contribute/Knowledge/UploadFile.tsx
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
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';

interface ReadFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

interface UploadFileProps {
  onFilesChange: (files: File[]) => void;
  files: File[];
  isConverting: boolean;
  conversionMessage: string;
}

export const UploadFile: React.FunctionComponent<UploadFileProps> = ({ onFilesChange, files, isConverting, conversionMessage }) => {
  // State hooks for managing file upload state and modal state
  const [currentFiles, setCurrentFiles] = useState<File[]>(files || []);
  const [readFileData, setReadFileData] = useState<ReadFile[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [statusIcon, setStatusIcon] = useState<'inProgress' | 'success' | 'danger'>('inProgress');
  const [modalText, setModalText] = useState('');

  // Effect hook to show or hide the upload status based on current files
  useEffect(() => {
    if (currentFiles.length > 0) {
      setShowStatus(true);
    } else {
      setShowStatus(false);
    }
  }, [currentFiles]);

  // Effect hook to update the status icon based on the read file results
  useEffect(() => {
    if (readFileData.length < currentFiles.length) {
      setStatusIcon('inProgress');
    } else if (readFileData.every((file) => file.loadResult === 'success')) {
      setStatusIcon('success');
    } else {
      setStatusIcon('danger');
    }
  }, [readFileData, currentFiles]);

  // Effect hook to trigger the onFilesChange callback when current files are updated
  useEffect(() => {
    console.log('Current files updated:', currentFiles);
    onFilesChange(currentFiles);
  }, [currentFiles, onFilesChange]);

  // Effect hook to set current files from props
  useEffect(() => {
    setCurrentFiles(files);
  }, [files]);

  // Function to remove files from the current file list
  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const newCurrentFiles = currentFiles.filter((file) => !namesOfFilesToRemove.includes(file.name));
    const newReadFiles = readFileData.filter((file) => !namesOfFilesToRemove.includes(file.fileName));
    setCurrentFiles(newCurrentFiles);
    setReadFileData(newReadFiles);
  };

  // Function to create helper text for file upload status
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
        // Handle file drop event
        onFileDrop={(event, droppedFiles) => {
          const newFiles = droppedFiles.reduce(
            (acc, file) => {
              const index = acc.findIndex((f) => f.name === file.name);
              if (index !== -1) {
                acc[index] = file; // Overwrite existing file
              } else {
                acc.push(file);
              }
              return acc;
            },
            [...currentFiles]
          );

          setCurrentFiles(newFiles);
          console.log('Files after drop:', newFiles);
        }}
        dropzoneProps={{
          accept: {
            'application/pdf': ['.pdf'],
            'text/markdown': ['.md']
          },
          // Handle file rejection
          onDropRejected: (fileRejections) => {
            console.warn('Files rejected:', fileRejections);
            if (fileRejections.length === 1) {
              setModalText(`${fileRejections[0].file.name} is not an accepted file type`);
            } else {
              const rejectedMessages = fileRejections.reduce((acc, fileRejection) => (acc += `${fileRejection.file.name}, `), '');
              setModalText(`${rejectedMessages} are not accepted file types`);
            }
          }
        }}
      >
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here"
          titleTextSeparator="or"
          infoText="Accepted file types are PDF and Markdown. PDF files will be converted to Markdown via a backend service. All documents will be automatically stored in a fork in the user's GitHub account."
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
                onReadSuccess={(data, file) => {
                  setReadFileData((prevReadFiles) => {
                    const existingFile = prevReadFiles.find((readFile) => readFile.fileName === file.name);
                    if (existingFile) {
                      return prevReadFiles;
                    }
                    return [...prevReadFiles, { data, fileName: file.name, loadResult: 'success' }];
                  });
                }}
                onReadFail={(error, file) => {
                  setReadFileData((prevReadFiles) => {
                    const existingFile = prevReadFiles.find((readFile) => readFile.fileName === file.name);
                    if (existingFile) {
                      return prevReadFiles;
                    }
                    return [...prevReadFiles, { loadError: error, fileName: file.name, loadResult: 'danger' }];
                  });
                }}
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
      {isConverting && (
        <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
          <Spinner size="md" />
          <span style={{ marginLeft: '10px' }}>{conversionMessage}</span>
        </div>
      )}
    </>
  );
};
