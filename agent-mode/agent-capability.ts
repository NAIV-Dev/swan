import path from "path"
import fs from 'fs';

export interface AgentCapListFiles {
  instruction: 'list-file'
  description: string
}

export interface AgentCapWriteFile {
  instruction: 'write-file'
  filename: string
  content: string
  description: string
}

export interface AgentCapReadFile {
  instruction: 'read-file'
  filename: string
  description: string
}

export interface AgentCapRemoveFile {
  instruction: 'remove-file'
  filename: string
  description: string
}

export interface AgentCapFinished {
  instruction: 'finished'
}

export type AgentCap = AgentCapListFiles
  | AgentCapReadFile
  | AgentCapRemoveFile
  | AgentCapWriteFile
  | AgentCapFinished;

export const utility_relative_dir_path = `utility`;

export async function executeAgentCapability(page_name: string, cap: AgentCap, cwd: string): Promise<string> {
  console.log(`execute ${cap.instruction} - ${(cap as any).description || ''}`);
  const page_relative_dir_path = `original-implementation/${page_name}`;
  const utility_abs_dir_path = path.resolve(cwd, utility_relative_dir_path);
  const page_abs_dir_path = path.resolve(cwd, page_relative_dir_path);

  switch (cap.instruction) {
    case "read-file":
    case "remove-file":
    case "write-file":
      if (!cap.filename.startsWith(utility_relative_dir_path) && !cap.filename.startsWith(page_relative_dir_path)) {
        throw new Error(`You are not allowed to do action on file outside folders: ${utility_relative_dir_path} or ${page_relative_dir_path}`);
      }
    case "list-file":
    case "finished":
  }

  if (!fs.existsSync(utility_abs_dir_path)) {
    await fs.promises.mkdir(utility_abs_dir_path);
  }
  if (!fs.existsSync(page_abs_dir_path)) {
    await fs.promises.mkdir(page_abs_dir_path);
  }
  switch (cap.instruction) {
    case "list-file":
      try {
        const list_dir = [
          ...ListDir(utility_abs_dir_path, cwd),
          ...ListDir(page_abs_dir_path, cwd)
        ];
        return list_dir.length == 0 ? 'Empty directory' : list_dir.join('\n');
      } catch (err: any) {
        throw new Error((err.toString() as string).replace(new RegExp(cwd, 'g'), ''));
      }
    case "read-file":
      return await fs.promises.readFile(path.resolve(cwd, cap.filename), 'utf-8');
    case "remove-file":
      await fs.promises.rm(path.resolve(cwd, cap.filename), { force: true });
      return `File ${cap.filename} deleted.`;
    case "write-file":
      await fs.promises.writeFile(path.resolve(cwd, cap.filename), cap.content);
      return `File ${cap.filename} successfully created.`;
    case "finished":
      return 'Finished.';
  }
}

export function ListDir(target_path: string, cwd: string): string[] {
  function getAllFilesRecursive(dirPath: string, excludedFolders = new Set()): string[] {
    let filesList: string[] = [];

    // Check if the current directory should be excluded
    const folderName = path.basename(dirPath);
    if (excludedFolders.has(folderName)) {
      return filesList; // Skip this directory and all its contents
    }

    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const file of files) {
      const fullPath = path.join(dirPath, file.name);

      if (file.isDirectory()) {
        // Recursively call the function for subdirectories
        filesList = filesList.concat(getAllFilesRecursive(fullPath, excludedFolders));
      } else {
        // Add the file to the list
        filesList.push(fullPath.replace(/\"/g, ''));
      }
    }

    return filesList;
  }

  const foldersToExclude = new Set(['node_modules', '.git', '.cache']);
  return getAllFilesRecursive(path.resolve(cwd, target_path), foldersToExclude).map(p => p.replace(cwd.endsWith('/') ? cwd : (cwd + '/'), ''));
}
