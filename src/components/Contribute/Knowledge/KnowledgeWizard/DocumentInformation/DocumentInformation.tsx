// src/components/Contribute/Knowledge/Native/DocumentInformation/DocumentInformation.tsx
import React from 'react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { KnowledgeFile } from '@/types';
import { UploadFile } from '@/components/Contribute/Knowledge/KnowledgeWizard/UploadFile';
import WizardPageHeader from '@/components/Common/WizardPageHeader';
import XsExternalLinkAltIcon from '@/components/Common/XsExternalLinkAltIcon';

interface Props {
  existingFiles: KnowledgeFile[];
  setExistingFiles: (val: KnowledgeFile[]) => void;
  filesToUpload: File[];
  setFilesToUpload: (val: File[]) => void;
}

const DocumentInformation: React.FC<Props> = ({ existingFiles, setExistingFiles, filesToUpload, setFilesToUpload }) => {
  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <WizardPageHeader
          title="Upload documents"
          description={
            <>
              Upload resource documents to serve as the knowledge source for training your model. Accepted sources include textbooks, technical
              manuals, encyclopedias, journals, and websites.{' '}
              <Button
                variant="link"
                component="a"
                isInline
                href="https://docs.instructlab.ai/taxonomy/knowledge/#knowledge-yaml-examples"
                target="_blank"
                rel="noopener noreferrer"
                icon={<XsExternalLinkAltIcon />}
                iconPosition="end"
              >
                Learn about accepted sources
              </Button>
            </>
          }
        />
      </FlexItem>
      <FlexItem>
        <UploadFile
          existingFiles={existingFiles}
          setExistingFiles={setExistingFiles}
          filesToUpload={filesToUpload}
          setFilesToUpload={setFilesToUpload}
        />
      </FlexItem>
    </Flex>
  );
};

export default DocumentInformation;
