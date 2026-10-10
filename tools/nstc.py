import requests,json,time,sys,os,re
from bs4 import BeautifulSoup
B="https://arspb.nstc.gov.tw/NSCWebFront/modules/talentSearch/talentSearch.do"
S=requests.Session(); S.headers['User-Agent']='Mozilla/5.0 (research observatory)'
SCH={'nuu':'聯合大學','ncu':'中央大學','nycu':'交通大學'}
PHONE={'nuu':'382','ncu':'4227151','nycu':'5712121'}
import subprocess
CJ='data/nstc.cj'
def _curl(args):
  for i in range(5):
    p=subprocess.run(['curl','-sSL','-m','60','-c',CJ,'-b',CJ]+args,capture_output=True)
    if p.returncode==0 and p.stdout: return p.stdout.decode('utf-8','ignore')
    print('retry',p.stderr[:200],file=sys.stderr); time.sleep(3)
  return ''
def get(url): return _curl([url])
def post(url,data):
  a=[]
  for k,v in data.items(): a+=['--data-urlencode',f'{k}={v}']
  return _curl(a+[url])
def rows(html):
  s=BeautifulSoup(html,'html.parser'); out=[]
  for tr in s.find_all('tr'):
    if tr.find('table'): continue
    cells=tr.find_all(['td','th'],recursive=False)
    out.append(([re.sub(r'\s+',' ',c.get_text(' ',strip=True)) for c in cells],tr))
  return out
get(B)
out={}
os.makedirs('data/nstc',exist_ok=True)
for line in open('data/roster.tsv',encoding='utf-8'):
  sch,dept,name,title,url=line.rstrip('\n').split('\t')
  fn=f'data/nstc/{sch}_{name}.json'
  if os.path.exists(fn): continue
  h=post(B+'?action=initSearchList&LANG=chi',{'nameChi':name,'isSearch':'1','LANG':'chi','currentPage':'','pageSize':'100','sortCondition':'','specCode':'','sex':''})
  cands=[]
  for cells,tr in rows(h):
    a=tr.find('a',href=re.compile('initBasic'))
    if a and len(cells)>=3:
      cands.append({'cells':cells,'rsNo':re.search(r'rsNo=([0-9a-f]+)',a['href']).group(1)})
  pick=[c for c in cands if SCH[sch] in ' '.join(c['cells'])] or [c for c in cands if PHONE[sch] in ''.join(c['cells']).replace('-','')] or (cands if len(cands)==1 and name in ('吳岱芸',) else [])
  rec={'school':sch,'dept':dept,'name':name,'title':title,'profile':url,'candidates':[c['cells'] for c in cands]}
  if len(pick)>=1:
    rs=pick[0]['rsNo']; rec['rsNo']=rs; rec['nstc_row']=pick[0]['cells']
    basic=get(f'{B}?action=initBasic&rsNo={rs}&LANG=chi')
    rec['basic']=[c for c,_ in rows(basic) if any(c)]
    p=get(f'{B}?action=initRsm05&rsNo={rs}&LANG=chi')
    rec['pubs']=[c for c,_ in rows(p) if len(c)==5 and c[0]!='出版年月']
    q=get(f'{B}?action=initRsm17new&rsNo={rs}&LANG=chi')
    rec['projects']=[c for c,_ in rows(q) if len(c)==6 and c[0]!='年度']
  json.dump(rec,open(fn,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
  print(sch,name,'cands',len(cands),'pick',len(pick),'pubs',len(rec.get('pubs',[])),'proj',len(rec.get('projects',[])),flush=True)
  time.sleep(1.5)
