import { buildCommand, printResult } from '../Command.ts';
export const statusCommand = buildCommand({name: 'status', description: 'Show status', suggestions:{arguments:{},options:{}}, action:async(options)=>{ printResult({status: 'ok'}, options, ()=>'ok'); }}); if(import.meta.main) await statusCommand.parse(Deno.args);
