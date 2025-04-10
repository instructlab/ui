// src/components/Contribute/Knowledge/Github/index.tsx
'use client';
import React from 'react';
import { useSession } from 'next-auth/react';
import { ContributionFormData, EditFormData } from '@/types';
import { useRouter } from 'next/navigation';
import { autoFillKnowledgeFields, autoFillSkillsFields } from '@/components/Contribute/AutoFill';
import {
  Breadcrumb,
  BreadcrumbItem,
  Button,
  Content,
  Flex,
  FlexItem,
  PageBreadcrumb,
  PageGroup,
  PageSection,
  Title,
  Wizard,
  WizardStep
} from '@patternfly/react-core';
import { getGitHubUserInfo } from '@/utils/github';
import ContributionWizardFooter from '@/components/Contribute/ContributionWizard/ContributionWizardFooter';

import './contribute-page.scss';

export enum StepStatus {
  Default = 'default',
  Error = 'error',
  Success = 'success'
}

export interface StepType {
  id: string;
  name: string;
  component?: React.ReactNode;
  status?: StepStatus;
  subSteps?: {
    id: string;
    name: string;
    component?: React.ReactNode;
    status?: StepStatus;
  }[];
}

export interface Props {
  title: React.ReactNode;
  description: React.ReactNode;
  editFormData?: EditFormData;
  formData: ContributionFormData;
  setFormData: React.Dispatch<React.SetStateAction<ContributionFormData>>;
  isGithubMode: boolean;
  isSkillContribution: boolean;
  steps: StepType[];
  convertToYaml: (formData: ContributionFormData) => unknown;
  onSubmit: (githubUsername: string) => Promise<boolean>;
}

export const ContributionWizard: React.FunctionComponent<Props> = ({
  title,
  description,
  editFormData,
  formData,
  setFormData,
  isGithubMode,
  isSkillContribution,
  steps,
  convertToYaml,
  onSubmit
}) => {
  const [devModeEnabled, setDevModeEnabled] = React.useState<boolean | undefined>();
  const { data: session } = useSession();
  const [githubUsername, setGithubUsername] = React.useState<string>('');
  const [submitEnabled, setSubmitEnabled] = React.useState<boolean>(false); // **New State Added**
  const [activeStepIndex, setActiveStepIndex] = React.useState<number>(0);

  const router = useRouter();

  const stepIds = React.useMemo(
    () =>
      steps.reduce<string[]>((acc, nextStep) => {
        acc.push(nextStep.id);
        if (nextStep.subSteps?.length) {
          acc.push(...nextStep.subSteps.map((subStep) => subStep.id));
        }
        return acc;
      }, []),
    [steps]
  );
  const getStepIndex = (stepId: string) => stepIds.indexOf(stepId);

  React.useEffect(() => {
    const getEnvVariables = async () => {
      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();
      setDevModeEnabled(envConfig.ENABLE_DEV_MODE === 'true');
    };
    getEnvVariables();
  }, []);

  React.useEffect(() => {
    let canceled = false;

    if (isGithubMode) {
      const fetchUserInfo = async () => {
        if (session?.accessToken) {
          try {
            const headers = {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.accessToken}`,
              Accept: 'application/vnd.github+json',
              'X-GitHub-Api-Version': '2022-11-28'
            };
            const fetchedUserInfo = await getGitHubUserInfo(headers);
            if (!canceled) {
              setGithubUsername(fetchedUserInfo.login);
              setFormData((prev) => ({
                ...prev,
                name: fetchedUserInfo.name,
                email: fetchedUserInfo.email
              }));
            }
          } catch (error) {
            console.error('Failed to fetch GitHub user info:', error);
          }
        }
      };
      fetchUserInfo();
    } else {
      setFormData((prev) => ({
        ...prev,
        name: session?.user?.name ? session.user.name : prev.name,
        email: session?.user?.email ? session.user.email : prev.email
      }));
    }

    return () => {
      canceled = true;
    };
  }, [isGithubMode, session?.accessToken, session?.user?.name, session?.user?.email, setFormData]);

  const autoFillForm = (): void => {
    setFormData(isSkillContribution ? { ...autoFillSkillsFields } : { ...autoFillKnowledgeFields });
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  React.useEffect(() => {
    setSubmitEnabled(!steps.find((step) => step.status === 'error'));
  }, [steps]);

  return (
    <PageGroup isFilled style={{ overflowY: 'hidden', flex: 1 }}>
      <PageBreadcrumb stickyOnBreakpoint={{ default: 'top' }}>
        <Breadcrumb>
          <BreadcrumbItem to="/">Contribute</BreadcrumbItem>
          <BreadcrumbItem isActive>{title}</BreadcrumbItem>
        </Breadcrumb>
      </PageBreadcrumb>
      <PageSection className="knowledge-form" style={{ overflowY: 'hidden' }}>
        <Flex direction={{ default: 'column' }}>
          <FlexItem>
            <Flex justifyContent={{ default: 'justifyContentSpaceBetween' }}>
              <FlexItem>
                <Title headingLevel="h1" size="2xl" style={{ paddingTop: '10px' }}>
                  {title}
                </Title>
              </FlexItem>
              <FlexItem>
                {devModeEnabled && (
                  <Button variant="secondary" onClick={autoFillForm}>
                    Autofill
                  </Button>
                )}
              </FlexItem>
            </Flex>
          </FlexItem>
          <FlexItem>
            <Content component="p">{description}</Content>
          </FlexItem>
        </Flex>
      </PageSection>
      <PageSection isFilled style={{ flex: 1, overflowY: 'hidden', paddingTop: 0 }}>
        <Wizard
          style={{ maxHeight: '100%' }}
          startIndex={1}
          onClose={handleCancel}
          onStepChange={(_ev, currentStep) => setActiveStepIndex(stepIds.indexOf(String(currentStep.id)))}
          footer={
            <ContributionWizardFooter
              onCancel={handleCancel}
              formData={formData}
              isGithubMode={isGithubMode}
              onSubmit={() => onSubmit(githubUsername)}
              showSubmit={submitEnabled}
              isEdit={!!editFormData}
              convertToYaml={convertToYaml}
            />
          }
        >
          {steps.map((step) => (
            <WizardStep
              key={step.id}
              id={step.id}
              name={step.name}
              navItem={{ content: <span>{step.name}</span> }}
              status={getStepIndex(step.id) < activeStepIndex ? step.status : StepStatus.Default}
              steps={
                step.subSteps
                  ? step.subSteps.map((subStep) => (
                      <WizardStep
                        key={subStep.id}
                        id={subStep.id}
                        name={subStep.name}
                        navItem={{ content: <span>{subStep.name}</span> }}
                        status={getStepIndex(subStep.id) < activeStepIndex ? subStep.status : StepStatus.Default}
                      >
                        {subStep.component}
                      </WizardStep>
                    ))
                  : undefined
              }
            >
              {!step.subSteps ? step.component : null}
            </WizardStep>
          ))}
        </Wizard>
      </PageSection>
    </PageGroup>
  );
};

export default ContributionWizard;
