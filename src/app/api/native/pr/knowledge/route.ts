// src/app/api/native/pr/knowledge/route.ts

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import * as git from 'isomorphic-git';
import fs from 'fs';
import path from 'path';
import { dumpYaml } from '@/utils/yamlConfig';
import { KnowledgeYamlData } from '@/types';
import yaml from 'js-yaml';

// Define paths and configuration
const LOCAL_TAXONOMY_ROOT_DIR = process.env.NEXT_PUBLIC_LOCAL_TAXONOMY_ROOT_DIR || `${process.env.HOME}/.instructlab-ui`;

const KNOWLEDGE_DIR = 'knowledge';

export async function POST(req: NextRequest) {
  const REPO_DIR = path.join(LOCAL_TAXONOMY_ROOT_DIR, '/taxonomy');
  try {
    // Extract the data from the request body
    const { action, branchName, content, attribution, name, email, submissionSummary, filePath, oldFilesPath } = await req.json();

    let knowledgeBranchName;
    if (action == 'update' && branchName != '') {
      knowledgeBranchName = branchName;
    } else {
      knowledgeBranchName = `knowledge-contribution-${Date.now()}`;
    }

    // Parse the YAML string into an object
    const knowledgeData = yaml.load(content) as KnowledgeYamlData;

    // Convert the object to YAML
    const yamlString = dumpYaml(knowledgeData);

    // Define branch name and file paths
    const attributionContent = `Title of work: ${attribution.title_of_work}
Link to work: ${attribution.link_to_work}
Revision: ${attribution.revision}
License of the work: ${attribution.license_of_the_work}
Creator names: ${attribution.creator_names}
`;

    // Set the flag if commit needs to be amended
    let amendCommit = false;

    // Initialize the repository if it doesn’t exist
    await git.init({ fs, dir: REPO_DIR });

    // Create a new branch if the knowledge is pushed for first time
    if (action != 'update') {
      await git.branch({ fs, dir: REPO_DIR, ref: knowledgeBranchName });
    }

    // Checkout the new branch
    await git.checkout({ fs, dir: REPO_DIR, ref: knowledgeBranchName });

    const newYamlFilePath = path.join(KNOWLEDGE_DIR, filePath, 'qna.yaml');
    const newAttributionFilePath = path.join(KNOWLEDGE_DIR, filePath, 'attribution.txt');

    // Write YAML file to the knowledge directory
    const yamlFilePath = path.join(REPO_DIR, newYamlFilePath);
    fs.mkdirSync(path.dirname(yamlFilePath), { recursive: true });
    fs.writeFileSync(yamlFilePath, yamlString);

    // Write attribution file to the knowledge directory
    const attributionFilePath = path.join(REPO_DIR, newAttributionFilePath);
    fs.writeFileSync(attributionFilePath, attributionContent);

    // Stage the files
    await git.add({ fs, dir: REPO_DIR, filepath: newYamlFilePath });
    await git.add({ fs, dir: REPO_DIR, filepath: newAttributionFilePath });

    if (action == 'update') {
      // Define file paths
      const oldYamlFilePath = path.join(KNOWLEDGE_DIR, oldFilesPath, 'qna.yaml');
      const oldAttributionFilePath = path.join(KNOWLEDGE_DIR, oldFilesPath, 'attribution.txt');

      if (oldYamlFilePath != newYamlFilePath) {
        console.log('File path for the knowledge contribution is updated, removing the old files.');
        // Write the QnA YAML file
        const yamlFilePath = path.join(REPO_DIR, oldYamlFilePath);
        fs.unlinkSync(yamlFilePath);

        // Write the attribution text file
        const attributionFilePath = path.join(REPO_DIR, oldAttributionFilePath);
        fs.unlinkSync(attributionFilePath);

        await git.remove({ fs, dir: REPO_DIR, filepath: oldYamlFilePath });
        await git.remove({ fs, dir: REPO_DIR, filepath: oldAttributionFilePath });

        amendCommit = true;
      }
    }

    // Commit the changes
    await git.commit({
      fs,
      dir: REPO_DIR,
      message: `${submissionSummary}\n\nSigned-off-by: ${name} <${email}>`,
      author: {
        name: name,
        email: email
      },
      amend: amendCommit
    });

    // Respond with success message and branch name
    console.log(`Knowledge contribution submitted successfully to local taxonomy repo. Submission Name is ${knowledgeBranchName}.`);
    return NextResponse.json({ message: 'Knowledge contribution submitted successfully.', branch: knowledgeBranchName }, { status: 201 });
  } catch (error) {
    console.error(`Failed to submit knowledge contribution to local taxonomy repo:`, error);
    return NextResponse.json({ error: 'Failed to submit knowledge contribution.' }, { status: 500 });
  }
}
