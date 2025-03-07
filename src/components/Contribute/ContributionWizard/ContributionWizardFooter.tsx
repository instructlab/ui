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
import ViewDropdownButton from '@/components/Contribute/ContributionWizard/ViewDropdownButton';
import { ContributionFormData } from '@/types';

interface Props {
  isValid: boolean;
  formData: ContributionFormData;
  isGithubMode: boolean;
  isSkillContribution: boolean;
  showSubmit: boolean;
  isEdit: boolean;
  onSubmit: () => Promise<boolean>;
  convertToYaml: (formData: ContributionFormData) => unknown;
  onCancel: () => void;
}

const ContributionWizardFooter: React.FC<Props> = ({
  isValid,
  formData,
  isGithubMode,
  isSkillContribution,
  showSubmit,
  onSubmit,
  convertToYaml,
  isEdit
}) => {
  const { steps, activeStep, goToNextStep, goToPrevStep, goToStepByIndex, close } = useWizardContext();

  const prevDisabled = steps.indexOf(activeStep) < 1;
  const isLast = steps.indexOf(activeStep) === steps.length - 1;

  const handleSubmit = async () => {
    const result = await onSubmit();
    if (result) {
      goToStepByIndex(0);
    }
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
              {!isLast || !showSubmit ? (
                <ActionListItem>
                  <Button variant={showSubmit ? ButtonVariant.secondary : ButtonVariant.primary} onClick={goToNextStep} isDisabled={isLast}>
                    Next
                  </Button>
                </ActionListItem>
              ) : null}
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
              <ViewDropdownButton
                formData={formData}
                isGithubMode={isGithubMode}
                isSkillContribution={isSkillContribution}
                convertToYaml={convertToYaml}
              />
            </ActionListItem>
          </ActionList>
        </FlexItem>
      </Flex>
    </WizardFooterWrapper>
  );
};

export default ContributionWizardFooter;
