// src/components/Contribute/Knowledge/UploadFile.tsx
'use client';
import {
  HelperText,
  HelperTextItem,
  MultipleFileUpload,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
  Modal,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Flex,
  FlexItem,
  MultipleFileUploadContext,
  Content
} from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';
import React, { useState, useEffect } from 'react';
import { FileRejection, DropEvent } from 'react-dropzone';
import UploadFromGitModal from '@/components/Contribute/Knowledge/UploadFromGitModal';
import MultiFileUploadArea from '@/components/Contribute/Knowledge/MultFileUploadArea';
import FileConversionModal from '@/components/Contribute/Knowledge/FileConversionModal';

interface ReadFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

interface UploadFileProps {
  filesToUpload: File[];
  setFilesToUpload: (val: File[]) => void;
}

export const UploadFile: React.FunctionComponent<UploadFileProps> = ({ filesToUpload, setFilesToUpload }) => {
  const [showUploadFromGitModal, setShowUploadFromGitModal] = React.useState<boolean>();
  const [readFileData, setReadFileData] = useState<ReadFile[]>([]);
  const [showStatus, setShowStatus] = useState(false);
  const [droppedFiles, setDroppedFiles] = React.useState<File[] | undefined>();
  const [statusIcon, setStatusIcon] = useState<'inProgress' | 'success' | 'danger'>('inProgress');
  const [modalText, setModalText] = useState('');
  React.useContext(MultipleFileUploadContext);

  useEffect(() => {
    if (filesToUpload.length > 0) {
      setShowStatus(true);
    } else {
      setShowStatus(false);
    }
  }, [filesToUpload]);

  useEffect(() => {
    if (readFileData.length < filesToUpload.length) {
      setStatusIcon('inProgress');
    } else if (readFileData.every((file) => file.loadResult === 'success')) {
      setStatusIcon('success');
    } else {
      setStatusIcon('danger');
    }
  }, [readFileData, filesToUpload]);

  const removeFiles = (namesOfFilesToRemove: string[]) => {
    const newCurrentFiles = filesToUpload.filter((file) => !namesOfFilesToRemove.includes(file.name));
    const newReadFiles = readFileData.filter((file) => !namesOfFilesToRemove.includes(file.fileName));
    setFilesToUpload(newCurrentFiles);
    setReadFileData(newReadFiles);
  };

  // Define allowed file types
  const allowedFileTypes: { [mime: string]: string[] } = {
    'application/pdf': ['.pdf'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
    'text/html': ['.html'],
    'text/asciidoc': ['.adoc'],
    'text/markdown': ['.md']
  };

  // Handle drop (and re-drop) of files
  const handleFileDrop = (_event: DropEvent, files: File[]) => {
    setStatusIcon('inProgress');
    setDroppedFiles(files);
  };

  const onFilesConverted = (convertedFiles: File[]) => {
    setFilesToUpload(convertedFiles);
    setDroppedFiles(undefined);
  };

  const onConversionCanceled = () => {
    setDroppedFiles(undefined);
  };

  const handleReadSuccess = (data: string, file: File) => {
    setReadFileData((prev) => {
      // If we have an existing entry for that file, skip
      if (prev.find((readFile) => readFile.fileName === file.name)) {
        return prev;
      }
      return [...prev, { data, fileName: file.name, loadResult: 'success' }];
    });
  };

  const handleReadFail = (error: DOMException, file: File) => {
    setReadFileData((prev) => {
      // If we have an existing entry for that file, skip
      if (prev.find((readFile) => readFile.fileName === file.name)) {
        return prev;
      }
      return [...prev, { loadError: error, fileName: file.name, loadResult: 'danger' }];
    });
  };

  const handleDropRejected = (fileRejections: FileRejection[]) => {
    console.warn('Files were rejected:', fileRejections);
    setModalText(
      'Some files were rejected. Please ensure you are uploading files with the following extensions: PDF, DOCX, PPTX, XLSX, Images, HTML, AsciiDoc & Markdown.'
    );
  };

  const handleRemoteDownload = (file: File) => {
    const newFilesArr = [...filesToUpload.filter((f) => f.name !== file.name), file];
    setFilesToUpload(newFilesArr);

    setShowUploadFromGitModal(false);
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
          accept: allowedFileTypes,
          onDropRejected: handleDropRejected
        }}
        isHorizontal
      >
        <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <MultiFileUploadArea
              titleIcon={<UploadIcon />}
              titleText="Drag and drop files here or upload"
              infoText={
                <>
                  <Content>Accepted file types: PDF, DOCX, PPTX, XLSX, Images, HTML, AsciiDoc & Markdown.</Content>
                  <Content>Non-Markdown files will be automatically converted to Markdown for context selection.</Content>
                </>
              }
              uploadText="Upload from device"
              manualUploadText="Upload from git repository"
              onManualUpload={() => setShowUploadFromGitModal(true)}
            />
          </FlexItem>
          {showStatus ? (
            <FlexItem>
              <MultipleFileUploadStatus
                statusToggleText={`${successfullyReadFileCount} of ${filesToUpload.length} files processed`}
                statusToggleIcon={statusIcon}
                aria-label="Current uploads"
              >
                {filesToUpload.map((file) => (
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
            </FlexItem>
          ) : null}
        </Flex>
        {showUploadFromGitModal ? <UploadFromGitModal onAddFile={handleRemoteDownload} onClose={() => setShowUploadFromGitModal(false)} /> : null}
        {droppedFiles ? (
          <FileConversionModal
            filesToConvert={droppedFiles}
            currentFiles={filesToUpload}
            onConverted={onFilesConverted}
            onCancel={onConversionCanceled}
            onError={setModalText}
          />
        ) : null}
        {modalText ? (
          <Modal
            isOpen
            title="File Conversion Issue"
            variant="small"
            aria-label="file conversion error"
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
            <ModalFooter>
              <Button key="close" variant="secondary" onClick={() => setModalText('')}>
                Close
              </Button>
            </ModalFooter>
          </Modal>
        ) : null}
      </MultipleFileUpload>
    </div>
  );
};
