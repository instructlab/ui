import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import PathService from '@/components/PathService/PathService';

interface Props {
  setFilePath: React.Dispatch<React.SetStateAction<string | undefined>>;
}

const FilePathInformation: React.FC<Props> = ({ setFilePath }) => {
  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{ text: 'File Path Info', id: 'file-path-info-id' }}
          titleDescription="Specify the file path for the QnA and Attribution files."
        />
      }
    >
      <FormGroup isRequired key={'file-path-service-id'}>
        <PathService rootPath="knowledge" handlePathChange={setFilePath} />
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

export default FilePathInformation;
