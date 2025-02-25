import React from 'react';
import PathService from '@/components/PathService/PathService';
import { Form, FormGroup, Flex, FlexItem, Content } from '@patternfly/react-core';

interface Props {
  path: string;
  setFilePath: (val: string) => void;
}

const FilePathInformation: React.FC<Props> = ({ path, setFilePath }) => {
  return (
    <Flex gap={{ default: 'gapMd' }} direction={{ default: 'column' }}>
      <FlexItem>
        <Content component="h4">File Path Information</Content>
        <Content component="p">
          Specify the file path for the QnA and Attribution files. Once path is selected, please add your leaf directory name for your contribution.
        </Content>
      </FlexItem>
      <FlexItem>
        <Form>
          <FormGroup label="File Path" isRequired>
            <PathService rootPath="knowledge" path={path} handlePathChange={setFilePath} />
          </FormGroup>
        </Form>
      </FlexItem>
    </Flex>
  );
};

export default FilePathInformation;
