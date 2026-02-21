import { ChatGPTLLM, LLMRunner } from "@graf-research/llm-runner";
import { AgentCap, utility_relative_dir_path } from "./agent-capability";
import { getImplPrompt, ImplPromptParam } from "../prompt";

export interface ImplPlanResponse {
  instruction: AgentCap
  llm: ChatGPTLLM
  session: LLMRunner.ChatSession
}

export async function generateFirstImplementationPlan(param: ImplPromptParam, _llm_model?: string): Promise<ImplPlanResponse> {
  const secret_key = process.env.SK as string || '';
  const llm_model = _llm_model ?? 'google/gemini-3-flash-preview';
  const llm_endpoint = 'https://openrouter.ai/api/v1';
  const llm: ChatGPTLLM = new ChatGPTLLM(secret_key, llm_model as any, undefined, llm_endpoint);
  const session = llm.chat_session_manager.newSession();
  session.list_message.push({
    role: 'user',
    content: [
      `## Your main task`,
      `Implement page "${param.page_name}" by creating first plan to execute the task, follow implementation guides below.`,
      '',
      '## Guide: How Write Plans',
      'Every plan has structure (typescript syntax) `AgenCap`, response with only single instruction one by one, after user response, give another instruction separately, until "finished" instruction. Remember "finished" instruction is separated instruction.',
      '',
      '```ts',
      "export interface AgentCapListFiles { instruction: 'list-file', description: string }",
      "export interface AgentCapWriteFile { instruction: 'write-file', filename: string, content: string, description: string }",
      "export interface AgentCapReadFile { instruction: 'read-file', filename: string, description: string }",
      "export interface AgentCapRemoveFile { instruction: 'remove-file', filename: string, description: string }",
      "export interface AgentCapFinished { instruction: 'finished' }",
      "export type AgentCap = AgentCapListFiles | AgentCapReadFile | AgentCapRemoveFile | AgentCapWriteFile | AgentCapFinished;",
      '```',
      '',
      '## Guide: How to Write Main Code',
      getImplPrompt(param),
      '',
      '## Output File/Files Location',
      `Your implementation page and its component (if any components) must be created under folder ${param.target_implementation_folder_path}`,
      `The main page must have no-dependency props and located on file ${param.target_implementation_folder_path}/index.tsx`,
      'The rest of component can be create with any file name and component name within the same folder.',
      '',
      '## Utility File Guide',
      'If you are about to use environment variable or constants that have a chance for globally usage you should define the real value by yourself (dont give mockup create real value like "your-example-key") like example jwt secret key. Put the value on utility as a const so it can globally accessbile',
      'Before write a utility function make sure it isnt redundant check list utility first',
      `Utility file must be created under folder ${utility_relative_dir_path}`,
      '',
      '## Example Response',
      '',
      'Example #1',
      '```json',
      '{',
      '  "instruction": "list-file",',
      '  "description": "show list directory utility and I will decide next instruction based on list dir result"',
      '}',
      '```',
      '',
      'Example #2',
      '```json',
      '{',
      '  "instruction": "write-file",',
      `  "filename": "${param.target_implementation_folder_path}/index.tsx",`,
      '  "content": "```ts\nimport React, { useState, useEffect } from \'react\';\n\nexport default function ${param.page_name}Page = () => {\n  const [somestate, setSomeState] = useState<number>(0);\n  ...\n```",',
      `  "description": "create page index.tsx for ..."`,
      '}',
      '```',
      '',
      '## Response Format',
      'Your response format must be json code-fenced begin with ```json and type structure `AgentCap` like above without free text or any additional text, only json format. Content code inside AgentCap.content must be in typescript format without codefence',
    ].join('\n')
  });

  // console.log(session.list_message[0]?.content);
  // throw new Error(``)

  return {
    instruction: await runLoop(llm, session.id),
    llm,
    session
  };
}

async function runLoop(llm: ChatGPTLLM, session_id: string, error_message?: string): Promise<AgentCap> {
  const response: string = await llm.ask(error_message ?? `write plan for task described above!`, session_id);
  try {
    const x = JSON.parse(extractCodeBlocksAgent(response)) as AgentCap;
    return x;
  } catch (err: any) {
    const error = `There is an error on your plan response JSON format: ${err.toString()}`;
    console.log('ERR1', { error });
    return await runLoop(llm, session_id, error);
  }
}

export function extractCodeBlocksAgent(text: string) {
  return text.startsWith('```') ?
    (
      /```(?:json)\b/i.test(text)
      ? [...text.matchAll(/```(?:json)\s*([\s\S]*?)```/gi)]
        .map(m => m[1])
        .join('\n')
      : ''
    )
    : text;
}
