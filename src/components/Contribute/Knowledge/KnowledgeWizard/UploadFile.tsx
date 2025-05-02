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
import { KnowledgeFile } from '@/types';
import UploadFromGitModal from '@/components/Contribute/Knowledge/KnowledgeWizard/UploadFromGitModal';
import MultiFileUploadArea from '@/components/Contribute/Knowledge/KnowledgeWizard/MultFileUploadArea';
import FileConversionModal from '@/components/Contribute/Knowledge/KnowledgeWizard/FileConversionModal';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';

interface ReadFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

interface UploadFileProps {
  existingFiles: KnowledgeFile[];
  setExistingFiles: (val: KnowledgeFile[]) => void;
  filesToUpload: File[];
  setFilesToUpload: (val: File[]) => void;
}

export const UploadFile: React.FunctionComponent<UploadFileProps> = ({ existingFiles, setExistingFiles, filesToUpload, setFilesToUpload }) => {
  const {
    featureFlags: { docConversionEnabled }
  } = useFeatureFlags();
  const [showUploadFromGitModal, setShowUploadFromGitModal] = React.useState<boolean>();
  const [readFileData, setReadFileData] = useState<ReadFile[]>([]);
  const [showNewFilesStatus, setShowNewFilesStatus] = useState(false);
  const [showExistingFilesStatus, setExistingFilesStatus] = useState(false);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);
  const [showFileDeleteModal, setShowFileDeleteModal] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string[]>([]);
  const [filesToOverwrite, setFilesToOverwrite] = useState<File[]>([]);
  const [droppedFiles, setDroppedFiles] = React.useState<File[] | undefined>();
  const [statusIcon, setStatusIcon] = useState<'inProgress' | 'success' | 'danger'>('inProgress');
  const [modalText, setModalText] = useState('');
  React.useContext(MultipleFileUploadContext);

  useEffect(() => {
    if (filesToUpload.length > 0) {
      setShowNewFilesStatus(true);
    } else {
      setShowNewFilesStatus(false);
    }
    if (existingFiles.length > 0) {
      setExistingFilesStatus(true);
    } else {
      setExistingFilesStatus(false);
    }
  }, [existingFiles, filesToUpload]);

  useEffect(() => {
    if (readFileData.length < filesToUpload.length) {
      setStatusIcon('inProgress');
    } else if (readFileData.every((file) => file.loadResult === 'success')) {
      setStatusIcon('success');
    } else {
      setStatusIcon('danger');
    }
  }, [readFileData, filesToUpload]);

  const removeNewFiles = () => {
    const newCurrentFiles = filesToUpload.filter((file) => !fileToDelete.includes(file.name));
    const newReadFiles = readFileData.filter((file) => !fileToDelete.includes(file.fileName));
    setFilesToUpload(newCurrentFiles);
    setReadFileData(newReadFiles);
  };

  const handleFilesDeletion = (namesOfFilesToRemove: string[]) => {
    setShowFileDeleteModal(true);
    setFileToDelete(namesOfFilesToRemove);
  };

  const removeFiles = () => {
    fileToDelete.map((deletedFile: string) => {
      if (existingFiles.some((file: KnowledgeFile) => file.filename === deletedFile)) {
        removeExistingFiles();
      }

      if (filesToUpload.some((file: File) => file.name === deletedFile)) {
        removeNewFiles();
      }
    });
    setFileToDelete([]);
    setShowFileDeleteModal(false);
  };

  const removeExistingFiles = () => {
    const updatedExistingFiles = existingFiles.filter((file: KnowledgeFile) => !fileToDelete.includes(file.filename));
    setExistingFiles(updatedExistingFiles);
  };

  const keepFiles = () => {
    setFileToDelete([]);
    setShowFileDeleteModal(false);
  };

  // Define allowed file types. If doc conversion is not enabled, only allow markdown files.
  const allowedFileTypes: { [mime: string]: string[] } = docConversionEnabled
    ? {
        'application/pdf': ['.pdf'],
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
        'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
        'text/html': ['.html'],
        'text/asciidoc': ['.adoc'],
        'text/markdown': ['.md']
      }
    : { 'text/markdown': ['.md'] };

  // Handle drop (and re-drop) of files
  const handleFileDrop = (_event: DropEvent, files: File[]) => {
    setStatusIcon('inProgress');
    const overwriteFiles: File[] = [];
    files.map((file: File) => {
      if (existingFiles.some((existingFile: KnowledgeFile) => existingFile.filename == file.name)) {
        overwriteFiles.push(file);
      }
      if (filesToUpload.some((newFile: File) => newFile.name == file.name)) {
        overwriteFiles.push(file);
      }
    });

    if (overwriteFiles.length > 0) {
      setFilesToOverwrite(overwriteFiles);
      setShowOverwriteModal(true);
    }
    setDroppedFiles(files);
  };

  const overwriteFiles = () => {
    let existingFilesFiltered = [...existingFiles];
    let filesToUploadFiltered = [...filesToUpload];
    filesToOverwrite.map((file: File) => {
      // If file is already uploaded, remove from the existing files, because it will be uploaded again as a new file.
      existingFilesFiltered = existingFilesFiltered.filter((existingFile: KnowledgeFile) => existingFile.filename != file.name);
      filesToUploadFiltered = filesToUploadFiltered.filter((newFile: File) => newFile.name != file.name);
    });

    setExistingFiles(existingFilesFiltered);
    setFilesToUpload(filesToUploadFiltered);
    setFilesToOverwrite([]);
    setShowOverwriteModal(false);
  };

  const cancelOverwrite = () => {
    setFilesToOverwrite([]);
    setDroppedFiles([]);
    setShowOverwriteModal(false);
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

  const getOverwriteWarningText = () => {
    if (filesToOverwrite.length > 1) {
      return (
        <>
          <Content component="p">The following files have already been uploaded in this contribution:</Content>
          <Content component="p">
            <Content component="ul">
              {filesToOverwrite.map((file) => (
                <Content component="li" key={file.name}>
                  {file.name}
                </Content>
              ))}
            </Content>
          </Content>
          <Content component="p">Uploading the new files will overwrite the existing files.</Content>
        </>
      );
    }

    return (
      <Content component="p">
        A file with the name <b>{filesToOverwrite[0].name}</b> has already been uploaded in this contribution. Uploading the new file will overwrite
        the existing one.
      </Content>
    );
  };

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
                docConversionEnabled
                  ? 'Accepted file types include PDF, DOCX, PPTX, XLSX, HTML, AsciiDoc, Markdown, and images. All files will be converted to Markdown.'
                  : 'Accepted file type: Markdown'
              }
              uploadText="Upload from device"
              manualUploadText="Upload from git repository"
              onManualUpload={() => setShowUploadFromGitModal(true)}
            />
          </FlexItem>
          {showNewFilesStatus ? (
            <FlexItem>
              <MultipleFileUploadStatus
                statusToggleText={`Newly uploaded files : ${successfullyReadFileCount} of ${filesToUpload.length} files processed`}
                statusToggleIcon={statusIcon}
                aria-label="Current uploads"
              >
                {filesToUpload.map((file) => (
                  <MultipleFileUploadStatusItem
                    file={file}
                    key={file.name}
                    onClearClick={() => handleFilesDeletion([file.name])}
                    onReadSuccess={handleReadSuccess}
                    onReadFail={handleReadFail}
                    progressHelperText={createHelperText(file)}
                  />
                ))}
              </MultipleFileUploadStatus>
            </FlexItem>
          ) : null}
          {showExistingFilesStatus ? (
            <FlexItem>
              <MultipleFileUploadStatus statusToggleText={`Existing uploaded files`} statusToggleIcon={statusIcon} aria-label="Existing uploads">
                {existingFiles.map((file: KnowledgeFile) => {
                  const fileObject = new File([file.content], file.filename, { type: 'text/plain' });
                  return (
                    <MultipleFileUploadStatusItem
                      file={fileObject}
                      key={file.filename}
                      progressVariant="success"
                      onClearClick={() => handleFilesDeletion([file.filename])}
                    />
                  );
                })}
              </MultipleFileUploadStatus>
            </FlexItem>
          ) : null}
          {showFileDeleteModal && (
            <Modal
              isOpen
              title="Delete file"
              variant="small"
              aria-label="file deletion warning"
              aria-labelledby="file-deletion-warning-title"
              aria-describedby="file-deletion-warning-variant"
            >
              <ModalHeader title="File deletion" labelId="file-deletion-warning-title" titleIconVariant="warning" />
              <ModalBody id="file-deletion-warning-variant">
                <p>
                  Are you sure you want to delete the <strong>{fileToDelete}</strong> file?
                  <br />
                  <br />
                  <strong>Note: </strong>
                  Please make sure any of the selected contexts is not referenced from <strong>{fileToDelete}</strong>. InstructLab model training
                  might encounter unexpected results if the selected contexts are not present in the uploaded documents.
                </p>
              </ModalBody>
              <ModalFooter>
                <Button key="delete" variant="primary" onClick={removeFiles}>
                  Delete
                </Button>
                <Button key="keepit" variant="secondary" onClick={keepFiles}>
                  Keep It
                </Button>
              </ModalFooter>
            </Modal>
          )}
          {showOverwriteModal && (
            <Modal
              isOpen
              variant="small"
              aria-label="file overwrite warning"
              aria-labelledby="file-overwrite-warning-title"
              aria-describedby="file-overwrite-warning-variant"
            >
              <ModalHeader title="Overwrite file?" labelId="file-overwrite-warning-title" titleIconVariant="warning" />
              <ModalBody id="file-overwrite-warning-variant">{getOverwriteWarningText()}</ModalBody>
              <ModalFooter>
                <Button key="overwrite" variant="primary" onClick={overwriteFiles}>
                  Overwrite
                </Button>
                <Button key="cancel" variant="secondary" onClick={cancelOverwrite}>
                  Cancel
                </Button>
              </ModalFooter>
            </Modal>
          )}
        </Flex>
        {showUploadFromGitModal ? <UploadFromGitModal onAddFile={handleRemoteDownload} onClose={() => setShowUploadFromGitModal(false)} /> : null}
        {droppedFiles && filesToOverwrite.length == 0 ? (
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
