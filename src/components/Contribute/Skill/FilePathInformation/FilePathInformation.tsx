import React from 'react';
import PathService from '@/components/PathService/PathService';
import { FormFieldGroupExpandable, FormFieldGroupHeader, FormGroup } from '@patternfly/react-core';

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
          titleDescription="Specify the directory location within taxonomy repository structure for the QnA Yaml and Attribution files."
        />
      }
    >
      <FormGroup isRequired key={'file-path-service-id'}>
        <PathService reset={reset} rootPath="skills" path={path} handlePathChange={setFilePath} />
      </FormGroup>
    </FormFieldGroupExpandable>
  );
};

export default FilePathInformation;
