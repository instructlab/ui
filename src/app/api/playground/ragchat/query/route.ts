// src/app/api/playground/ragchat/query/route.ts
'use server';

import { NextRequest, NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { dsauthenticate } from '../../../../../utils/dsauthenticate';

async function queryRAG(
  DS_HOST: string,
  DS_TOKEN: string,
  DS_PROJ_KEY: string,
  indexKey: string,
  question: string,
  model_id: string,
  doc_hash: string | null
) {
  const queryUrl = `${DS_HOST}/api/orchestrator/api/v1/query/run`;
  console.log('Querying RAG backend:', queryUrl);

  const payload = {
    query: {
      variables: {},
      template: {
        version: '1',
        tasks: [
          {
            id: 'QA',
            kind: 'SemanticRag',
            inputs: {},
            parameters: {
              question,
              model_id,
              retr_k: 10,
              use_reranker: false,
              hybrid_search_text_weight: 0.1,
              gen_timeout: 25,
              return_prompt: true,
              ...(doc_hash ? { doc_id: doc_hash } : {}) // doc_hash is added only if the user selects a specific doc to query
            },
            '@resource': {
              type: 'semantic_backend_genai_runner',
              proj_key: DS_PROJ_KEY,
              index_key: indexKey
            }
          }
        ],
        outputs: {
          answers: {
            task_id: 'QA',
            output_id: 'answers'
          },
          retrieval: {
            task_id: 'QA',
            output_id: 'retrieval'
          }
        }
      }
    }
  };

  try {
    const response = await fetch(queryUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Authorization': `Bearer ${DS_TOKEN}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();
    console.log('RAG backend response:', data);
    return data.result.outputs.answers[0].prompt;
  } catch (error) {
    console.error('Error querying RAG backend:', error.message);
    throw error;
  }
}

export async function POST(req: NextRequest) {
  const { question, dataIndex, docHash } = await req.json();
  const USERNAME = process.env.DS_USERNAME;
  const API_KEY = process.env.DS_API_KEY;
  const DS_HOST = process.env.DS_HOST;
  const DS_PROJ_KEY = process.env.DS_PROJ_KEY;
  const DS_MODEL_ID = process.env.DS_MODEL_ID;

  if (!USERNAME || !API_KEY || !DS_HOST || !DS_PROJ_KEY || !DS_MODEL_ID) {
    console.error('Missing required parameters or environment variables', { USERNAME, API_KEY, DS_HOST, DS_PROJ_KEY, DS_MODEL_ID });
    return NextResponse.json({ error: 'Missing required parameters or environment variables' }, { status: 400 });
  }

  try {
    const token = await dsauthenticate(USERNAME, API_KEY, DS_HOST);
    const prompt = await queryRAG(DS_HOST, token, DS_PROJ_KEY, dataIndex, question, DS_MODEL_ID, docHash);
    console.log('Prompt received:', prompt);
    return NextResponse.json({ prompt }, { status: 200 });
  } catch (error) {
    console.error('Server error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
