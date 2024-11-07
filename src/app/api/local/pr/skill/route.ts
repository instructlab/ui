// src/app/api/local/pr/skill/route.ts
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

// Define paths and configuration
const REPO_DIR = process.env.NEXT_PUBLIC_LOCAL_REPO_PATH || '/path/to/local/repo'; // Update with actual local path
const SKILLS_DIR = 'compositional_skills';

export async function POST(req: NextRequest) {
  try {
    // Extract the QnA data from the request body TODO: what is documentOutline?
    const { content, attribution, name, email, submissionSummary, documentOutline, filePath } = await req.json(); // eslint-disable-line @typescript-eslint/no-unused-vars

    // Define file paths
    const branchName = `skill-contribution-${Date.now()}`;
    const newYamlFilePath = path.join(SKILLS_DIR, filePath, 'qna.yaml');
    const newAttributionFilePath = path.join(SKILLS_DIR, filePath, 'attribution.txt');

    // Prepare file content
    const yamlString = yaml.dump(content);
    const attributionString = `
Title of work: ${attribution.title_of_work}
License of the work: ${attribution.license_of_the_work}
Creator names: ${attribution.creator_names}
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
    return NextResponse.json({ message: 'Branch and commit created locally', branch: branchName }, { status: 201 });
  } catch (error) {
    console.error('Failed to create local branch and commit:', error);
    return NextResponse.json({ error: 'Failed to create local branch and commit' }, { status: 500 });
  }
}
