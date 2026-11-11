import ts from 'typescript';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const base = process.env.VISUAL_BASE || '82d5ffd2e5be4d0d69bcd987a13e56f97750e7bf';
const files = execFileSync('git',['ls-tree','-r','--name-only',base],{encoding:'utf8'}).trim().split('\n');
const printer = ts.createPrinter({removeComments:true});
function normalize(source,path,accessible=false){
 const sf=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,path.endsWith('x')?ts.ScriptKind.TSX:ts.ScriptKind.TS);
 const transformed=ts.transform(sf,[ctx=>root=>ts.visitNode(root,function visit(n){
  if(ts.isJsxAttribute(n)&&['className','style','data-drivecar-ui','data-drivecar-auth'].includes(n.name.getText(sf)))return undefined;
  if(accessible&&ts.isJsxAttribute(n)&&(/^(aria-)/.test(n.name.getText(sf))||['role','htmlFor','autoComplete'].includes(n.name.getText(sf))||n.name.getText(sf)==='id'&&['components/ForcePasswordChangeModal.tsx','modules/auth/components/LoginForm.tsx'].includes(path)))return undefined;
  if(accessible&&ts.isVariableDeclaration(n)&&['selectCls','inputCls','labelCls','fieldClass','primaryClass','secondaryClass','tableThClass','tableTdClass'].includes(n.name.getText(sf))&&n.initializer&&ts.isStringLiteral(n.initializer))return ctx.factory.updateVariableDeclaration(n,n.name,n.exclamationToken,n.type,ctx.factory.createStringLiteral('[reviewed CSS class constant]'));
  if(accessible&&path==='modules/relatorios/components/RelatoriosQuickPreview.tsx'&&ts.isJsxElement(n)&&n.openingElement.tagName.getText(sf)==='style')return ctx.factory.updateJsxElement(n,n.openingElement,[],n.closingElement);
  return ts.visitEachChild(n,visit,ctx);
 })]);
 const out=printer.printFile(transformed.transformed[0]);transformed.dispose();return out;
}
const result={base,checked:0,unchanged:[],visualOnly:[],nonVisual:[],reviewedPresentation:[],missing:[]};
for(const file of files.filter(f=>/\.(tsx?|sql)$/.test(f)&&!f.startsWith('scripts/'))){
 const previous=execFileSync('git',['show',`${base}:${file}`],{encoding:'utf8',maxBuffer:8e6});let current;
 try{current=readFileSync(file,'utf8')}catch{result.missing.push(file);continue}
 result.checked++;
 if(previous===current) result.unchanged.push(file);
 else if(/\.tsx?$/.test(file)&&normalize(previous,file)===normalize(current,file)) result.visualOnly.push(file);
 else if(/\.tsx?$/.test(file)&&normalize(previous,file,true)===normalize(current,file,true))result.reviewedPresentation.push(file);
 else {result.nonVisual.push(file); mkdirSync('/tmp/dailabs-ast-diffs',{recursive:true});writeFileSync('/tmp/dailabs-ast-diffs/'+file.replaceAll('/','_')+'.before',normalize(previous,file));writeFileSync('/tmp/dailabs-ast-diffs/'+file.replaceAll('/','_')+'.after',normalize(current,file));}
}
mkdirSync('scratch/visual-qa',{recursive:true});writeFileSync('scratch/visual-qa/ast-parity.json',JSON.stringify(result,null,2));
console.log(JSON.stringify({...result,unchanged:result.unchanged.length},null,2));
if(result.nonVisual.length||result.missing.length)process.exitCode=1;
