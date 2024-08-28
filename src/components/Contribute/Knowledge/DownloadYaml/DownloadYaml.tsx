import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { validateFields } from '../validation';
import { ActionGroupAlertContent, KnowledgeFormData } from '..';
import { KnowledgeYamlData, SchemaVersion } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';

interface Props {
  disableAction: boolean;
  knowledgeFormData: KnowledgeFormData;
  setActionGroupAlertContent: React.Dispatch<React.SetStateAction<ActionGroupAlertContent | undefined>>;
  githubUsername: string | undefined;
}

const DownloadYaml: React.FC<Props> = ({ disableAction, knowledgeFormData, setActionGroupAlertContent, githubUsername }) => {
  const handleDownloadYaml = () => {
    if (!validateFields(knowledgeFormData, setActionGroupAlertContent)) return;

    const yamlData: KnowledgeYamlData = {
      created_by: githubUsername!,
      version: SchemaVersion,
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
    <Button variant="primary" type="button" isDisabled={disableAction} onClick={handleDownloadYaml}>
      Download YAML
    </Button>
  );
};

export default DownloadYaml;
