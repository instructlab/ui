// src/components/Contribute/Skill/Edit/SkillForm.tsx
'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import {
  ValidatedOptions,
  Button,
  PageSection,
  Flex,
  FlexItem,
  Divider,
  ActionList,
  ActionListGroup,
  ActionListItem,
  ButtonVariant,
  PageGroup
} from '@patternfly/react-core';
import { SkillEditFormData, SkillFormData } from '@/types';
import SkillContributionSidePanelHelp from '@/components/SidePanelContents/SkillContributionSidePanelHelp';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import ContributePageHeader from '@/components/Contribute/ContributePageHeader';
import { deleteDraftData, formDataChanged, isDraftDataExist, storeDraftData } from '@/components/Contribute/Utils/autoSaveUtils';
import { getDefaultSkillFormData } from '@/components/Contribute/Utils/contributionUtils';
import { submitSkillData } from '@/components/Contribute/Utils/submitUtils';
import { isSkillSeedExamplesValid, isDetailsValid } from '@/components/Contribute/Utils/validationUtils';
import DetailsPage from '@/components/Contribute/DetailsPage/DetailsPage';
import SkillFormActions from '@/components/Contribute/Skill/SkillFormActions';
import SkillSeedExamples from '@/components/Contribute/Skill/Edit/SkillSeedExamples/SkillSeedExamples';

import './skills.css';

export interface Props {
  skillEditFormData?: SkillEditFormData;
  draftData?: SkillFormData;
}

