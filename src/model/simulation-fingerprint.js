import {createHash} from 'node:crypto';

function canonicalize(value){
 if(Array.isArray(value))return value.map(canonicalize);
 if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonicalize(value[key])]));
 return value;
}

export function simulationFingerprint(input){
 const {metadata,...simulationInput}=input??{};
 const canonical=JSON.stringify(canonicalize(simulationInput));
 return createHash('sha256').update(canonical).digest('hex').slice(0,16);
}
