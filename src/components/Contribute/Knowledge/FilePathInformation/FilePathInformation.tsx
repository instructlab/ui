import React from 'react';
import PathService from '@/components/PathService/PathService';
import { FormFieldGroupHeader, FormGroup } from '@patternfly/react-core';

interface Props {
  reset?: boolean;
  path: string;
  setFilePath: React.Dispatch<React.SetStateAction<string>>;
}

const FilePathInformation: React.FC<Props> = ({ reset, path, setFilePath }) => {
  return (
    <div>
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
      <FormGroup isRequired key={'file-path-service-id'}>
        <PathService reset={reset} rootPath="knowledge" path={path} handlePathChange={setFilePath} />
      </FormGroup>
    </div>
  );
};

export default FilePathInformation;
