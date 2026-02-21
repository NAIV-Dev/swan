#!/usr/bin/env node
import { cmdChat } from "./command/cmd-chat";
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs';
import { cmdRun } from "./command/cmd-run";

const argv = yargs(hideBin(process.argv))
  .option("run", {
    type: "string",
    requiresArg: false,
    coerce: val => val === "" ? '.' : val
  })
  .option("port", {
    type: "number",
    requiresArg: false,
  })
  .option("apiurl", {
    type: "string",
    requiresArg: false
  })
  .option("chat", {
    type: "boolean",
    requiresArg: false
  })
  .option("model", {
    type: "string",
    requiresArg: false
  })
  .parse() as { chat?: boolean, run?: string, apiurl?: string, port?: number, model?: string };

const dir_path = argv.run || '';
const port = argv.port || 5349;
const api_url = argv.apiurl;
const chat_mode = argv.chat;
const llm_model = argv.model;

if ((dir_path && chat_mode) || (!dir_path && !chat_mode)) {
  console.error([
    'Wrong usage!',
    'You must choose one mode --run or --chat',
    '',
    'Example:',
    '# starts naiv specification mode',
    'swan --chat',
    '',
    '# run current working directory',
    'swan --run --apiurl "https://api.mywebsite.com"',
    '',
    '# run myfolder directory',
    'swan --run myfolder --apiurl "https://api.mywebsite.com"',
    '',
  ].join('\n'));
  process.exit(1);
}

if (dir_path) {
  if (!api_url) {
    console.error([
      'Wrong usage!',
      'swan --run must have --apiurl argument',
      '',
      'Example:',
      '# run current working directory',
      'swan --run --apiurl "https://api.mywebsite.com"',
      '',
      '# run myfolder directory',
      'swan --run myfolder --apiurl "https://api.mywebsite.com"',
      '',
    ].join('\n'));
    process.exit(1);
  }
  cmdRun(port, dir_path, api_url, llm_model);
} else if (chat_mode) {
  cmdChat(llm_model).catch(console.error);
}
