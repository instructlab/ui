// src/components/Contribute/Knowledge/UploadFile.tsx
'use client';
import * as React from 'react';
import {
  MultipleFileUpload,
  Modal,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader,
  Flex,
  FlexItem,
  MultipleFileUploadContext,
  Content,
  Spinner
} from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';
import { FileRejection } from 'react-dropzone';
import { KnowledgeFile } from '@/types';
import { useAlerts } from '@/context/AlertContext';
import MultiFileUploadArea from '@/components/Documents/MultFileUploadArea';
import { useFeatureFlags } from '@/context/FeatureFlagsContext';
import MarkdownFileViewer from '@/components/Documents/MarkdownFileViewer';
import UploadExternalDocumentModal from '@/components/Documents/UploadExternalDocumentModal';
import { convertFilesToMarkdown } from '@/components/Documents/fileConversionUtils';

const convertFileToKnowledgeFile = (file: File): Promise<KnowledgeFile> =>
  new Promise<KnowledgeFile>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve({ filename: file.name, content: e.target!.result as string });
    reader.onerror = reject;
    reader.readAsText(file);
  });

interface UploadFileProps {
  existingFiles: KnowledgeFile[];
  onUploaded: (newFiles: KnowledgeFile[]) => void;
}

const DocumentUploadArea: React.FunctionComponent<UploadFileProps> = ({ existingFiles, onUploaded }) => {
  const {
    featureFlags: { docConversionEnabled }
  } = useFeatureFlags();
  React.useContext(MultipleFileUploadContext);
  const { addAlert } = useAlerts();
  const [showUploadModal, setShowUploadModal] = React.useState<boolean>();
  const [showOverwriteModal, setShowOverwriteModal] = React.useState(false);
  const [filesToOverwrite, setFilesToOverwrite] = React.useState<File[]>([]);
  const [filesToConvert, setFilesToConvert] = React.useState<File[]>([]);
  const conversionCanceled = React.useRef<boolean>(false);
  const [droppedFiles, setDroppedFiles] = React.useState<File[]>([]);
  const [remoteUploadFile, setRemoteUploadFile] = React.useState<File | undefined>();
  const [viewedFile, setViewedFile] = React.useState<KnowledgeFile | undefined>();

  const supportedTypesText = docConversionEnabled ? 'PDF, DOCX, PPTX, XLSX, Images, HTML, AsciiDoc & Markdown.' : 'Markdown';

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

  const doUploadFiles = React.useCallback(
    async (files: File[]): Promise<void> => {
      const newUploads: KnowledgeFile[] = [];

      for (const file of files) {
        const knowledgeFile = await convertFileToKnowledgeFile(file);
        newUploads.push(knowledgeFile);
      }

      if (newUploads.length) {
        onUploaded(newUploads);
      }
    },
    [onUploaded]
  );

  const doConvertFiles = async (files: File[]) => {
    if (files.length) {
      setFilesToConvert(files);
      conversionCanceled.current = false;
      const convertedFiles = await convertFilesToMarkdown(files, () => conversionCanceled.current, onError);
      if (!conversionCanceled.current && convertedFiles.length) {
        await doUploadFiles(convertedFiles);
      }
      setFilesToConvert([]);
    }
  };

  const overwriteFiles = async () => {
    setShowOverwriteModal(false);
    if (remoteUploadFile) {
      await doUploadFiles([remoteUploadFile]);
      setRemoteUploadFile(undefined);
      return;
    }

    await doConvertFiles(droppedFiles);
    setDroppedFiles([]);
  };

  // Handle drop (and re-drop) of files
  const handleUploadFiles = (files: File[]) => {
    const duplicateFiles: File[] = [];
    files.map((file: File) => {
      if (existingFiles.find((existingFile: KnowledgeFile) => existingFile.filename === file.name)) {
        duplicateFiles.push(file);
      }
    });

    setDroppedFiles(files);

    if (duplicateFiles.length > 0) {
      setFilesToOverwrite(duplicateFiles);
      setShowOverwriteModal(true);
      return;
    }

    doConvertFiles(files);
  };

  const cancelConversion = () => {
    setFilesToConvert([]);
    conversionCanceled.current = true;
  };

  const cancelOverwrite = () => {
    setFilesToOverwrite([]);
    setDroppedFiles([]);
    setRemoteUploadFile(undefined);
    setShowOverwriteModal(false);
  };

  const onError = React.useCallback((errorMessage: string) => addAlert(errorMessage, 'danger'), [addAlert]);

  const handleDropRejected = (fileRejections: FileRejection[]) => {
    console.warn('Files were rejected:', fileRejections);
    addAlert(`Some files were rejected. Please ensure you are uploading files of the following types: ${supportedTypesText}`, 'danger');
  };

  const handleRemoteDownload = (file: File) => {
    setShowUploadModal(false);
    if (existingFiles.find((existingFile: KnowledgeFile) => existingFile.filename === file.name)) {
      setFilesToOverwrite([file]);
      setShowOverwriteModal(true);
      setRemoteUploadFile(file);
      return;
    }
    doUploadFiles([file]);
  };

  const getOverwriteWarningText = () => {
    if (filesToOverwrite.length > 1) {
      return (
        <>
          <Content component="p">The following files have already been uploaded:</Content>
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
        A file with the name <b>{filesToOverwrite[0].name}</b> has already been uploaded. Uploading the new file will overwrite the existing one.
      </Content>
    );
  };

  return (
    <>
      <MultipleFileUpload
        onFileDrop={(_ev, files) => handleUploadFiles(files)}
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
              manualUploadText="Upload an external document"
              onManualUpload={() => setShowUploadModal(true)}
            />
          </FlexItem>
        </Flex>
      </MultipleFileUpload>
      {viewedFile ? <MarkdownFileViewer markdownFile={viewedFile} handleCloseModal={() => setViewedFile(undefined)} /> : null}
      {showOverwriteModal ? (
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
      ) : null}
      {showUploadModal ? <UploadExternalDocumentModal onAddFile={handleRemoteDownload} onClose={() => setShowUploadModal(false)} /> : null}
      {filesToConvert.length ? (
        <Modal isOpen variant="small" aria-label="uploading" aria-labelledby="upload-modal-title" disableFocusTrap>
          <ModalHeader title={`Uploading file${filesToConvert.length > 1 ? 's' : ''}`} labelId="upload-modal-title" titleIconVariant="warning" />
          <ModalBody>
            <Flex alignItems={{ default: 'alignItemsCenter' }} justifyContent={{ default: 'justifyContentCenter' }} gap={{ default: 'gapMd' }}>
              <FlexItem>
                <Spinner size="lg" />
              </FlexItem>
              <FlexItem>{`The selected file${filesToConvert.length > 1 ? 's are' : ' is'} being uploaded and converted to Markdown.`}</FlexItem>
            </Flex>
          </ModalBody>
          <ModalFooter>
            <Button key="close" variant="secondary" onClick={() => cancelConversion()}>
              Cancel
            </Button>
          </ModalFooter>
        </Modal>
      ) : null}
    </>
  );
};

export default DocumentUploadArea;
