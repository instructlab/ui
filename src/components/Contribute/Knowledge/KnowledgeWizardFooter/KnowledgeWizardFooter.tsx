import React from 'react';
import {
  ActionList,
  ActionListGroup,
  ActionListItem,
  Button,
  ButtonVariant,
  Flex,
  FlexItem,
  useWizardContext,
  WizardFooterWrapper
} from '@patternfly/react-core';
import { ArrowRightIcon } from '@patternfly/react-icons';
import ViewDropdownButton from '@/components/Contribute/Knowledge/ViewDropdown/ViewDropdownButton';
import { KnowledgeFormData, KnowledgeYamlData } from '@/types';
import { KnowledgeSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';

interface KnowledgeWizardFooterProps {
  isValid: boolean;
  knowledgeFormData: KnowledgeFormData;
  isGithubMode: boolean;
  showSubmit: boolean;
  isEdit: boolean;
  onSubmit: () => Promise<boolean>;
  onCancel: () => void;
}

const KnowledgeWizardFooter: React.FC<KnowledgeWizardFooterProps> = ({ isValid, knowledgeFormData, isGithubMode, showSubmit, onSubmit, isEdit }) => {
  const { steps, activeStep, goToNextStep, goToPrevStep, goToStepByIndex, close } = useWizardContext();

  const prevDisabled = steps.indexOf(activeStep) < 1;
  const isLast = steps.indexOf(activeStep) === steps.length - 1;

  const handleSubmit = async () => {
    const result = await onSubmit();
    if (result) {
      goToStepByIndex(0);
    }
  };

  const handleDownloadYaml = () => {
    const yamlData: KnowledgeYamlData = {
      created_by: knowledgeFormData.email!,
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
    <WizardFooterWrapper>
      <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }} gap={{ default: 'gapMd' }}>
        <FlexItem>
          <ActionList>
            <ActionListGroup>
              <ActionListItem>
                <Button variant={ButtonVariant.secondary} onClick={goToPrevStep} isDisabled={prevDisabled}>
                  Back
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button
                  variant={showSubmit ? ButtonVariant.secondary : ButtonVariant.primary}
                  onClick={isLast ? onSubmit : goToNextStep}
                  isDisabled={isLast || !isValid}
                >
                  Next
                </Button>
              </ActionListItem>
              {showSubmit ? (
                <ActionListItem>
                  <Button variant={ButtonVariant.primary} type="submit" onClick={handleSubmit}>
                    <Flex gap={{ default: 'gapXs' }}>
                      <FlexItem>{isEdit ? 'Update' : 'Submit'}</FlexItem>
                      <FlexItem>
                        <ArrowRightIcon />
                      </FlexItem>
                    </Flex>
                  </Button>
                </ActionListItem>
              ) : null}
            </ActionListGroup>
            <ActionListGroup>
              <ActionListItem>
                <Button variant={ButtonVariant.link} onClick={close}>
                  Cancel
                </Button>
              </ActionListItem>
            </ActionListGroup>
          </ActionList>
        </FlexItem>
        <FlexItem>
          <ActionList>
            <ActionListItem>
              <ViewDropdownButton knowledgeFormData={knowledgeFormData} isGithubMode={isGithubMode} onSave={handleDownloadYaml} />
            </ActionListItem>
          </ActionList>
        </FlexItem>
      </Flex>
    </WizardFooterWrapper>
  );
};

export default KnowledgeWizardFooter;
