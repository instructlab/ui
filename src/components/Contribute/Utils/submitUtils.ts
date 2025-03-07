import {
  AttributionData,
  KnowledgeEditFormData,
  KnowledgeFormData,
  KnowledgeYamlData,
  SkillEditFormData,
  SkillFormData,
  SkillYamlData
} from '@/types';
import { KnowledgeSchemaVersion, SkillSchemaVersion } from '@/types/const';
import { dumpYaml } from '@/utils/yamlConfig';
import { ActionGroupAlertContent } from '@/components/Contribute/types';
import { amendCommit, getGitHubUsername, updatePullRequest } from '@/utils/github';
import { Session } from 'next-auth';
import { validateKnowledgeFormFields, validateSkillFormFields } from '@/components/Contribute/Utils/validation';

const KNOWLEDGE_DIR = 'knowledge/';
const SKILLS_DIR = 'compositional_skills/';

const domainFromFilePath = (filePath: string): string => {
  if (!filePath) {
    return '';
  }
  const pathElements = filePath.split('/').filter((element) => !!element);
  return pathElements[pathElements.length - 1] || '';
};

export const submitNativeKnowledgeData = async (
  knowledgeFormData: KnowledgeFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  if (!validateKnowledgeFormFields(knowledgeFormData, setActionGroupAlertContent, true)) {
    return false;
  }

  // Strip leading slash and ensure trailing slash in the file path
  let sanitizedFilePath = knowledgeFormData.filePath!.startsWith('/') ? knowledgeFormData.filePath!.slice(1) : knowledgeFormData.filePath;
  sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

  const knowledgeYamlData: KnowledgeYamlData = {
    created_by: knowledgeFormData.email,
    version: KnowledgeSchemaVersion,
    domain: domainFromFilePath(knowledgeFormData.filePath),
    document_outline: knowledgeFormData.submissionSummary,
    seed_examples: knowledgeFormData.seedExamples.map((example) => ({
      context: example.context!,
      questions_and_answers: example.questionAndAnswers.map((questionAndAnswer) => ({
        question: questionAndAnswer.question,
        answer: questionAndAnswer.answer
      }))
    })),
    document: {
      repo: knowledgeFormData.knowledgeDocumentRepositoryUrl!,
      commit: knowledgeFormData.knowledgeDocumentCommit!,
      patterns: knowledgeFormData.documentName!.split(',').map((pattern) => pattern.trim())
    }
  };

  const yamlString = dumpYaml(knowledgeYamlData);

  const waitForSubmissionAlert: ActionGroupAlertContent = {
    title: 'Knowledge contribution submission in progress!',
    message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
    success: true,
    waitAlert: true,
    timeout: false
  };
  setActionGroupAlertContent(waitForSubmissionAlert);

  const { name, submissionSummary, email } = knowledgeFormData;

  const response = await fetch('/api/native/pr/knowledge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'submit',
      branch: '',
      content: yamlString,
      name,
      email,
      submissionSummary,
      documentOutline: submissionSummary,
      filePath: sanitizedFilePath,
      oldFilesPath: sanitizedFilePath
    })
  });

  if (!response.ok) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Failed data submission`,
      message: response.statusText,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  await response.json();
  const actionGroupAlertContent: ActionGroupAlertContent = {
    title: 'Knowledge contribution submitted successfully!',
    message: `Thank you for your contribution!`,
    url: '/dashboard/',
    success: true
  };
  setActionGroupAlertContent(actionGroupAlertContent);
  return true;
};

export const submitGithubKnowledgeData = async (
  knowledgeFormData: KnowledgeFormData,
  githubUsername: string,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  if (!validateKnowledgeFormFields(knowledgeFormData, setActionGroupAlertContent, false)) {
    return false;
  }
  // Strip leading slash and ensure trailing slash in the file path
  let sanitizedFilePath = knowledgeFormData.filePath!.startsWith('/') ? knowledgeFormData.filePath!.slice(1) : knowledgeFormData.filePath;
  sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

  const knowledgeYamlData: KnowledgeYamlData = {
    created_by: githubUsername!,
    version: KnowledgeSchemaVersion,
    domain: domainFromFilePath(knowledgeFormData.filePath),
    document_outline: knowledgeFormData.submissionSummary,
    seed_examples: knowledgeFormData.seedExamples.map((example) => ({
      context: example.context!,
      questions_and_answers: example.questionAndAnswers.map((questionAndAnswer) => ({
        question: questionAndAnswer.question,
        answer: questionAndAnswer.answer
      }))
    })),
    document: {
      repo: knowledgeFormData.knowledgeDocumentRepositoryUrl!,
      commit: knowledgeFormData.knowledgeDocumentCommit!,
      patterns: knowledgeFormData.documentName!.split(',').map((pattern) => pattern.trim())
    }
  };

  const yamlString = dumpYaml(knowledgeYamlData);

  const attributionData: AttributionData = {
    title_of_work: knowledgeFormData.titleWork!,
    link_to_work: knowledgeFormData.linkWork!,
    revision: knowledgeFormData.revision!,
    license_of_the_work: knowledgeFormData.licenseWork!,
    creator_names: knowledgeFormData.creators!
  };

  const waitForSubmissionAlert: ActionGroupAlertContent = {
    title: 'Knowledge contribution submission in progress.!',
    message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
    success: true,
    waitAlert: true,
    timeout: false
  };
  setActionGroupAlertContent(waitForSubmissionAlert);

  const { name, submissionSummary, email } = knowledgeFormData;
  const response = await fetch('/api/github/pr/knowledge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: yamlString,
      attribution: attributionData,
      name,
      email,
      submissionSummary,
      documentOutline: submissionSummary,
      filePath: sanitizedFilePath
    })
  });

  if (!response.ok) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Failed data submission`,
      message: response.statusText,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  const result = await response.json();
  const actionGroupAlertContent: ActionGroupAlertContent = {
    title: 'Knowledge contribution submitted successfully!',
    message: `Thank you for your contribution!`,
    url: `${result.html_url}`,
    isUrlExternal: true,
    success: true
  };
  setActionGroupAlertContent(actionGroupAlertContent);
  return true;
};

