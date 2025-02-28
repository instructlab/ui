import React from 'react';
import PathService from '@/components/PathService/PathService';
import { Form, FormGroup, Flex, FlexItem } from '@patternfly/react-core';
import PageHeader from '@/components/Contribute/PageHeader';

interface Props {
  rootPath: string;
  path: string;
  setFilePath: (val: string) => void;
}

const FilePathInformation: React.FC<Props> = ({ rootPath, path, setFilePath }) => {
  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <PageHeader
          title="File Path Information"
          description="Specify the file path for the QnA and Attribution files. Once path is selected, please add your leaf directory name for your contribution."
        />
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup label="File Path" isRequired>
            <PathService rootPath={rootPath} path={path} handlePathChange={setFilePath} />
          </FormGroup>
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default FilePathInformation;
