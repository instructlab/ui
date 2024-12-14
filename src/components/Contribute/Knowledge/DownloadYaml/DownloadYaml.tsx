import React from 'react';
import { KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { Icon } from '@patternfly/react-core/dist/dynamic/components/Icon';
import { DropdownItem } from '@patternfly/react-core/dist/esm/components/Dropdown/DropdownItem';
import CodeIcon from '@patternfly/react-icons/dist/esm/icons/code-icon';

interface Props {
  knowledgeFormData: KnowledgeFormData;
  githubUsername: string | undefined;
}

const DownloadYaml: React.FC<Props> = ({ knowledgeFormData, githubUsername }) => {
  const handleDownloadYaml = () => {
    const yamlData: KnowledgeYamlData = {
      created_by: githubUsername!,
      version: KnowledgeSchemaVersion,
      domain: knowledgeFormData.domain!,
      document_outline: knowledgeFormData.documentOutline!,
      seed_examples: knowledgeFormData.seedExamples.map((example) => ({
        context: example.context,
        questions_and_answers: example.questionAndAnswers.map((qa) => ({
          question: qa.question,
          answer: qa.answer
        }))
      })),
      document: {
        repo: knowledgeFormData.knowledgeDocumentRepositoryUrl!,
        commit: knowledgeFormData.knowledgeDocumentCommit!,
        patterns: knowledgeFormData.documentName!.split(',').map((pattern) => pattern.trim())
      }
    };

    const yamlString = dumpYaml(yamlData);
    const blob = new Blob([yamlString], { type: 'application/x-yaml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'knowledge.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  return (
    <DropdownItem
      key="Download Yaml"
      to="#default-link6"
      onClick={handleDownloadYaml}
      icon={
        <Icon>
          <CodeIcon />
        </Icon>
      }
    >
      {' '}
      YAML File
    </DropdownItem>
  );
};

export default DownloadYaml;
