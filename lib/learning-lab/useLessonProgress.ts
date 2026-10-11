"use client";
import {useEffect,useState} from "react";
type Snapshot={index:number;completed:number[];missed:number[]};
export function useLessonProgress(key:string,total:number){
 const [progress,setProgress]=useState<Snapshot>({index:0,completed:[],missed:[]});
 const [ready,setReady]=useState(false);
 useEffect(()=>{let value:Snapshot={index:0,completed:[],missed:[]};try{const raw=window.localStorage.getItem("lfp-learning-v1:"+key);if(raw){const parsed=JSON.parse(raw) as Partial<Snapshot>;const valid=(items:unknown):number[]=>Array.isArray(items)?Array.from(new Set(items.filter((n):n is number=>Number.isInteger(n)&&n>=0&&n<total))):[];value={index:Number.isInteger(parsed.index)&&Number(parsed.index)>=0&&Number(parsed.index)<total?Number(parsed.index):0,completed:valid(parsed.completed),missed:valid(parsed.missed)};}}catch{}queueMicrotask(()=>{setProgress(value);setReady(true)});},[key,total]);
 useEffect(()=>{if(!ready)return;try{window.localStorage.setItem("lfp-learning-v1:"+key,JSON.stringify(progress))}catch{}},[key,progress,ready]);
 const record=(index:number,correct:boolean)=>setProgress(p=>({...p,completed:Array.from(new Set([...p.completed,index])),missed:correct?p.missed.filter(n=>n!==index):Array.from(new Set([...p.missed,index]))}));
 const go=(index:number)=>setProgress(p=>({...p,index:Math.min(Math.max(Math.trunc(index),0),total-1)}));
 const reset=()=>setProgress({index:0,completed:[],missed:[]});
 return {progress,ready,record,go,reset};
}
