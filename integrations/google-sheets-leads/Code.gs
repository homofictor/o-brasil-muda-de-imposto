const SHEET_LEADS='Leads';
const SHEET_DASH='Painel';

function doGet(){
  return json_({ok:true,service:'google-sheets-leads'});
}

function doPost(e){
  try{
    const body=JSON.parse(e.postData?.contents||'{}');
    const clean=(v,max)=>String(v??'').trim().slice(0,max);
    const email=clean(body.email,160);
    const profile=clean(body.profile,80);

    if(!email||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return json_({ok:false,error:'E-mail inválido'});
    if(!profile)return json_({ok:false,error:'Perfil ausente'});
    if(body.consent!==true)return json_({ok:false,error:'Consentimento ausente'});

    const ss=SpreadsheetApp.getActiveSpreadsheet();
    let sheet=ss.getSheetByName(SHEET_LEADS);
    if(!sheet)sheet=createLeadsSheet_(ss);

    sheet.appendRow([
      new Date(),
      clean(body.name,100),
      email,
      clean(body.whatsapp,30),
      clean(body.company,120),
      profile,
      clean(body.source,120),
      'Sim',
      clean(body.submittedAt,40),
      'Novo'
    ]);

    refreshDashboard_(ss);
    return json_({ok:true});
  }catch(err){
    return json_({ok:false,error:String(err&&err.message||err)});
  }
}

function setup(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss.getSheetByName(SHEET_LEADS))createLeadsSheet_(ss);
  if(!ss.getSheetByName(SHEET_DASH))createDashboard_(ss);
  refreshDashboard_(ss);
}

function createLeadsSheet_(ss){
  const sh=ss.insertSheet(SHEET_LEADS);
  sh.getRange(1,1,1,10).setValues([[
    'Recebido em','Nome','E-mail','WhatsApp','Empresa',
    'Perfil','Origem','Consentimento','Data enviada pelo site','Status'
  ]]);
  sh.setFrozenRows(1);
  sh.getRange('A1:J1').setFontWeight('bold');
  sh.autoResizeColumns(1,10);
  return sh;
}

function createDashboard_(ss){
  const sh=ss.insertSheet(SHEET_DASH,0);
  sh.getRange('A1:B1').setValues([['Indicador','Valor']]).setFontWeight('bold');
  sh.getRange('A2:A8').setValues([
    ['Leads totais'],
    ['Empresários ou gestores'],
    ['Contadores'],
    ['Consultores'],
    ['Com WhatsApp'],
    ['Último contato'],
    ['Novos ainda não tratados']
  ]);
  sh.setFrozenRows(1);
  sh.autoResizeColumns(1,2);
  return sh;
}

function refreshDashboard_(ss){
  const leads=ss.getSheetByName(SHEET_LEADS)||createLeadsSheet_(ss);
  const dash=ss.getSheetByName(SHEET_DASH)||createDashboard_(ss);
  const lastRow=leads.getLastRow();
  const rows=lastRow>1?leads.getRange(2,1,lastRow-1,10).getValues():[];
  const profile=i=>String(rows[i][5]||'').toLowerCase();

  const total=rows.length;
  const empresarios=rows.filter((_,i)=>profile(i).includes('empresário')||profile(i).includes('empresario')||profile(i).includes('gestor')).length;
  const contadores=rows.filter((_,i)=>profile(i).includes('contador')).length;
  const consultores=rows.filter((_,i)=>profile(i).includes('consultor')).length;
  const whatsapp=rows.filter(r=>String(r[3]||'').trim()!=='').length;
  const last=rows.length?rows[rows.length-1][0]:'';
  const novos=rows.filter(r=>String(r[9]||'').toLowerCase()==='novo').length;

  dash.getRange('B2:B8').setValues([[total],[empresarios],[contadores],[consultores],[whatsapp],[last],[novos]]);
  if(last)dash.getRange('B7').setNumberFormat('dd/mm/yyyy hh:mm');
  dash.autoResizeColumns(1,2);
}

function json_(obj){
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}