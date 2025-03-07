// src/components/Contribute/Sill/SkillWizard.tsx
'use client';
import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ValidatedOptions, Button } from '@patternfly/react-core';
import { devLog } from '@/utils/devlog';
import { SkillSchemaVersion } from '@/types/const';
import { ContributionFormData, SkillEditFormData, SkillFormData, SkillYamlData } from '@/types';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { isAttributionInformationValid, isSkillSeedExamplesValid, isDetailsValid } from '@/components/Contribute/Utils/validationUtils';
import {
  submitGithubSkillData,
  submitNativeSkillData,
  updateGithubSkillData,
  updateNativeSkillData
} from '@/components/Contribute/Utils/submitUtils';
import { addYamlUploadSkill } from '@/components/Contribute/Utils/uploadUtils';
import { createDefaultSkillSeedExamples } from '@/components/Contribute/Utils/seedExampleUtils';
import AttributionInformation from '@/components/Contribute/AttributionInformation/AttributionInformation';
import { ContributionWizard, StepStatus, StepType } from '@/components/Contribute/ContributionWizard/ContributionWizard';
import { YamlFileUploadModal } from '@/components/Contribute/YamlFileUploadModal';
import ContributeAlertGroup from '@/components/Contribute/ContributeAlertGroup';
import ReviewSubmission from '@/components/Contribute/ReviewSubmission/ReviewSubmission';
import SkillSeedExamples from '@/components/Contribute/Skill/SkillSeedExamples/SkillSeedExamples';
import SkillSeedExamplesReviewSection from '@/components/Contribute/Skill/SkillSeedExamples/SkillSeedExamplesReviewSection';

import './skills.css';
import DetailsPage from '@/components/Contribute/DetailsPage/DetailsPage';

const DefaultSkillFormData: SkillFormData = {
  email: '',
  name: '',
  submissionSummary: '',
  documentOutline: '',
  filePath: '',
  seedExamples: createDefaultSkillSeedExamples(),
  titleWork: '',
  licenseWork: '',
  creators: ''
};

export interface Props {
  skillEditFormData?: SkillEditFormData;
  isGithubMode: boolean;
}

const STEP_IDS = ['details', 'seed-examples', 'attribution-info', 'review-submission'];

