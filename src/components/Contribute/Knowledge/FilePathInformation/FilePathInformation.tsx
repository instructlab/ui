import React from 'react';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core/dist/dynamic/components/Form';
import PathService from '@/components/PathService/PathService';

interface Props {
  reset?: boolean;
  path: string;
  setFilePath: React.Dispatch<React.SetStateAction<string>>;
}

const FilePathInformation: React.FC<Props> = ({ reset, path, setFilePath }) => {
  return (
    <FormFieldGroupExpandable
      isExpanded
      toggleAriaLabel="Details"
      header={
        <FormFieldGroupHeader
          titleText={{
            text: (
              <p>
                Taxonomy Directory Path <span style={{ color: 'red' }}>*</span>
              </p>
            ),
            id: 'file-path-info-id'
          }}
          titleDescription="Specify the file path for the QnA and Attribution files. Once path is selected, please add your leaf directory name for your contribution."
        />
      }
    >
      <FormGroup isRequired key={'file-path-service-id'}>
        <PathService reset={reset} rootPath="knowledge" path={path} handlePathChange={setFilePath} />
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

export default FilePathInformation;
