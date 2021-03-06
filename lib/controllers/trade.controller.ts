import axios from "axios";
import select from "../services/select.service";
import insert from "../services/insert.service";
import { Request, Response } from "express";

function checkSize(obj:object[], name:string):string{
  if(obj.length < 1){
    return `${name} must provide at least one pokemon`;
  }else if(obj.length > 6){
    return `${name} must provide a maximum of 6 pokemons`
  }
  return "";
}
  
// get base experience
async function getBaseExp(id:number):Promise<number>{
  const resp = await axios.get(`https://${process.env.POKEURI}` + id);
  return resp.data.base_experience;
}
  
async function sumValues(val:object):Promise<number>{
  let sum = 0;

  for(const i in val){
    sum += await getBaseExp(val[i].id);
  }
  return sum;
}
  
async function checkFairness(p1:Object, p2:Object):Promise<string>{
  let result = 0;
  const p1Sum:number = await sumValues(p1);
  const p2Sum:number = await sumValues(p2);
  
  if(p1Sum > p2Sum){
    result = p1Sum - p2Sum;
  }else{
    result = p2Sum - p1Sum;
  }
  
  const output = `p1 exp ${p1Sum} | p2 exp ${p2Sum}`
  return (result <= 10) ? `Fair: ${output}` : `Not fair: ${output}`;
}

export const tradeList = function(req:Request, res:Response):void{
  try{
    select((e:any):void => {
      console.log(e);
      res.status(200).json(e);
    });
  }catch(err:any){
    res.status(500).json(err);
  }
}

export const tradeCheck = async function(req:Request, res:Response):Promise<void> {
  // variables to use as example in case none is given
  const p1Ex:object = [
    {"id": 1},
    {"id": 2}
  ];
    
  const p2Ex:object = [
    {"id": 3},
    {"id": 4}
  ];
  
  const user1:string = req.body.users.p1.name ? req.body.users.p1.name : "p1";
  const user2:string = req.body.users.p2.name ? req.body.users.p2.name : "p2";
  const p1:object[] = req.body.users.p1.pokemons ? req.body.users.p1.pokemons : p1Ex;  
  const p2:object[] = req.body.users.p2.pokemons ? req.body.users.p2.pokemons : p2Ex;
  
  try{
    let p1Check:string = checkSize(p1, "p1");
    let p2Check:string = checkSize(p2, "p2");  
    
    // checking size between 1 and 6
    if(p1Check || p2Check){
      res.status(400).json(p1Check + " " + p2Check);
      return;
    }
    
    let fair:string = await checkFairness(p1, p2);
  
    if(fair){
      insert([user1, user2], [p1, p2], fair);
      res.status(200).json(fair);
    }
    else{ throw 0; }
  }catch(err:any){
    res.status(500).json(`Error: ${err}`);
  }    
}