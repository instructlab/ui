import React from 'react';
import PathService from '@/components/PathService/PathService';
import { FormGroup } from '@patternfly/react-core';

interface Props {
  reset?: boolean;
  path: string;
  setFilePath: React.Dispatch<React.SetStateAction<string>>;
}

const FilePathInformation: React.FC<Props> = ({ reset, path, setFilePath }) => {
  return (
    <>
      <h2>
        <strong>Taxonomy Directory Path</strong> <span style={{ color: 'red' }}>*</span>
      </h2>
      <p>Specify the directory location within taxonomy repository structure for the QnA Yaml and Attribution files.</p>

      <FormGroup isRequired key={'file-path-service-id'}>
        <PathService reset={reset} rootPath="skills" path={path} handlePathChange={setFilePath} />
      </FormGroup>
    </>
  );
};

export default FilePathInformation;
