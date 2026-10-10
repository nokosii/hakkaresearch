import json,re,glob,os,datetime
BASE=os.environ.get('HKO_BASE','.')  # 工作目錄：需含 data/roster.tsv、data/nstc/、data/medal/、data/pages/
HK=re.compile(r'客家|客語|客庄|客莊|客籍|客話|客方言|客屬|客底|客委會|客\s*‧\s*觀|Hakka|HAKKA|hakka|六堆|義民(爺|廟|祭|信仰|節)|伯公|四縣(腔|客)|海陸(腔|客)|大埔(腔|客)|饒平(腔|客)|詔安(腔|客)|桐花祭')
IND=re.compile(r'閩客|原客|客原|桐花|擂茶|哈客|鍾肇政|吳濁流|李喬|仙四師爺|大漢之音|美濃|新埔|北埔|峨眉|關西鎮|關西仙草|新竹關西|南庄|卓蘭|東勢|竹東|內灣|三義|銅鑼|龍潭|楊梅|芎林|橫山|內埔|竹田|萬巒|新屋|頭份')
SCHOOLS={'nuu':{'name':'國立聯合大學','college':'客家研究學院','short':'聯大'},
         'ncu':{'name':'國立中央大學','college':'客家學院','short':'中央'},
         'nycu':{'name':'國立陽明交通大學','college':'客家文化學院','short':'陽明交大'}}
NSTC='https://arspb.nstc.gov.tw/NSCWebFront/modules/talentSearch/talentSearch.do'
# medals
MEDALS=[
 {'year':2023,'label':'112年客家事務專業獎章（三等）','url':'https://cloud.hakka.gov.tw/Details?p=86107&pid=906892625','file':'m3.txt','grade_from':'三等(計71位)'},
 {'year':2025,'label':'114年客家事務專業獎章','url':'https://www.hakka.gov.tw/chhakka/app/data/view?module=hotnews&id=25&serno=5a365d62-8a93-4f8c-9e2d-91e48bd82076','file':'m4.txt'},
]
def medal_text(m): return open(f'{BASE}/data/medal/{m["file"]}',encoding='utf-8').read()
MT={m['file']:medal_text(m) for m in MEDALS}
def grade_of(text,name):
  i=text.find(name)
  if i<0: return None
  best=None
  for g in ['一等','二等','三等']:
    j=text.rfind(g,0,i)
    if j>=0 and (best is None or j>best[1]): best=(g,j)
  return best[0] if best else ''
