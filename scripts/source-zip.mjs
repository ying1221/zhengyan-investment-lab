import {readFile,readdir,mkdir,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
const root=new URL('../',import.meta.url);
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
const crc32=b=>{let c=0xffffffff;for(const x of b)c=crcTable[(c^x)&255]^(c>>>8);return(c^0xffffffff)>>>0;};
export async function sourceZip(){
 const files=[];
 async function walk(dir){for(const e of await readdir(new URL(dir+'/',root),{withFileTypes:true})){const p=dir+'/'+e.name;if(e.isDirectory())await walk(p);else files.push(p);}}
 for(const dir of ['src','worker','scripts','tests','docs'])await walk(dir);
 files.push('package.json','package-lock.json','README.md','.env.example','.gitignore');files.sort();
 const entries=await Promise.all(files.map(async p=>[p,await readFile(new URL(p,root))]));
 entries.push(['.openai/hosting.json',Buffer.from(JSON.stringify({d1:null,r2:null},null,2))]);
 const chunks=[],central=[];let offset=0;
 for(const [path,data]of entries){const name=Buffer.from('zhengyan/'+path),crc=crc32(data),local=Buffer.alloc(30);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(20,4);local.writeUInt16LE(0x800,6);local.writeUInt16LE(0x5d56,12);local.writeUInt32LE(crc,14);local.writeUInt32LE(data.length,18);local.writeUInt32LE(data.length,22);local.writeUInt16LE(name.length,26);
 const c=Buffer.alloc(46);c.writeUInt32LE(0x02014b50);c.writeUInt16LE(20,4);c.writeUInt16LE(20,6);c.writeUInt16LE(0x800,8);c.writeUInt16LE(0x5d56,14);c.writeUInt32LE(crc,16);c.writeUInt32LE(data.length,20);c.writeUInt32LE(data.length,24);c.writeUInt16LE(name.length,28);c.writeUInt32LE(offset,42);chunks.push(local,name,data);central.push(c,name);offset+=30+name.length+data.length;}
 const center=Buffer.concat(central),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(center.length,12);end.writeUInt32LE(offset,16);const zip=Buffer.concat([...chunks,center,end]);
 await mkdir(new URL('artifacts/',root),{recursive:true});await writeFile(new URL('artifacts/证研-源码.zip',root),zip);return zip;
}
