// src/app/api/native/pr/skill/route.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { SkillYamlData } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';
import { prInfoFromSummary } from '@/app/api/github/utils';

// Define paths and configuration
const LOCAL_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR || `${process.env.HOME}/.instructlab-ui`;

const SKILLS_DIR = 'compositional_skills';

export async function POST(req: NextRequest) {
  const REPO_DIR = path.join(LOCAL_TAXONOMY_ROOT_DIR, '/taxonomy');
  try {
    // Extract the QnA data from the request body
    const { action, branchName, content, name, email, submissionSummary, filePath, oldFilesPath } = await req.json(); // eslint-disable-line @typescript-eslint/no-unused-vars

    let skillBranchName;
    if (action == 'update' && branchName != '') {
      skillBranchName = branchName;
    } else {
      skillBranchName = `skill-contribution-${Date.now()}`;
    }

    const skillData = yaml.load(content) as SkillYamlData;
    const yamlString = dumpYaml(skillData);

    // Set the flag if commit needs to be amended
    let amendCommit = false;

    // Initialize the repository if it doesn’t exist
    await git.init({ fs, dir: REPO_DIR });

    // Create a new branch if the skill is pushed for first time
    if (action != 'update') {
      await git.branch({ fs, dir: REPO_DIR, ref: skillBranchName });
    }

    // Checkout the new branch
    await git.checkout({ fs, dir: REPO_DIR, ref: skillBranchName });

    // Define file path
    const newYamlFilePath = path.join(SKILLS_DIR, filePath, 'qna.yaml');

    // Write the QnA YAML file
    const yamlFilePath = path.join(REPO_DIR, newYamlFilePath);
    fs.mkdirSync(path.dirname(yamlFilePath), { recursive: true });
    fs.writeFileSync(yamlFilePath, yamlString);

    // Stage file
    await git.add({ fs, dir: REPO_DIR, filepath: newYamlFilePath });

    if (action == 'update') {
      // Define file path
      const oldYamlFilePath = path.join(SKILLS_DIR, oldFilesPath, 'qna.yaml');

      if (oldYamlFilePath != newYamlFilePath) {
        console.log('File path for the skill contribution is updated, removing the old files.');
        // Write the QnA YAML file
        const yamlFilePath = path.join(REPO_DIR, oldYamlFilePath);
        fs.unlinkSync(yamlFilePath);

        await git.remove({ fs, dir: REPO_DIR, filepath: oldYamlFilePath });

        amendCommit = true;
      }
    }

    // Commit files
    const { prTitle } = prInfoFromSummary(submissionSummary);
    await git.commit({
      fs,
      dir: REPO_DIR,
      message: `${prTitle}\n\nSigned-off-by: ${name} <${email}>`,
      author: {
        name: name,
        email: email
      },
      amend: amendCommit
    });

    // Respond with success
    console.log('Skill contribution submitted successfully. Submission name is ', skillBranchName);
    return NextResponse.json({ message: 'Skill contribution submitted successfully.', branch: skillBranchName }, { status: 201 });
  } catch (error) {
    console.error('Failed to create local branch and commit:', error);
    return NextResponse.json({ error: 'Failed to submit skill contribution.' }, { status: 500 });
  }
}