heritage_manual={}
hp=f'{BASE}/data/heritage.json'
if os.path.exists(hp): heritage_manual=json.load(open(hp,encoding='utf-8'))
people=[]
for line in open(f'{BASE}/data/roster.tsv',encoding='utf-8'):
  sch,dept,name,title,url=line.rstrip('\n').split('\t')
  d=json.load(open(f'{BASE}/data/nstc/{sch}_{name}.json',encoding='utf-8'))
  pid=f'{sch}-{name}'
  pubs=[];projs=[]
  seenp=set()
  for p in d.get('pubs',[]):
    ym,kind,ttl,auth,src=p
    key=(re.sub(r'[\W_]+','',ttl).lower(),ym[:4])
    if key in seenp: continue
    seenp.add(key)
    m=HK.findall(ttl+' '+src)
    hit=bool(HK.search(ttl+' '+src))
    kw=sorted(set(x.group(0) for x in HK.finditer(ttl+' '+src)))
    y=re.match(r'(\d{4})',ym); y=int(y.group(1)) if y else None
    ik=[] if hit else sorted(set(x.group(0) for x in IND.finditer(ttl+' '+src)))
    pubs.append({'ym':ym,'year':y,'type':kind,'title':ttl,'authors':auth,'source':src,'hakka':hit,'kw':kw,'ind':bool(ik),'ikw':ik})
  seenj=set()
  for p in d.get('projects',[]):
    yr,kind,field,ttl,role,amt=p
    if tuple(p) in seenj: continue
    seenj.add(tuple(p))
    kw=sorted(set(x.group(0) for x in HK.finditer(ttl)))
    hit=(field=='客家研究') or bool(kw)
    if field=='客家研究': kw=['學門：客家研究']+kw
    try: a=int(amt.replace(',',''))
    except: a=0
    try: yy=int(yr)
    except: yy=None
    ik=[] if hit else sorted(set(x.group(0) for x in IND.finditer(ttl)))
    projs.append({'year':yy,'type':kind,'field':field,'title':ttl,'role':role,'amount':a,'hakka':hit,'kw':kw,'ind':bool(ik),'ikw':ik})
  # nstc title
  ntitle=''; norg=''
  for b in d.get('basic',[]):
    if b and b[0]=='職稱' and len(b)>1: ntitle=b[1]
    if b and b[0]=='服務機關' and len(b)>1: norg=b[1]
  # personal page supplementary
  supp=[]
  tp=f'{BASE}/data/pages/{sch}_{name}.txt'
  if os.path.exists(tp) and sch!='ncu':
    seen=set()
    for l in open(tp,encoding='utf-8'):
      l=l.strip()
      if len(l)<12 or len(l)>400: continue
      if not re.search(r'(19|20)\d\d',l): continue
      if name not in l and not re.search(r'[A-Z][a-z]+',l): continue
      if HK.search(l) and l not in seen:
        seen.add(l); supp.append(l)
  medals=[]
  for m in MEDALS:
    t=MT[m['file']]
    if name in t:
      g=grade_of(t,name)
      medals.append({'year':m['year'],'label':f"{m['year']-1911}年客家事務專業獎章"+(f"（{g}）" if g else ''),'url':m['url']})
  her=heritage_manual.get(pid,{})
  hp_=[p for p in pubs if p['hakka']]; hj=[p for p in projs if p['hakka']]
  rec5=[p for p in hp_ if p['year'] and p['year']>=2021]
  people.append({
    'id':pid,'school':sch,'dept':dept,'name':name,'title':title or ntitle,'nstcTitle':ntitle,'nstcOrg':norg,
    'profile':url,'nstc':(f"{NSTC}?action=initBasic&rsNo={d['rsNo']}&LANG=chi" if d.get('rsNo') else None),
    'nstcPubs':(f"{NSTC}?action=initRsm05&rsNo={d['rsNo']}&LANG=chi" if d.get('rsNo') else None),
    'nstcProj':(f"{NSTC}?action=initRsm17new&rsNo={d['rsNo']}&LANG=chi" if d.get('rsNo') else None),
    'pubs':pubs,'projects':projs,'supp':supp,'medals':medals,
    'heritage':her,
    'stats':{'pubs':len(pubs),'hakkaPubs':len(hp_),'hakkaPubs5y':len(rec5),'projects':len(projs),'hakkaProjects':len(hj),
             'hakkaProjAmt':sum(p['amount'] for p in hj),'supp':len(supp),'indPubs':sum(1 for p in pubs if p['ind']),'indProjects':sum(1 for p in projs if p['ind']),
             'share':(round(len(hp_)/len(pubs)*100,1) if pubs else None)}
  })
out={'generated':datetime.date.today().isoformat(),'schools':SCHOOLS,'people':people,
     'keywords':HK.pattern,'indKeywords':IND.pattern,'medalSources':[{'label':m['label'],'url':m['url']} for m in MEDALS]+[{'label':'111年客家事務專業獎章名單（三校教師無人在列）','url':'https://www.cna.com.tw/postwrite/chi/318666'}]}
os.makedirs(f'{BASE}/site',exist_ok=True)
open(f'{BASE}/site/data.js','w',encoding='utf-8').write('window.HKO_DATA='+json.dumps(out,ensure_ascii=False)+';\n')
json.dump(out,open(f'{BASE}/site/data.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
# summary
for s in SCHOOLS:
  P=[p for p in people if p['school']==s]
  print(s,len(P),'withHakkaPub',sum(1 for p in P if p['stats']['hakkaPubs']),'hakkaPubs',sum(p['stats']['hakkaPubs'] for p in P),'/',sum(p['stats']['pubs'] for p in P),'hakkaProj',sum(p['stats']['hakkaProjects'] for p in P),'/',sum(p['stats']['projects'] for p in P),'medal',sum(1 for p in P if p['medals']))