export const updateNativeKnowledgeData = async (
  knowledgeFormData: KnowledgeFormData,
  knowledgeEditFormData: KnowledgeEditFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  if (!validateKnowledgeFormFields(knowledgeFormData, setActionGroupAlertContent, true)) {
    return false;
  }
  // Strip leading slash and ensure trailing slash in the file path
  let sanitizedFilePath = knowledgeFormData.filePath?.startsWith('/') ? knowledgeFormData.filePath!.slice(1) : knowledgeFormData.filePath;
  sanitizedFilePath = sanitizedFilePath?.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

  const knowledgeYamlData: KnowledgeYamlData = {
    created_by: knowledgeFormData.email,
    version: KnowledgeSchemaVersion,
    domain: domainFromFilePath(knowledgeFormData.filePath),
    document_outline: knowledgeFormData.submissionSummary,
    seed_examples: knowledgeFormData.seedExamples.map((example) => ({
      context: example.context,
      questions_and_answers: example.questionAndAnswers.map((questionAndAnswer) => ({
        question: questionAndAnswer.question,
        answer: questionAndAnswer.answer
      }))
    })),
    document: {
      repo: knowledgeFormData.knowledgeDocumentRepositoryUrl,
      commit: knowledgeFormData.knowledgeDocumentCommit,
      patterns: knowledgeFormData.documentName?.split(',').map((pattern) => pattern.trim())
    }
  };

  const yamlString = dumpYaml(knowledgeYamlData);

  const waitForSubmissionAlert: ActionGroupAlertContent = {
    title: 'Knowledge contribution submission in progress!',
    message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
    success: true,
    waitAlert: true,
    timeout: false
  };
  setActionGroupAlertContent(waitForSubmissionAlert);

  const { name, email, submissionSummary } = knowledgeFormData;
  const { branchName, oldFilesPath } = knowledgeEditFormData;
  const response = await fetch('/api/native/pr/knowledge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'update',
      branchName: branchName,
      content: yamlString,
      name,
      email,
      submissionSummary,
      documentOutline: submissionSummary,
      filePath: sanitizedFilePath,
      oldFilesPath: oldFilesPath
    })
  });

  if (!response.ok) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Failed data submission`,
      message: response.statusText,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  await response.json();
  const actionGroupAlertContent: ActionGroupAlertContent = {
    title: 'Knowledge contribution updated successfully!',
    message: `Thank you for your contribution!`,
    url: '/dashboard/',
    success: true
  };
  setActionGroupAlertContent(actionGroupAlertContent);
  return true;
};

export const updateGithubKnowledgeData = async (
  session: Session | null,
  knowledgeFormData: KnowledgeFormData,
  knowledgeEditFormData: KnowledgeEditFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  if (!validateKnowledgeFormFields(knowledgeFormData, setActionGroupAlertContent, false)) {
    return false;
  }

  if (session?.accessToken) {
    try {
      console.log(`Updating PR with number: ${knowledgeEditFormData.pullRequestNumber}`);
      await updatePullRequest(session.accessToken, knowledgeEditFormData.pullRequestNumber, {
        title: knowledgeFormData.submissionSummary
      });

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };

      const githubUsername = await getGitHubUsername(headers);
      console.log(`GitHub username: ${githubUsername}`);

      const knowledgeYamlData: KnowledgeYamlData = {
        created_by: githubUsername!,
        version: KnowledgeSchemaVersion,
        domain: domainFromFilePath(knowledgeFormData.filePath),
        document_outline: knowledgeFormData.submissionSummary,
        seed_examples: knowledgeFormData.seedExamples.map((example) => ({
          context: example.context!,
          questions_and_answers: example.questionAndAnswers.map((questionAndAnswer) => ({
            question: questionAndAnswer.question,
            answer: questionAndAnswer.answer
          }))
        })),
        document: {
          repo: knowledgeFormData.knowledgeDocumentRepositoryUrl!,
          commit: knowledgeFormData.knowledgeDocumentCommit!,
          patterns: knowledgeFormData.documentName!.split(',').map((pattern) => pattern.trim())
        }
      };

      const yamlString = dumpYaml(knowledgeYamlData);
      console.log('Updated knowledge YAML content:', yamlString);

      const attributionData: AttributionData = {
        title_of_work: knowledgeFormData.titleWork!,
        link_to_work: knowledgeFormData.linkWork!,
        revision: knowledgeFormData.revision!,
        license_of_the_work: knowledgeFormData.licenseWork!,
        creator_names: knowledgeFormData.creators!
      };
      const attributionContent = `Title of work: ${attributionData.title_of_work}
