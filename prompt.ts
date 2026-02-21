export interface ImplPromptParam {
  page_name: string
  target_implementation_folder_path: string
  blueprint: string
}

function codefence(code: string) {
  return `\`\`\`\n${code.trim()}\n\`\`\``;
}
export function getImplPrompt(param: ImplPromptParam) {
  return `
This is a system blueprint that will related to the task

${codefence(param.blueprint)}

Look at page "${param.page_name}" and its specification on the blueprint.

Your task: implement page "${param.page_name}" on react code typescript.

Each page on the blueprint represent the page path itself, let say there are a "page Dashboard", then you can navigate to the page on the path "/Dashboard". Except the entry point app, use root path "/" instead of the page name.

This is an example of my expectation how you will implement the page:

${codefence(`
import React, { useState, useEffect } from 'react';

export default function ${param.page_name}Page = () => {
  const [somestate, setSomeState] = useState<number>(0);

  useEffect(() => {
    // Some use effect
  }, []);

  return (
    // This is just example you should create your own html layout and class names
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
      // and the rest of the code
    </div>
  );
};
`)}

Do not import third party library, instead of other third party library use built-in alternative or just give mockup code/result.

IMPORTANT CODE STYLE:
- Use function declarations, not arrow functions, for all top-level functions and components.
- Use inline exports.
- Allowed:
  - export function X() {}
  - export default function X() {}
- Avoid:
  - const X = () => {}
  - export default X
  - separated exports.

please return only typescript code with code fence block without any other strings but typescript code!

`.trim();
}

// console.log(getImplPrompt({
//   page_name: "T_getProductList",
//   types_relative_path: "__flazy/__types__/api/T_getProductList.ts",
//   target_implementation_path: "__flazy/original-implementation/T_getProductList.ts",
//   types_content: `
// import { Response } from "express";
// import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
// import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
// import { Product } from '../model/table/Product'

// class ReturnType_0 {
//   @IsNotEmpty({ message: 'total cannot be empty' })
//   @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
//   @IsNumber({}, { message: 'total must be a number (decimal)' })
//   total!: number
//   @IsNotEmpty({ message: 'data cannot be empty' })
//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => Product)
//   data!: Product[]
// }

// export type T_getProductList = (request: {

// }, response: Response) => Promise<ReturnType_0>;

// export const method = 'get';
// export const url_path = '/product';
// export const alias = 'T_getProductList';
// export const is_streaming = false;
// `.trim(),
//   description: "get list of products",
//   model_files_list: [
//     '__flazy/__types__/model/Product.ts',
//     '__flazy/__types__/model/User.ts'
//   ]
// }))
