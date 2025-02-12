// src/components/Contribute/Knowledge/UploadFile.tsx
'use client';
import {
  HelperText,
  HelperTextItem,
  MultipleFileUpload,
  MultipleFileUploadMain,
  Spinner,
  MultipleFileUploadStatus,
  MultipleFileUploadStatusItem,
  Modal,
  Button,
  ModalBody,
  ModalFooter,
  ModalHeader
} from '@patternfly/react-core';
import { UploadIcon } from '@patternfly/react-icons';
import React, { useState, useEffect } from 'react';
import { FileRejection, DropEvent } from 'react-dropzone';
import './knowledge.css';

interface ReadFile {
  fileName: string;
  data?: string;
  loadResult?: 'danger' | 'success';
  loadError?: DOMException;
}

interface UploadFileProps {
  onFilesChange: (files: File[]) => void;
}

// Helper function to convert ArrayBuffer to Base64
const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export const UploadFile: React.FunctionComponent<UploadFileProps> = ({ onFilesChange }) => {
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [readFileData, setReadFileData] = useState<ReadFile[]>([]);
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
    onFilesChange(newCurrentFiles); // Also update parent
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

  // Convert any file => .md if needed
  const convertToMarkdownIfNeeded = async (file: File): Promise<File> => {
    // If user picked a .md file, no need to call the conversion route
    if (file.name.toLowerCase().endsWith('.md')) {
      return file;
    }

    // 1) Read file as ArrayBuffer
    const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          reject(new Error('Unexpected result type when reading file as ArrayBuffer.'));
        }
      };
      reader.onerror = () => {
        reject(new Error('File reading failed.'));
      };
      reader.readAsArrayBuffer(file);
    });

    // Convert ArrayBuffer to Base64
    const base64String = arrayBufferToBase64(arrayBuffer);

    // 2) Attempt conversion call
    try {
      const res = await fetch('/api/native/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          options: {
            from_formats: ['docx', 'pptx', 'html', 'image', 'pdf', 'asciidoc', 'md', 'xlsx'],
            to_formats: ['md'],
            image_export_mode: 'placeholder',
            table_mode: 'fast',
            abort_on_error: false,
            return_as_file: false,
            do_table_structure: true,
            include_images: false
          },
          file_sources: [
            {
              base64_string: base64String,
              filename: file.name
            }
          ]
        })
      });

      if (!res.ok) {
        // Check if it's a 503 => offline service
        if (res.status === 503) {
          console.error('Conversion service offline, only .md files accepted');
          setModalText('The file conversion service is offline. Only Markdown file type can be accepted until service is restored.');
        } else {
          console.error(`Conversion service responded with status ${res.status}`);
          setModalText(`Could not convert file: ${file.name}. Service error: ${res.statusText}`);
        }
        throw new Error(`Conversion service responded with non-OK: ${res.status}`);
      }

      // 3) We expect JSON-wrapped markdown => { content: "..." }
      const data = await res.json();
      const mdContent = data.content.document.md_content;

      // 4) Create a new `.md` File object
      const newName = file.name.replace(/\.[^/.]+$/, '') + '.md';
      const mdBlob = new Blob([mdContent], { type: 'text/markdown' });
      const mdFile = new File([mdBlob], newName, { type: 'text/markdown' });
      return mdFile;
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Conversion error:', error);
        // If conversion fails, we let the UI know
        throw error;
      } else {
        console.error('Unknown conversion error:', error);
        throw new Error('An unknown error occurred during file conversion.');
      }
    }
  };

  // Handle drop (and re-drop) of files
  const handleFileDrop = async (_event: DropEvent, droppedFiles: File[]) => {
    setIsUploading(true);
    setStatusIcon('inProgress');

    const currentFileNames = currentFiles.map((file) => file.name);
    const reUploads = droppedFiles.filter((file) => currentFileNames.includes(file.name));

    // Keep existing files that are not about to be re-uploaded
    const newFilesArr = currentFiles.filter((file) => !reUploads.includes(file));

    // Convert new or replaced files to .md if needed
    for (const f of droppedFiles) {
      if (!currentFileNames.includes(f.name)) {
        try {
          const convertedFile = await convertToMarkdownIfNeeded(f);
          newFilesArr.push(convertedFile);
        } catch (err) {
          if (err instanceof Error) {
            console.error('File conversion failed for:', f.name, err);
            setModalText(`Could not convert file: ${f.name}. ${err.message}`);
          } else {
            console.error('File conversion failed for:', f.name, err);
            setModalText(`Could not convert file: ${f.name}. An unknown error occurred.`);
          }
        }
      } else {
        // user re-uploaded the same file name
        // remove the old one, and try to convert the new one
        const index = newFilesArr.findIndex((ef) => ef.name === f.name);
        if (index !== -1) {
          newFilesArr.splice(index, 1);
        }
        try {
          const convertedFile = await convertToMarkdownIfNeeded(f);
          newFilesArr.push(convertedFile);
        } catch (err) {
          console.error('Re-upload conversion failed for file:', f.name, err);
          setModalText(`Could not convert file: ${f.name}. Check console for details, or try again later.`);
        }
      }
    }

    // Update states
    setCurrentFiles(newFilesArr);
    onFilesChange(newFilesArr);
    setIsUploading(false);
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
        <MultipleFileUploadMain
          titleIcon={<UploadIcon />}
          titleText="Drag and drop files here or use upload button."
          infoText={
            <>
              Accepted file types: PDF, DOCX, PPTX, XLSX, Images, HTML, AsciiDoc & Markdown. <br />
              <strong>Non-Markdown files will be automatically converted to Markdown for context selection.</strong>
            </>
          }
        />
        <div className="spinner-container">
          {isUploading && (
            <>
              <Spinner size="lg" />
              <p>Uploading and converting files to Markdown file format…</p>
            </>
          )}
        </div>
        {showStatus && (
          <MultipleFileUploadStatus
            statusToggleText={`${successfullyReadFileCount} of ${currentFiles.length} files processed`}
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
      </MultipleFileUpload>
    </div>
  );
};