Link to work: ${attributionData.link_to_work}
Revision: ${attributionData.revision}
License of the work: ${attributionData.license_of_the_work}
Creator names: ${attributionData.creator_names}
`;

      console.log('Updated knowledge attribution content:', attributionData);

      const commitMessage = `Amend commit with updated content\n\nSigned-off-by: ${knowledgeFormData.name} <${knowledgeFormData.email}>`;

      // Ensure proper file paths for the edit
      const finalYamlPath = KNOWLEDGE_DIR + knowledgeFormData.filePath.replace(/^\//, '').replace(/\/?$/, '/') + 'qna.yaml';
      const finalAttributionPath = KNOWLEDGE_DIR + knowledgeFormData.filePath.replace(/^\//, '').replace(/\/?$/, '/') + 'attribution.txt';

      const oldFilePath = {
        yaml: KNOWLEDGE_DIR + knowledgeEditFormData.oldFilesPath.replace(/^\//, '').replace(/\/?$/, '/') + 'qna.yaml',
        attribution: KNOWLEDGE_DIR + knowledgeEditFormData.oldFilesPath.replace(/^\//, '').replace(/\/?$/, '/') + 'attribution.txt'
      };

      console.log('Knowledge update old file path : ', oldFilePath);

      const newFilePath = {
        yaml: finalYamlPath,
        attribution: finalAttributionPath
      };
      console.log('Knowledge update new file path : ', oldFilePath);

      const waitForSubmissionAlert: ActionGroupAlertContent = {
        title: 'Knowledge contribution update is in progress.!',
        message: `Once the update is successful, it will provide the link to the updated Pull Request.`,
        success: true,
        waitAlert: true,
        timeout: false
      };
      setActionGroupAlertContent(waitForSubmissionAlert);

      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();

      const amendedCommitResponse = await amendCommit(
        session.accessToken,
        githubUsername,
        envConfig.UPSTREAM_REPO_NAME,
        oldFilePath,
        newFilePath,
        yamlString,
        attributionContent,
        knowledgeEditFormData.branchName,
        commitMessage
      );
      console.log('Amended commit response:', amendedCommitResponse);

      const prLink = `https://github.com/${envConfig.UPSTREAM_REPO_OWNER}/${envConfig.UPSTREAM_REPO_NAME}/pull/${knowledgeEditFormData.pullRequestNumber}`;
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: 'Knowledge contribution updated successfully!',
        message: `Thank you for your contribution!`,
        url: `${prLink}`,
        isUrlExternal: true,
        success: true
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      // Knowledge is updated, wait for a bit and let's go back to dashboard.
      await new Promise((r) => setTimeout(r, 4000));
    } catch (error) {
      console.error('Error updating PR:', error);
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: `Failed to update PR with number: ${knowledgeEditFormData.pullRequestNumber}`,
        message: `PR update failed because of ${error}`,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      return false;
    }
    return true;
  }
  return false;
};

