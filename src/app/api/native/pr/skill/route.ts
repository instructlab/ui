// src/app/api/native/pr/skill/route.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { AttributionData, SkillYamlData } from '@/types';
import { dumpYaml } from '@/utils/yamlConfig';

// Define paths and configuration
const LOCAL_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR || `${process.env.HOME}/.instructlab-ui`;

const SKILLS_DIR = 'compositional_skills';

export async function POST(req: NextRequest) {
  const REPO_DIR = path.join(LOCAL_TAXONOMY_ROOT_DIR, '/taxonomy');
  try {
    // Extract the QnA data from the request body TODO: what is documentOutline?
    const { content, attribution, name, email, submissionSummary, documentOutline, filePath } = await req.json(); // eslint-disable-line @typescript-eslint/no-unused-vars

    // Define file paths
    const branchName = `skill-contribution-${Date.now()}`;
    const newYamlFilePath = path.join(SKILLS_DIR, filePath, 'qna.yaml');
    const newAttributionFilePath = path.join(SKILLS_DIR, filePath, 'attribution.txt');

    const skillData = yaml.load(content) as SkillYamlData;
    const attributionData = attribution as AttributionData;

    const yamlString = dumpYaml(skillData);
    const attributionString = `
Title of work: ${attributionData.title_of_work}
License of the work: ${attributionData.license_of_the_work}
Creator names: ${attributionData.creator_names}
`;

    // Initialize the repository if it doesn’t exist
    await git.init({ fs, dir: REPO_DIR });

    // Create a new branch
    await git.branch({ fs, dir: REPO_DIR, ref: branchName });

    // Checkout the new branch
    await git.checkout({ fs, dir: REPO_DIR, ref: branchName });

    // Write the QnA YAML file
    const yamlFilePath = path.join(REPO_DIR, newYamlFilePath);
    fs.mkdirSync(path.dirname(yamlFilePath), { recursive: true });
    fs.writeFileSync(yamlFilePath, yamlString);

    // Write the attribution text file
    const attributionFilePath = path.join(REPO_DIR, newAttributionFilePath);
    fs.writeFileSync(attributionFilePath, attributionString);

    // Stage files
    await git.add({ fs, dir: REPO_DIR, filepath: newYamlFilePath });
    await git.add({ fs, dir: REPO_DIR, filepath: newAttributionFilePath });

    // Commit files
    await git.commit({
      fs,
      dir: REPO_DIR,
      message: `${submissionSummary}\n\nSigned-off-by: ${name} <${email}>`,
      author: {
        name: name,
        email: email
      }
    });

    // Respond with success
    console.log('Skill contribution submitted successfully. Submission name is ', branchName);
    return NextResponse.json({ message: 'Skill contribution submitted successfully.', branch: branchName }, { status: 201 });
  } catch (error) {
    console.error('Failed to create local branch and commit:', error);
    return NextResponse.json({ error: 'Failed to submit skill contribution.' }, { status: 500 });
  }
}
