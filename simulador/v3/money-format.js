/* Formatação monetária brasileira para os campos do simulador */
(function(root){
 function parseMoneyValue(value){
  if(typeof value==='number')return Number.isFinite(value)?value:0;
  let text=String(value??'').trim().replace(/\s|R\$/g,'');
  if(!text)return 0;
  if(text.includes(','))text=text.replace(/\./g,'').replace(',','.');
  else if(/^-?\d{1,3}(?:\.\d{3})+$/.test(text))text=text.replace(/\./g,'');
  const parsed=Number(text.replace(/[^0-9.-]/g,''));
  return Number.isFinite(parsed)?parsed:0;
 }

 function formatMoneyValue(value){
  const parsed=parseMoneyValue(value);
  return parsed.toLocaleString('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2});
 }

 function setMoneyInputValue(target,value){
  const el=typeof target==='string'?document.getElementById(target):target;
  if(!el)return;
  if(value==null||value===''){el.value='';return}
  el.value=formatMoneyValue(value);
 }
 function formatMoneyInput(el){
  if(!el||String(el.value).trim()==='')return;
  el.value=formatMoneyValue(el.value);
 }
 function refreshMoneyInputs(includeActive=false){
  if(typeof document==='undefined')return;
  document.querySelectorAll('.money input').forEach(el=>{if(includeActive||document.activeElement!==el)formatMoneyInput(el)});
 }
 function initMoneyInputs(){
  if(typeof document==='undefined')return;
  document.querySelectorAll('.money input').forEach(el=>{
   if(el.dataset.moneyFormatted==='1')return;
   el.dataset.moneyFormatted='1';el.type='text';el.inputMode='decimal';el.autocomplete='off';
   el.addEventListener('blur',()=>formatMoneyInput(el));
   formatMoneyInput(el);
  });
 }

 root.parseMoneyValue=parseMoneyValue;
 root.formatMoneyValue=formatMoneyValue;
 root.setMoneyInputValue=setMoneyInputValue;
 root.refreshMoneyInputs=refreshMoneyInputs;
 root.initMoneyInputs=initMoneyInputs;
 if(typeof document!=='undefined')initMoneyInputs();
 if(typeof module!=='undefined'&&module.exports)module.exports={parseMoneyValue,formatMoneyValue};
})(typeof window!=='undefined'?window:globalThis);