export const submitNativeSkillData = async (
  skillFormData: SkillFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  if (!validateSkillFormFields(skillFormData, setActionGroupAlertContent, true)) {
    return false;
  }

  // Strip leading slash and ensure trailing slash in the file path
  let sanitizedFilePath = skillFormData.filePath!.startsWith('/') ? skillFormData.filePath!.slice(1) : skillFormData.filePath;
  sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

  const skillYamlData: SkillYamlData = {
    created_by: skillFormData.name,
    version: SkillSchemaVersion,
    task_description: skillFormData.submissionSummary,
    seed_examples: skillFormData.seedExamples.map((example) => ({
      context: example.context,
      question: example.questionAndAnswer.question,
      answer: example.questionAndAnswer.answer
    }))
  };

  const yamlString = dumpYaml(skillYamlData);

  const waitForSubmissionAlert: ActionGroupAlertContent = {
    title: 'Skill contribution submission in progress!',
    message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
    success: true,
    waitAlert: true,
    timeout: false
  };
  setActionGroupAlertContent(waitForSubmissionAlert);

  const { name, email, submissionSummary } = skillFormData;

  const response = await fetch('/api/native/pr/skill/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'submit',
      branchName: '',
      content: yamlString,
      name,
      email,
      submissionSummary,
      filePath: sanitizedFilePath,
      oldFilesPath: sanitizedFilePath
    })
  });

  if (!response.ok) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Failed data submission`,
      message: response.statusText,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  await response.json();
  const actionGroupAlertContent: ActionGroupAlertContent = {
    title: 'Skill contribution submitted successfully!',
    message: `Thank you for your contribution!`,
    url: '/dashboard',
    success: true
  };
  setActionGroupAlertContent(actionGroupAlertContent);
  return true;
};

export const submitGithubSkillData = async (
  skillFormData: SkillFormData,
  githubUsername: string,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  if (!validateSkillFormFields(skillFormData, setActionGroupAlertContent, false)) {
    return false;
  }

  // Strip leading slash and ensure trailing slash in the file path
  let sanitizedFilePath = skillFormData.filePath!.startsWith('/') ? skillFormData.filePath!.slice(1) : skillFormData.filePath;
  sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

  const skillYamlData: SkillYamlData = {
    created_by: githubUsername!,
    version: SkillSchemaVersion,
    task_description: skillFormData.submissionSummary!,
    seed_examples: skillFormData.seedExamples.map((example) => ({
      context: example.context,
      question: example.questionAndAnswer.question,
      answer: example.questionAndAnswer.answer
    }))
  };

  const yamlString = dumpYaml(skillYamlData);

  const attributionData: AttributionData = {
    title_of_work: skillFormData.titleWork!,
    license_of_the_work: skillFormData.licenseWork!,
    creator_names: skillFormData.creators!,
    link_to_work: '',
    revision: ''
  };

  const waitForSubmissionAlert: ActionGroupAlertContent = {
    title: 'Skill contribution submission in progress.!',
    message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
    success: true,
    waitAlert: true,
    timeout: false
  };
  setActionGroupAlertContent(waitForSubmissionAlert);

  const { name, email, submissionSummary } = skillFormData;
  const response = await fetch('/api/github/pr/skill', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      content: yamlString,
      attribution: attributionData,
      name,
      email,
      submissionSummary,
      filePath: sanitizedFilePath
    })
  });

  if (!response.ok) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Failed data submission`,
      message: response.statusText,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  const result = await response.json();
  const actionGroupAlertContent: ActionGroupAlertContent = {
    title: 'Skill contribution submitted successfully!',
    message: `Thank you for your contribution!`,
    url: `${result.html_url}`,
    isUrlExternal: true,
    success: true
  };
  setActionGroupAlertContent(actionGroupAlertContent);
  return true;
};

