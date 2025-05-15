// src/components/Contribute/Skill/SkillWizard/SkillWizard.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ValidatedOptions, Button, PageBreadcrumb, Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { SkillSchemaVersion } from '@/types/const';
import { ContributionFormData, SkillEditFormData, SkillFormData, SkillSeedExample, SkillYamlData } from '@/types';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { isSkillSeedExamplesValid, isDetailsValid } from '@/components/Contribute/Utils/validationUtils';
import { submitSkillData } from '@/components/Contribute/Utils/submitUtils';
import { addYamlUploadSkill } from '@/components/Contribute/Utils/uploadUtils';
import { getDefaultSkillFormData } from '@/components/Contribute/Utils/contributionUtils';
import { ContributionWizard, StepStatus, StepType } from '@/components/Contribute/ContributionWizard/ContributionWizard';
import { YamlFileUploadModal } from '@/components/Contribute/YamlFileUploadModal';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import ReviewSubmission from '@/components/Contribute/ContributionWizard/ReviewSubmission/ReviewSubmission';
import SkillSeedExamples from '@/components/Contribute/Skill/SkillWizard/SkillSeedExamples/SkillSeedExamples';
import SkillSeedExamplesReviewSection from '@/components/Contribute/Skill/SkillWizard/SkillSeedExamples/SkillSeedExamplesReviewSection';
import DetailsPage from '@/components/Contribute/ContributionWizard/DetailsPage/DetailsPage';
import { storeDraftData, deleteDraftData, doSaveDraft, isDraftDataExist } from '@/components/Contribute/Utils/autoSaveUtils';

import './skills.css';

export interface Props {
  skillEditFormData?: SkillEditFormData;
}

const STEP_IDS = ['details', 'seed-examples', 'review-submission'];

export const SkillWizard: React.FunctionComponent<Props> = ({ skillEditFormData }) => {
  const [skillFormData, setSkillFormData] = React.useState<SkillFormData>(
    skillEditFormData?.formData
      ? {
          ...skillEditFormData.formData,
          seedExamples: skillEditFormData.formData.seedExamples.map((example) => ({
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
  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();
  const [isYamlModalOpen, setIsYamlModalOpen] = useState<boolean>(false);

  const router = useRouter();

  const setFilePath = React.useCallback((filePath: string) => setSkillFormData((prev) => ({ ...prev, filePath })), []);

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  const updateActionGroupAlertContent = (newContent: ActionGroupAlertContent | undefined) => {
    // In order to restart the timer, we must re-create the Alert not re-use it. Clear it for one round then set the new info
    setActionGroupAlertContent(undefined);
    if (newContent) {
      requestAnimationFrame(() => setActionGroupAlertContent(newContent));
    }
  };

  useEffect(() => {
    if (!doSaveDraft(skillFormData) && !isDraftDataExist(skillFormData.branchName)) {
      return;
    }

    storeDraftData(
      skillFormData.branchName,
      skillFormData.filePath,
      JSON.stringify(skillFormData),
      !!skillEditFormData?.isSubmitted,
      skillEditFormData?.oldFilesPath || ''
    );
  }, [skillEditFormData?.isSubmitted, skillEditFormData?.oldFilesPath, skillFormData]);

  const steps: StepType[] = React.useMemo(
    () => [
      {
        id: STEP_IDS[0],
        name: 'Details',
        component: (
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
        ),
        status: isDetailsValid(skillFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[1],
        name: 'Seed data',
        component: (
          <SkillSeedExamples
            seedExamples={skillFormData.seedExamples}
            onUpdateSeedExamples={(seedExamples) => setSkillFormData((prev) => ({ ...prev, seedExamples }))}
          />
        ),
        status: isSkillSeedExamplesValid(skillFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[2],
        name: 'Review',
        component: (
          <ReviewSubmission
            contributionFormData={skillFormData}
            isSkillContribution
            seedExamples={<SkillSeedExamplesReviewSection seedExamples={skillFormData.seedExamples} />}
            onUpdateSeedExamples={(seedExamples) => setSkillFormData((prev) => ({ ...prev, seedExamples: seedExamples as SkillSeedExample[] }))}
          />
        ),
        status: StepStatus.Default
      }
    ],
    [setFilePath, skillEditFormData?.isEditForm, skillFormData]
  );

  const convertToYaml = (contributionFormData: ContributionFormData) => {
    const formData = contributionFormData as SkillFormData;

    const yamlData: SkillYamlData = {
      created_by: formData.email!,
      version: SkillSchemaVersion,
      task_description: skillFormData.submissionSummary,
      seed_examples: skillFormData.seedExamples.map((example) => ({
        context: example.context,
        question: example.questionAndAnswer.question,
        answer: example.questionAndAnswer.answer
      }))
    };
    return yamlData;
  };

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

  const onYamlUploadSkillFillForm = (data: SkillYamlData): void => {
    setSkillFormData(addYamlUploadSkill(skillFormData, data));
    updateActionGroupAlertContent({
      title: 'YAML Uploaded Successfully',
      message: 'Your skill form has been populated based on the uploaded YAML file.',
      success: true,
      timeout: true
    });
    setIsYamlModalOpen(false);
  };

  return (
    <>
      <ContributionWizard
        breadcrumbs={
          skillEditFormData ? (
            <PageBreadcrumb stickyOnBreakpoint={{ default: 'top' }}>
              <Breadcrumb>
                <BreadcrumbItem
                  to="/"
                  onClick={(e) => {
                    e.preventDefault();
                    router.push('/dashboard');
                  }}
                >
                  My contributions
                </BreadcrumbItem>
                <BreadcrumbItem isActive>{`Edit${skillEditFormData?.isDraft ? ' draft' : ''} skills contribution`}</BreadcrumbItem>
              </Breadcrumb>
            </PageBreadcrumb>
          ) : null
        }
        title={skillEditFormData?.formData ? `Edit${skillEditFormData?.isDraft ? ' draft' : ''} skills contribution` : 'Skills contribution'}
        description={
          <>
            {`Skill contributions improve a model’s ability to perform tasks. They consist of seed data which provide instructions for completing a task. To autofill this form from a document, `}
            <Button isInline variant="link" onClick={() => setIsYamlModalOpen(true)}>
              upload a YAML file.
            </Button>
          </>
        }
        formData={skillFormData}
        setFormData={setSkillFormData as React.Dispatch<React.SetStateAction<ContributionFormData>>}
        isSkillContribution
        steps={steps}
        convertToYaml={convertToYaml}
        onSubmit={handleSubmit}
      />
      <ContributeAlertGroup actionGroupAlertContent={actionGroupAlertContent} onCloseActionGroupAlert={onCloseActionGroupAlert} />
      {isYamlModalOpen ? (
        <YamlFileUploadModal
          onClose={() => setIsYamlModalOpen(false)}
          isKnowledgeForm={false}
          onYamlUploadSkillsFillForm={onYamlUploadSkillFillForm}
          setActionGroupAlertContent={updateActionGroupAlertContent}
        />
      ) : null}
    </>
  );
};

export default SkillWizard;