export const SkillForm: React.FunctionComponent<Props> = ({ skillEditFormData, draftData }) => {
  const router = useRouter();
  const currentData: SkillFormData | undefined = draftData || skillEditFormData?.formData;
  const [skillFormData, setSkillFormData] = React.useState<SkillFormData>(
    currentData
      ? {
          ...currentData,
          seedExamples: currentData.seedExamples.map((example) => ({
            ...example,
            immutable: example.immutable !== undefined ? example.immutable : true, // Ensure immutable is set
            isContextValid: example.isContextValid || ValidatedOptions.default,
            validationError: example.validationError || '',
            questionAndAnswer: {
              ...example.questionAndAnswer,
              immutable: example.questionAndAnswer.immutable !== undefined ? example.questionAndAnswer.immutable : true, // Ensure immutable is set
              isQuestionValid: example.questionAndAnswer.isQuestionValid || ValidatedOptions.default,
              questionValidationError: example.questionAndAnswer.questionValidationError || '',
              isAnswerValid: example.questionAndAnswer.isAnswerValid || ValidatedOptions.default,
              answerValidationError: example.questionAndAnswer.answerValidationError || ''
            }
          }))
        }
      : getDefaultSkillFormData()
  );
  const lastUpdateRef = React.useRef<string>(JSON.stringify(skillFormData));
  const [actionGroupAlertContent, setActionGroupAlertContent] = React.useState<ActionGroupAlertContent | undefined>();

  const isValid = isDetailsValid(skillFormData) && isSkillSeedExamplesValid(skillFormData);

  React.useEffect(() => {
    if (isDraftDataExist(skillFormData.branchName) && !formDataChanged(skillFormData, skillEditFormData?.formData)) {
      deleteDraftData(skillFormData.branchName);
      lastUpdateRef.current = JSON.stringify(skillFormData);
      return;
    }

    if (formDataChanged(skillFormData, JSON.parse(lastUpdateRef.current))) {
      const draftContributionStr = JSON.stringify(skillFormData);
      lastUpdateRef.current = draftContributionStr;

      storeDraftData(skillFormData.branchName, skillFormData.filePath, draftContributionStr, skillEditFormData?.oldFilesPath || '');
    }
  }, [skillEditFormData?.formData, skillEditFormData?.isSubmitted, skillEditFormData?.oldFilesPath, skillFormData]);

  const updateActionGroupAlertContent = (newContent: ActionGroupAlertContent | undefined) => {
    // In order to restart the timer, we must re-create the Alert not re-use it. Clear it for one round then set the new info
    setActionGroupAlertContent(undefined);
    if (newContent) {
      requestAnimationFrame(() => setActionGroupAlertContent(newContent));
    }
  };

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const setFilePath = React.useCallback((filePath: string) => setSkillFormData((prev) => ({ ...prev, filePath })), []);

  const handleSubmit = async (): Promise<boolean> => {
    // SkillEditFormData will be generated for local storage as well, only pass if it has already been submitted
    const result = await submitSkillData(
      skillFormData,
      updateActionGroupAlertContent,
      skillEditFormData?.isSubmitted ? skillEditFormData : undefined
    );
    if (result) {
      //Remove draft if present in the local storage
      deleteDraftData(skillFormData.branchName);

      router.push('/dashboard');
    }
    return result;
  };
  return (
    <>
      <PageGroup isFilled style={{ overflowY: 'hidden', flex: 1 }}>
        <ContributePageHeader
          editFormData={skillEditFormData}
          draftData={draftData}
          isEdit
          isSkill
          description="Skill contributions improve a model’s ability to perform tasks. They consist of seed data which provide instructions for completing a
                  task. To autofill this form from a document, upload a YAML file."
          helpText="Learn more about skill contributions"
          sidePanelContent={<SkillContributionSidePanelHelp />}
          actions={
            <SkillFormActions
              contributionTitle={skillEditFormData?.formData.submissionSummary ?? 'New contribution'}
              skillFormData={skillFormData}
              isDraft={!!draftData}
              isSubmitted={!!skillEditFormData}
              setActionGroupAlertContent={setActionGroupAlertContent}
              setSkillFormData={setSkillFormData}
            />
          }
        />
        <div className="skill-form">
          <PageSection isFilled>
            <Flex direction={{ default: 'column' }} gap={{ default: 'gapMd' }} flexWrap={{ default: 'nowrap' }}>
              <FlexItem>
                <DetailsPage
                  isEditForm={skillEditFormData?.isEditForm}
                  infoSectionHelp="Skill contributions help a model perform tasks. Skill data is supported by documents such as textbooks, technical manuals, journals, or magazines."
                  email={skillFormData.email}
                  setEmail={(email) => setSkillFormData((prev) => ({ ...prev, email }))}
                  name={skillFormData.name}
                  setName={(name) => setSkillFormData((prev) => ({ ...prev, name }))}
                  submissionSummary={skillFormData.submissionSummary}
                  setSubmissionSummary={(submissionSummary) =>
                    setSkillFormData((prev) => ({
                      ...prev,
                      submissionSummary
                    }))
                  }
                  submissionSummaryPlaceholder="Describe the skill this example helps the model learn (e.g., solving math problems, spotting grammar mistakes)"
                  rootPath="skills"
                  filePath={skillFormData.filePath}
                  setFilePath={setFilePath}
                />
              </FlexItem>
              <FlexItem>
                <SkillSeedExamples
                  seedExamples={skillFormData.seedExamples}
                  onUpdateSeedExamples={(seedExamples) => setSkillFormData((prev) => ({ ...prev, seedExamples }))}
                />
              </FlexItem>
            </Flex>
          </PageSection>
        </div>
        <Divider />
        <PageSection>
          <ActionList>
            <ActionListGroup>
              <ActionListItem>
                <Button variant={ButtonVariant.primary} type="submit" isDisabled={!isValid} onClick={() => isValid && handleSubmit()}>
                  {skillEditFormData?.isSubmitted ? 'Update' : 'Submit'}
                </Button>
              </ActionListItem>
              <ActionListItem>
                <Button variant={ButtonVariant.link} onClick={() => router.push('/dashboard')}>
                  Cancel
                </Button>
              </ActionListItem>
            </ActionListGroup>
          </ActionList>
        </PageSection>
      </PageGroup>
      <ContributeAlertGroup actionGroupAlertContent={actionGroupAlertContent} onCloseActionGroupAlert={onCloseActionGroupAlert} />
    </>
  );
};

export default SkillForm;