export const updateNativeSkillData = async (
  skillFormData: SkillFormData,
  skillEditFormData: SkillEditFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  if (!validateSkillFormFields(skillFormData, setActionGroupAlertContent, true)) {
    return false;
  }
  // Strip leading slash and ensure trailing slash in the file path
  let sanitizedFilePath = skillFormData.filePath!.startsWith('/') ? skillFormData.filePath!.slice(1) : skillFormData.filePath;
  sanitizedFilePath = sanitizedFilePath!.endsWith('/') ? sanitizedFilePath : `${sanitizedFilePath}/`;

  const skillYamlData: SkillYamlData = {
    created_by: skillFormData.name,
    version: SkillSchemaVersion,
    task_description: skillFormData.submissionSummary,
    seed_examples: skillFormData.seedExamples.map((example) => ({
      context: example.context,
      question: example.questionAndAnswer.question,
      answer: example.questionAndAnswer.answer
    }))
  };

  const yamlString = dumpYaml(skillYamlData);

  const waitForSubmissionAlert: ActionGroupAlertContent = {
    title: 'Skill contribution submission in progress!',
    message: `Once the submission is successful, it will provide the link to the newly created Pull Request.`,
    success: true,
    waitAlert: true,
    timeout: false
  };
  setActionGroupAlertContent(waitForSubmissionAlert);

  const { name, email, submissionSummary } = skillFormData;
  const { branchName, oldFilesPath } = skillEditFormData;

  const response = await fetch('/api/native/pr/skill/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'update',
      branchName: branchName,
      content: yamlString,
      name,
      email,
      submissionSummary,
      filePath: sanitizedFilePath,
      oldFilesPath: oldFilesPath
    })
  });

  if (!response.ok) {
    const actionGroupAlertContent: ActionGroupAlertContent = {
      title: `Failed data submission`,
      message: response.statusText,
      success: false
    };
    setActionGroupAlertContent(actionGroupAlertContent);
    return false;
  }

  await response.json();
  const actionGroupAlertContent: ActionGroupAlertContent = {
    title: 'Skill contribution updated successfully!',
    message: `Thank you for your contribution!`,
    url: '/dashboard',
    success: true
  };
  setActionGroupAlertContent(actionGroupAlertContent);
  return true;
};

