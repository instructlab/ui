// src/app/api/pr/knowledge/route.ts

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { dumpYaml } from '@/utils/yamlConfig';
import { KnowledgeYamlData } from '@/types';
import yaml from 'js-yaml';
import { prInfoFromSummary } from '@/app/api/utils';

// Define paths and configuration
const LOCAL_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR || `${process.env.HOME}/.instructlab-ui`;

const KNOWLEDGE_DIR = 'knowledge';

// This API submit the knowledge contribution to the local cached taxonomy and not to the remote taxonomy.
export async function POST(req: NextRequest) {
  const REPO_DIR = path.join(LOCAL_TAXONOMY_ROOT_DIR, '/taxonomy');
  try {
    // Extract the data from the request body
    const { action, branchName, content, name, email, submissionSummary, filePath, oldFilesPath } = await req.json();

    // Parse the YAML string into an object
    const knowledgeData = yaml.load(content) as KnowledgeYamlData;

    // Convert the object to YAML
    const yamlString = dumpYaml(knowledgeData);

    // Set the flag if commit needs to be amended
    let amendCommit = false;

    // Initialize the repository if it doesn’t exist
    await git.init({ fs, dir: REPO_DIR });

    // Create a new branch if the knowledge is pushed for first time
    if (action != 'update') {
      await git.branch({ fs, dir: REPO_DIR, ref: branchName });
    }

    // Checkout the new branch
    await git.checkout({ fs, dir: REPO_DIR, ref: branchName });

    const newYamlFilePath = path.join(KNOWLEDGE_DIR, filePath, 'qna.yaml');

    // Write YAML file to the knowledge directory
    const yamlFilePath = path.join(REPO_DIR, newYamlFilePath);
    fs.mkdirSync(path.dirname(yamlFilePath), { recursive: true });
    fs.writeFileSync(yamlFilePath, yamlString);

    // Stage the files
    await git.add({ fs, dir: REPO_DIR, filepath: newYamlFilePath });

    if (action == 'update') {
      // Define file paths
      const oldYamlFilePath = path.join(KNOWLEDGE_DIR, oldFilesPath, 'qna.yaml');

      if (oldYamlFilePath != newYamlFilePath) {
        console.log('File path for the knowledge contribution is updated, removing the old files.');
        // Write the QnA YAML file
        const yamlFilePath = path.join(REPO_DIR, oldYamlFilePath);
        fs.unlinkSync(yamlFilePath);

        await git.remove({ fs, dir: REPO_DIR, filepath: oldYamlFilePath });

        amendCommit = true;
      }
    }

    // Commit the changes
    const { commitMessage } = prInfoFromSummary(submissionSummary);
    await git.commit({
      fs,
      dir: REPO_DIR,
      message: `${commitMessage}\n\nSigned-off-by: ${name} <${email}>`,
      author: {
        name: name,
        email: email
      },
      amend: amendCommit
    });

    // Respond with success message and branch name
    console.log(`Knowledge contribution submitted successfully to local taxonomy repo. Submission Name is ${branchName}.`);
    return NextResponse.json({ message: 'Knowledge contribution submitted successfully.', branch: branchName }, { status: 201 });
  } catch (error) {
    console.error(`Failed to submit knowledge contribution to local taxonomy repo:`, error);
    return NextResponse.json({ error: 'Failed to submit knowledge contribution.' }, { status: 500 });
  }
}
