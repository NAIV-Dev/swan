import path from 'path';
import fs from 'fs';
import { SWANServer } from "../SWANServer";
import { parse } from '@naiv/swan-dsl';

export async function cmdRun(port: number, swan_cwd: string, apiurl: string, llm_model?: string) {
  const web_specs = path.resolve(swan_cwd, './web-specification.swan');
  if (!fs.existsSync(web_specs)) {
    throw new Error(`web-specification.swan is not found. Create new web specification with "swan --chat"`);
  }
  const working_directory = path.resolve(swan_cwd, './__swan');
  if (!fs.existsSync(working_directory)) {
    await fs.promises.mkdir(working_directory);
  }

  const program_nm_root = path.resolve(__dirname, '../../node_modules');
  const working_directory_nm_symlink = path.resolve(swan_cwd, './__swan/node_modules');
  if (fs.existsSync(working_directory_nm_symlink)) {
    await fs.promises.rm(working_directory_nm_symlink);
  }
  await fs.promises.symlink(program_nm_root, working_directory_nm_symlink);

  const source_implementation_path = path.resolve(swan_cwd, './__swan/original-implementation');
  if (!fs.existsSync(source_implementation_path)) {
    await fs.promises.mkdir(source_implementation_path);
  }

  const transpiled_implementation_path = path.resolve(swan_cwd, './__swan/__implementation__');
  if (!fs.existsSync(transpiled_implementation_path)) {
    await fs.promises.mkdir(transpiled_implementation_path);
  }

  const swan_content_string = await fs.promises.readFile(web_specs, 'utf-8');
  const res = parse(swan_content_string);
  await (new SWANServer({ swanCwd: working_directory, llm_model }).run({
    swan_result: res!,
    swan_content_string,
    port
  }));
}
