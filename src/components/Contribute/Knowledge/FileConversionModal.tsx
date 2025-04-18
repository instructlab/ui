// src/components/Contribute/Knowledge/FileConversionModal.tsx
import * as React from 'react';
import { Spinner, Modal, Button, ModalBody, ModalFooter, ModalHeader, Flex, FlexItem, MultipleFileUploadContext } from '@patternfly/react-core';

interface Props {
  filesToConvert: File[];
  currentFiles: File[];
  onConverted: (mdFiles: File[]) => void;
  onCancel: () => void;
  onError: (errorMessage: string) => void;
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
    const res = await fetch('/api/convert', {
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
        throw new Error('The file conversion service is offline. Only Markdown file type can be accepted until service is restored.');
      }
      console.error(`Conversion service responded with status ${res.status}`);
      throw new Error(`Could not convert file: ${file.name}. Service error: ${res.statusText}`);
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
    }
    console.error('Unknown conversion error:', error);
    throw new Error('An unknown error occurred during file conversion.');
  }
};

export const FileConversionModal: React.FunctionComponent<Props> = ({ filesToConvert, currentFiles, onConverted, onCancel, onError }) => {
  const [isUploading, setIsUploading] = React.useState(true);
  React.useContext(MultipleFileUploadContext);

  React.useEffect(() => {
    let canceled = false;

    if (filesToConvert && isUploading) {
      const doUpload = async () => {
        const currentFileNames = currentFiles.map((file) => file.name);
        const reUploads = filesToConvert.filter((file) => currentFileNames.includes(file.name));

        // Keep existing files that are not about to be re-uploaded
        const newFilesArr = currentFiles.filter((file) => !reUploads.includes(file));

        // Convert new or replaced files to .md if needed
        for (const f of filesToConvert) {
          if (currentFileNames.includes(f.name)) {
            // user re-uploaded the same file name
            // remove the old one, before converting the new one
            const index = newFilesArr.findIndex((ef) => ef.name === f.name);
            if (index !== -1) {
              newFilesArr.splice(index, 1);
            }
          }

          try {
            const convertedFile = await convertToMarkdownIfNeeded(f);

            // Exit out if user canceled
            if (canceled) {
              return;
            }
            newFilesArr.push(convertedFile);
          } catch (err) {
            if (err instanceof Error) {
              console.error('File conversion failed for:', f.name, err);
              onError(`Could not convert file: ${f.name}. ${err.message}`);
            } else {
              console.error('File conversion failed for:', f.name, err);
              onError(`Could not convert file: ${f.name}. An unknown error occurred.`);
            }
          }
        }

        // Update states
        onConverted(newFilesArr);
      };

      doUpload();
    }
    return () => {
      canceled = true;
    };
  }, [currentFiles, filesToConvert, isUploading, onConverted, onError]);

  return (
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
        <Button
          key="close"
          variant="secondary"
          onClick={() => {
            setIsUploading(false);
            onCancel();
          }}
        >
          Cancel
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default FileConversionModal;