export const updateGithubSkillData = async (
  session: Session | null,
  skillFormData: SkillFormData,
  skillEditFormData: SkillEditFormData,
  setActionGroupAlertContent: (content: ActionGroupAlertContent) => void
): Promise<boolean> => {
  if (!validateSkillFormFields(skillFormData, setActionGroupAlertContent, false)) {
    return false;
  }
  if (session?.accessToken) {
    const { pullRequestNumber, oldFilesPath, branchName } = skillEditFormData;
    try {
      console.log(`Updating PR with number: ${pullRequestNumber}`);
      await updatePullRequest(session.accessToken, pullRequestNumber, {
        title: skillFormData.submissionSummary
      });

      const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.accessToken}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      const githubUsername = await getGitHubUsername(headers);
      console.log(`GitHub username: ${githubUsername}`);

      const skillYamlData: SkillYamlData = {
        created_by: githubUsername!,
        version: SkillSchemaVersion,
        task_description: skillFormData.submissionSummary,
        seed_examples: skillFormData.seedExamples.map((example) => ({
          context: example.context,
          question: example.questionAndAnswer.question,
          answer: example.questionAndAnswer.answer
        }))
      };

      const yamlString = dumpYaml(skillYamlData);
      console.log('Updated YAML content:', yamlString);

      const attributionData: AttributionData = {
        title_of_work: skillFormData.titleWork!,
        license_of_the_work: skillFormData.licenseWork!,
        creator_names: skillFormData.creators!,
        link_to_work: '',
        revision: ''
      };
      const attributionContent = `Title of work: ${attributionData.title_of_work}
License of the work: ${attributionData.license_of_the_work}
Creator names: ${attributionData.creator_names}
`;

      console.log('Updated Attribution content:', attributionData);

      const commitMessage = `Amend commit with updated content\n\nSigned-off-by: ${skillFormData.name} <${skillFormData.email}>`;

      // Ensure proper file paths for the edit
      const finalYamlPath = SKILLS_DIR + skillFormData.filePath.replace(/^\//, '').replace(/\/?$/, '/') + 'qna.yaml';
      const finalAttributionPath = SKILLS_DIR + skillFormData.filePath.replace(/^\//, '').replace(/\/?$/, '/') + 'attribution.txt';

      const oldFilePath = {
        yaml: SKILLS_DIR + oldFilesPath.replace(/^\//, '').replace(/\/?$/, '/') + 'qna.yaml',
        attribution: SKILLS_DIR + oldFilesPath.replace(/^\//, '').replace(/\/?$/, '/') + 'attribution.txt'
      };

      const newFilePath = {
        yaml: finalYamlPath,
        attribution: finalAttributionPath
      };

      const res = await fetch('/api/envConfig');
      const envConfig = await res.json();

      const waitForSubmissionAlert: ActionGroupAlertContent = {
        title: 'Skill contribution update is in progress.!',
        message: `Once the update is successful, it will provide the link to the updated Pull Request.`,
        success: true,
        waitAlert: true,
        timeout: false
      };
      setActionGroupAlertContent(waitForSubmissionAlert);

      const amendedCommitResponse = await amendCommit(
        session.accessToken,
        githubUsername,
        envConfig.UPSTREAM_REPO_NAME,
        oldFilePath,
        newFilePath,
        yamlString,
        attributionContent,
        branchName,
        commitMessage
      );
      console.log('Amended commit response:', amendedCommitResponse);

      const prLink = `https://github.com/${envConfig.UPSTREAM_REPO_OWNER}/${envConfig.UPSTREAM_REPO_NAME}/pull/${pullRequestNumber}`;
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: 'Skill contribution updated successfully!',
        message: `Thank you for your contribution!`,
        url: `${prLink}`,
        isUrlExternal: true,
        success: true
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      // Skill is updated, wait for a bit and let's go back to dashboard.
      await new Promise((r) => setTimeout(r, 4000));
    } catch (error) {
      console.error('Error updating PR:', error);
      const actionGroupAlertContent: ActionGroupAlertContent = {
        title: `Failed to update PR with number: ${pullRequestNumber}`,
        message: `PR update failed because of ${error}`,
        success: false
      };
      setActionGroupAlertContent(actionGroupAlertContent);
      return false;
    }
    return true;
  }
  return false;
};