export const SkillWizard: React.FunctionComponent<Props> = ({ skillEditFormData, isGithubMode }) => {
  const { data: session } = useSession();
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
      : DefaultSkillFormData
  );
  const [actionGroupAlertContent, setActionGroupAlertContent] = useState<ActionGroupAlertContent | undefined>();
  const [isYamlModalOpen, setIsYamlModalOpen] = useState<boolean>(false);

  const router = useRouter();

  const setFilePath = React.useCallback((filePath: string) => setSkillFormData((prev) => ({ ...prev, filePath })), []);

  const onCloseActionGroupAlert = () => {
    setActionGroupAlertContent(undefined);
  };

  useEffect(() => {
    devLog('Seed Examples Updated:', skillFormData.seedExamples);
  }, [skillFormData.seedExamples]);

  const steps: StepType[] = React.useMemo(
    () => [
      {
        id: STEP_IDS[0],
        name: 'Details',
        component: (
          <DetailsPage
            isEditForm={skillEditFormData?.isEditForm}
            infoSectionTitle="Skill information"
            infoSectionDescription="Provide brief information about the Skills."
            isGithubMode={isGithubMode}
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
            documentOutline={skillFormData.documentOutline}
            setDocumentOutline={(documentOutline) =>
              setSkillFormData((prev) => ({
                ...prev,
                documentOutline
              }))
            }
            rootPath="skills"
            filePath={skillFormData.filePath}
            setFilePath={setFilePath}
          />
        ),
        status: isDetailsValid(skillFormData) ? StepStatus.Success : StepStatus.Error
      },
      {
        id: STEP_IDS[1],
        name: 'Create seed data',
        component: (
          <SkillSeedExamples
            seedExamples={skillFormData.seedExamples}
            onUpdateSeedExamples={(seedExamples) => setSkillFormData((prev) => ({ ...prev, seedExamples }))}
          />
        ),
        status: isSkillSeedExamplesValid(skillFormData) ? StepStatus.Success : StepStatus.Error
      },
      ...(isGithubMode
        ? [
            {
              id: STEP_IDS[2],
              name: 'Attribution Information',
              component: (
                <AttributionInformation
                  isEditForm={skillEditFormData?.isEditForm}
                  contributionFormData={skillFormData}
                  titleWork={skillFormData.titleWork}
                  setTitleWork={(titleWork) => setSkillFormData((prev) => ({ ...prev, titleWork }))}
                  licenseWork={skillFormData.licenseWork}
                  setLicenseWork={(licenseWork) => setSkillFormData((prev) => ({ ...prev, licenseWork }))}
                  creators={skillFormData.creators}
                  setCreators={(creators) => setSkillFormData((prev) => ({ ...prev, creators }))}
                />
              ),
              status: isAttributionInformationValid(skillFormData) ? StepStatus.Success : StepStatus.Error
            }
          ]
        : []),
      {
        id: STEP_IDS[3],
        name: 'Review submission',
        component: (
          <ReviewSubmission
            contributionFormData={skillFormData}
            isSkillContribution
            isGithubMode={isGithubMode}
            seedExamples={<SkillSeedExamplesReviewSection seedExamples={skillFormData.seedExamples} />}
          />
        ),
        status: StepStatus.Default
      }
    ],
    [isGithubMode, setFilePath, skillEditFormData?.isEditForm, skillFormData]
  );

  const convertToYaml = (contributionFormData: ContributionFormData) => {
    const formData = contributionFormData as SkillFormData;

    const yamlData: SkillYamlData = {
      created_by: formData.email!,
      version: SkillSchemaVersion,
      task_description: skillFormData.documentOutline!,
      seed_examples: skillFormData.seedExamples.map((example) => ({
        context: example.context,
        question: example.questionAndAnswer.question,
        answer: example.questionAndAnswer.answer
      }))
    };
    return yamlData;
  };

  const handleSubmit = async (githubUsername: string): Promise<boolean> => {
    if (skillEditFormData) {
      const result = isGithubMode
        ? await updateGithubSkillData(session, skillFormData, skillEditFormData, setActionGroupAlertContent)
        : await updateNativeSkillData(skillFormData, skillEditFormData, setActionGroupAlertContent);
      if (result) {
        router.push('/dashboard');
      }
      return false;
    }
    const result = isGithubMode
      ? await submitGithubSkillData(skillFormData, githubUsername, setActionGroupAlertContent)
      : await submitNativeSkillData(skillFormData, setActionGroupAlertContent);
    if (result) {
      const newFormData = { ...DefaultSkillFormData };
      newFormData.name = skillFormData.name;
      newFormData.email = skillFormData.email;

      setSkillFormData(newFormData);
    }
    return result;
  };

  const onYamlUploadSkillFillForm = (data: SkillYamlData): void => {
    setSkillFormData(addYamlUploadSkill(skillFormData, data));
    setActionGroupAlertContent({
      title: 'YAML Uploaded Successfully',
      message: 'Your skill form has been populated based on the uploaded YAML file.',
      success: true
    });
    setIsYamlModalOpen(false);
  };

  return (
    <>
      <ContributionWizard
        title="Skill Contribution"
        description={
          <>
            {`Skills are performative. When you create a skill for the model, you are teaching it how to do something: "write me a song",
            "rearrange words in a sentence" or "summarize an email". The contribution form guides you through the process, or you can `}
            <Button isInline variant="link" onClick={() => setIsYamlModalOpen(true)}>
              upload an existing yaml file.
            </Button>
          </>
        }
        formData={skillFormData}
        setFormData={setSkillFormData as React.Dispatch<React.SetStateAction<ContributionFormData>>}
        isGithubMode={isGithubMode}
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
          setActionGroupAlertContent={setActionGroupAlertContent}
        />
      ) : null}
    </>
  );
};

export default SkillWizard;
