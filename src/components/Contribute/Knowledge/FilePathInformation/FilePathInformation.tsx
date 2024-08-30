import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import PathService from '@/components/PathService/PathService';

interface Props {
  setFilePath: React.Dispatch<React.SetStateAction<string>>;
}

const FilePathInformation: React.FC<Props> = ({ setFilePath }) => {
  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <p>
                File Path Info <span style={{ color: 'red' }}>*</span>
              </p>
            ),
            id: 'file-path-info-id'
          }}
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
