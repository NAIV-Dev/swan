import express, { Express, Request, Response, Router } from 'express';
import cors from 'cors';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { Program } from '@naiv/swan-dsl';
import { getEntryPointCode, getLoadingPage } from './sample-page';
import { bundleHTML, FileSource } from '@naiv/react-bundler';
import { generateFirstImplementationPlan } from './agent-mode/plan-preparation';
import path from 'path';
import { executePlanAndGetNextPlan } from './agent-mode/plan-execution-and-next';
import fs from 'fs';
import { ListDir } from './agent-mode/agent-capability';

export interface SystemParam {
  web_prefix?: string
  port?: number
  beforeStart?(): Promise<void>
  swan_content_string: string
  swan_result: Program
  llm_model?: string
}

export interface ServerConstructorParam {
  noCors?: boolean
  noTrustProxy?: boolean
  swanCwd: string
  llm_model?: string
}

export class SWANServer {
  public express: Express = express();
  private server_instance: Server<typeof IncomingMessage, typeof ServerResponse> | undefined;
  private constructor_param: ServerConstructorParam | undefined;
  private server_param: SystemParam | undefined;

  constructor(param?: ServerConstructorParam) {
    this.constructor_param = param;
  }

  private async getPageContentAndUtility(page_name: string, relative_implementation_folder_path: string, relative_utility_path: string, cwd: string): Promise<{ page_content: string, plugins: FileSource[]}> {
    const list_dir = [
      ...ListDir(relative_implementation_folder_path, cwd),
      ...ListDir(relative_utility_path, cwd)
    ];
    const page_file_index: number = list_dir.findIndex(f => f == `original-implementation/${page_name}/index.tsx`);
    if (page_file_index == -1) {
      throw new Error(`no main content file on implementation page ${page_name}`);
    }
    return {
      page_content: await fs.promises.readFile(path.resolve(cwd, list_dir[page_file_index] as string), 'utf-8'),
      plugins: await Promise.all(list_dir.filter((_, i) => i !== page_file_index).map(async f => ({
        path: `./${f}`,
        content: await fs.promises.readFile(path.resolve(cwd, f), 'utf-8')
      })))
    };
  }

  public async run(param: SystemParam): Promise<SWANServer> {
    this.server_param = param;
    if (!this.constructor_param?.noCors) {
      this.express.use(cors());
    }
    this.express.use(express.json({ limit: '5mb' }));
    if (!this.constructor_param?.noTrustProxy) {
      this.express.set('trust proxy', true);
    }
    if (param.beforeStart) {
      await param.beforeStart();
    }

    const cwd = this.constructor_param?.swanCwd || '.';
    const transpiled_implementation_folder_path = path.resolve(cwd, './__implementation__');
    const port = param?.port ?? process.env.PORT ?? 5349;

    this.express.get('/__page_status__', async (req: Request, res: Response) => {
      if (!req.query.name && !res.headersSent) {
        res.status(400).send('');
        return;
      }
      const page_name = req.query.name;
      const transpiled_page_file_path = path.resolve(transpiled_implementation_folder_path, `${page_name}.html`);
      if (fs.existsSync(transpiled_page_file_path)) {
        res.type('html').send(await fs.promises.readFile(transpiled_page_file_path, 'utf-8'));
        if (!res.headersSent) {
          res.status(200).send('');
        }
        return;
      }
      if (!res.headersSent) {
        res.status(503).send('');
      }
    });

    const router = Router();
    for (const page of (this.server_param?.swan_result.pages || [])) {
      const page_path = this.server_param?.swan_result.app.entry == page.name ? '/' : `/${page.name}`;
      console.log(`${page_path}: ${page.name}`);

      const relative_implementation_path = `original-implementation/${page.name}`;
      const realtive_utility_path = `utility`;
      const transpiled_page_file_path = path.resolve(transpiled_implementation_folder_path, `${page.name}.html`);
      router.get(page_path, async (req: Request, res: Response) => {
        if (fs.existsSync(transpiled_page_file_path)) {
          res.type('html').send(await fs.promises.readFile(transpiled_page_file_path, 'utf-8'));
          return;
        }

        const page_source = await bundleHTML(getEntryPointCode(), [{
          path: 'App.tsx',
          content: getLoadingPage(page.name)
        }], { node_modules_base_path: this.constructor_param?.swanCwd });
        res.type('html').send(page_source);

        // Start generating
        let impl_plan = await generateFirstImplementationPlan({
          page_name: page.name,
          target_implementation_folder_path: relative_implementation_path,
          blueprint: this.server_param?.swan_content_string || ''
        }, this.constructor_param!.llm_model);
        while (impl_plan.instruction.instruction != 'finished') {
          impl_plan = await executePlanAndGetNextPlan(page.name, impl_plan, cwd);
        }
        console.log('Finished');

        try {
          const implementation_files = await this.getPageContentAndUtility(page.name, relative_implementation_path, realtive_utility_path, cwd);
          const result_html = await bundleHTML(getEntryPointCode(`./${relative_implementation_path}/index.tsx`), [{
            path: `./${relative_implementation_path}/index.tsx`,
            content: implementation_files.page_content
          }, ...implementation_files.plugins], {
            node_modules_base_path: this.constructor_param?.swanCwd
          });
          await fs.promises.writeFile(transpiled_page_file_path, result_html);
          console.log(`Transpiled file created`);
        } catch (err: any) {
          console.error(err);
        }
      });
    }
    this.express!.use((this.server_param.web_prefix || '/'), router);
    this.server_instance = this.express.listen(port, () => {
      console.log(`\n⚡️[server]: Server is running at http://localhost:${port}`);
    });

    return this;
  }
}
