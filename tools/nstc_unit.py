import subprocess,re,sys,json
from bs4 import BeautifulSoup
B="https://arspb.nstc.gov.tw/NSCWebFront/modules/talentSearch/talentSearch.do"
CJ='data/nstc.cj'
def curl(args):
  p=subprocess.run(['curl','-sSL','-m','90','-c',CJ,'-b',CJ]+args,capture_output=True); return p.stdout.decode('utf-8','ignore')
curl([B])
units=[('FAB0','FAB0A063X'),('FAB0','FAB0000002'),('FAB0','FAB0DB09'),('FAB0','FAB0E023G'),('FAB0','FAB0AH00'),('FAB0','FAB0A063G'),
       ('FA07','FA07AH00'),('FA07','FA07AH01'),('FA07','FA07E014G'),('FAB9','FAB9220034'),('FAB9','FAB9C047'),('FAB9','FAB9060009'),('FAB9','FAB9E006')]
out=[]
for o2,o3 in units:
  data={'nameChi':'','sex':'','organ_1':'1','organ_2_1':o2,'organ_3_1':o3,'isSearch':'1','LANG':'chi','currentPage':'1','pageSize':'100','sortCondition':'','specCode':''}
  a=[]
  for k,v in data.items(): a+=['--data-urlencode',f'{k}={v}']
  h=curl(a+[B+'?action=initSearchList&LANG=chi'])
  s=BeautifulSoup(h,'html.parser')
  for tr in s.find_all('tr'):
    if tr.find('table'): continue
    a_=tr.find('a',href=re.compile('initBasic'))
    if not a_: continue
    cells=[re.sub(r'\s+',' ',c.get_text(' ',strip=True)) for c in tr.find_all(['td','th'],recursive=False)]
    out.append({'unit':o3,'cells':cells,'rsNo':re.search(r'rsNo=([0-9a-f]+)',a_['href']).group(1)})
  print(o3,sum(1 for x in out if x['unit']==o3),file=sys.stderr)
json.dump(out,open('data/nstc_units.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
