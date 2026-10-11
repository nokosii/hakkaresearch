import subprocess,json,sys,urllib.parse,time
F="b=&queryType=GRB05&projNums=&planYearSt=82&planYearEn=115&actYearSt=82&actYearEn=115&planAmtSt=&planAmtEn=&memberKeywordScope=0&organKeywordScope=0&researchAttrs=&researchTypes=&researchFields=&researchFields2=&openDataTopics=&openDataServices=&openDataSources=&openDatas=&planOrgans=&excuOrgans=&opgrs=&edus=&grpPlanYear=&grpPlanAmt=&grpResearchField=&grpPlanOrgan={po}&grpExcuOrgan={eo}&grpHostName={host}&nowPage={page}&rowsPerPage={rows}&orderType=SIMILARITY&codeWiat1=true&codeWiat2=true&codeWiat3=true&techName=true&techDesc=true&baseSeq=&organCode=&trl1=false&trl2=false&trl3=false&trl4=false&trl5=false&trl6=false&trl7=false&trl8=false&trl9=false&trl0=false"
CJ='data/grb.cj'
def post(ep,kw,host='',page=1,rows=100,po='',eo=''):
  body='keyword='+urllib.parse.quote(kw)+'&'+F.format(host=urllib.parse.quote(host),page=page,rows=rows,po=urllib.parse.quote(po),eo=urllib.parse.quote(eo))
  for i in range(4):
    p=subprocess.run(['curl','-sS','-m','120','-c',CJ,'-b',CJ,'-X','POST','https://grbdef.stpi.niar.org.tw/searcher'+ep,'-H','Origin: https://www.grb.gov.tw','-H','Referer: https://www.grb.gov.tw/','-H','Accept: application/json, text/plain, */*','-H','Content-Type: application/x-www-form-urlencoded;charset=UTF-8','--data-raw',body],capture_output=True)
    if p.returncode==0 and p.stdout:
      try: return json.loads(p.stdout)
      except Exception: pass
    time.sleep(3)
  return None
if __name__=='__main__':
  kw=sys.argv[1]; host=sys.argv[2] if len(sys.argv)>2 else ''
  print(json.dumps(post('/grouping/hostName',kw),ensure_ascii=False)[:300])
  d=post('',kw,host)
  print(d['totalRows'] if d else None)
  for o in (d or {}).get('obj') or []: print(o.get('planYear'),o.get('host1NameC'),o.get('planOrganName'),o.get('title')[:60])
