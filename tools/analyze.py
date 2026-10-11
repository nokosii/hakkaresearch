import json,re,glob,os,datetime
BASE=os.environ.get('HKO_BASE','.')  # 工作目錄：需含 data/roster.tsv、data/nstc/、data/grb/、data/iteacher/、data/medal/、data/pages/
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
GX='https://www.hakka.gov.tw/userfiles/file/1141110%E6%9B%B4%E6%96%B0_%E5%AE%A2%E5%AE%B6%E8%B2%A2%E7%8D%BB%E7%8D%8E%E6%AD%B7%E5%B1%86%E5%BE%97%E4%B8%BB%E5%8F%8A%E4%BA%BA%E6%95%B8%E7%B5%B1%E8%A8%88_1.pdf'
AWARDS={
 '羅肇錦':[{'year':2017,'label':'2017 客家貢獻獎・終身貢獻獎','url':GX}],
 '張維安':[{'year':2017,'label':'2017 客家貢獻獎・傑出成就獎（學術、藝術、文創產業類）','url':GX},
          {'year':2025,'label':'2025 客家貢獻獎・終身貢獻獎','url':'https://www.cna.com.tw/postwrite/chi/417636'}],
 '張翰璧':[{'year':2025,'label':'2025 客家貢獻獎・傑出成就獎（研究發展類）','url':'https://www.cna.com.tw/postwrite/chi/417636'}],
}
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

import sys as _sys; _sys.path.insert(0,f'{BASE}/tools')
from pageproj import projects as page_projects
from bs4 import BeautifulSoup
CATS=['國科會','客委會','文化部','教育部','產學合作','地方政府','其他政府機關','校內計畫','其他']
def agency_cat(a):
  a=a or ''
  if re.search(r'產學',a): return '產學合作'
  if re.search(r'國科會|國家科學及技術委員會|科技部|國家科學委員會|\bNSC|MOST|NSTC',a): return '國科會'
  if re.search(r'縣政府|市政府|公所|客家事務局|縣客家|市客家|文化局|教育局|文觀局|研考會|縣立|市立|議會',a): return '地方政府'
  if re.search(r'客家委員會|客委會|客家文化發展中心|客發中心|客家文化中心|客家公共傳播',a): return '客委會'
  if re.search(r'文化部|文建會|文化資產局|臺灣文學館|台灣文學館|國家人權博物館|國立.{0,6}博物館|國家電影|國立傳統藝術中心|國家文化記憶庫|國立.{0,4}美術館|國立歷史博物館',a): return '文化部'
  if re.search(r'教育部|高等教育深耕|高教深耕|教學實踐|大學社會責任|USR|國家教育研究院',a): return '教育部'
  if re.search(r'行政院|經濟部|勞動部|勞工委員會|內政部|衛生福利部|農業部|農委會|交通部|外交部|僑務委員會|原住民族委員會|國家發展委員會',a): return '其他政府機關'
  if re.search(r'公司|企業|基金會|財團法人|社團法人|協會|學會|農會|銀行|股份|合作社|廣播電台|電視台|有限|工研院|資策會|顧問',a): return '產學合作'
  if re.search(r'校內|本校|協成型|校級|大學.{0,6}(研究計畫|補助)|學院.{0,4}計畫',a): return '校內計畫'
  if re.search(r'部|委員會|署|局|處|院|中心|館|政府',a): return '其他政府機關'
  return '其他'
def line_cat(l):
  c=agency_cat(l[-45:])
  return c if c!='其他' else agency_cat(l)
def normt(t): return re.sub(r'[\W_（）()「」《》〈〉：:，,、\s]+','',t or '').lower()
def roc2ad(y):
  try: y=int(str(y)[:3]) if len(str(y))>=7 else int(y)
  except: return None
  return y+1911 if y<1911 else y

STATUS_OVERRIDE={'張維安':'left'}  # 依維護者確認：已離職，職稱仍顯示榮譽教授
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

  # ---------- other (non-NSTC-talent) projects ----------
  other=[]; keys=set(normt(p['title'])[:24] for p in projs)
  def add(src,agency,cat,year,title,amount,url,extra=''):
    k=normt(title)[:24]
    if not k or len(k)<6: return
    if cat=='國科會': return
    nt=normt(title)
    for kk in keys:
      if kk==k or (len(kk)>=10 and kk in nt): return
    for kk,yy in seen_o:
      if (kk==k and (yy==year or src!='GRB')) or (src!='GRB' and len(kk)>=10 and kk in nt): return
    seen_o.add((k,year))
    txt=(title or '')+' '+(extra or '')
    kw=sorted(set(x.group(0) for x in HK.finditer(txt)))
    reason=list(kw)
    if cat=='客委會' or re.search('客家',agency or ''): reason=['主管機關：'+(agency or cat)]+reason
    hit=bool(reason)
    ik=[] if hit else sorted(set(x.group(0) for x in IND.finditer(txt)))
    other.append({'src':src,'agency':agency,'cat':cat,'year':year,'title':title,'amount':amount,'url':url,'hakka':hit,'kw':reason,'ind':bool(ik),'ikw':ik})
  seen_o=set()
  gf=f'{BASE}/data/grb/{sch}_{name}.json'
  if os.path.exists(gf):
    g=json.load(open(gf,encoding='utf-8'))
    for o in g.get('projects',[]):
      try: amt=int(float(o.get('amount') or 0)*1000)
      except: amt=0
      add('GRB',o.get('agency',''),agency_cat(o.get('agency','')),roc2ad(o.get('year')),o.get('title'),amt,
          f"https://www.grb.gov.tw/search/planDetail?id={o['id']}",(o.get('keyword') or ''))
  itf=f'{BASE}/data/iteacher/{name}.html'
  if sch=='ncu' and os.path.exists(itf):
    iturl=open(f'{BASE}/data/iteacher/{name}.url').read().strip()
    soup=BeautifulSoup(open(itf,encoding='utf-8').read(),'html.parser')
    plan=soup.find(id='nav-plan')
    if plan:
      cur=''
      for el in plan.find_all(['h5','li']):
        if el.name=='h5': cur=el.get_text(' ',strip=True); continue
        if cur in ('國科會計畫統計',''): continue
        sp=el.find_all('span')
        if not sp: continue
        t=sp[0].get_text(' ',strip=True); dt=sp[1].get_text(strip=True) if len(sp)>1 else ''
        kwx=sp[2].get_text(' ',strip=True) if len(sp)>2 else ''
        cat={'高教深耕計畫':'教育部','產學合作計畫統計':'產學合作'}.get(cur,'其他')
        ag={'高教深耕計畫':'教育部高等教育深耕計畫（校內登錄）','產學合作計畫統計':'產學合作計畫（中央大學教師履歷平台）','其他補助':'其他補助（中央大學教師履歷平台，未標示委託機關）'}.get(cur,cur)
        add('中央大學教師履歷平台',ag,cat,roc2ad(dt[:7]) if dt else None,t,0,iturl,kwx)
  pf=f'{BASE}/data/pages/{sch}_{name}.txt'
  if os.path.exists(pf):
    for l in page_projects(open(pf,encoding='utf-8').read()):
      m=re.search(r'(19|20)\d\d',l); yr=int(m.group(0)) if m else None
      if not m:
        m2=re.match(r'\s*(\d{2,3})\s*(學年度|年度|年)',l); yr=roc2ad(m2.group(1)) if m2 else None
      add('系所個人頁',l,line_cat(l),yr,l,0,url)
  supp=[l for l in supp if not any(l[:40] in (o['title'] or '') for o in other if o['src']=='系所個人頁')]
  medals=[]
  for m in MEDALS:
    t=MT[m['file']]
    if name in t:
      g=grade_of(t,name)
      medals.append({'year':m['year'],'label':f"{m['year']-1911}年客家事務專業獎章"+(f"（{g}）" if g else ''),'url':m['url']})
  awards=AWARDS.get(name,[])
  her=heritage_manual.get(pid,{})
  hp_=[p for p in pubs if p['hakka']]; hj=[p for p in projs if p['hakka']]; ho=[p for p in other if p['hakka']]
  bycat={c:0 for c in CATS}
  for p in hj: bycat['國科會']+=1
  for p in ho: bycat[p['cat']]+=1
  rec5=[p for p in hp_ if p['year'] and p['year']>=2021]
  people.append({
    'id':pid,'school':sch,'dept':dept,'name':name,'title':title or ntitle,'nstcTitle':ntitle,'nstcOrg':norg,
    'profile':url,'nstc':(f"{NSTC}?action=initBasic&rsNo={d['rsNo']}&LANG=chi" if d.get('rsNo') else None),
    'nstcPubs':(f"{NSTC}?action=initRsm05&rsNo={d['rsNo']}&LANG=chi" if d.get('rsNo') else None),
    'nstcProj':(f"{NSTC}?action=initRsm17new&rsNo={d['rsNo']}&LANG=chi" if d.get('rsNo') else None),
    'pubs':pubs,'projects':projs,'otherProjects':other,'status':STATUS_OVERRIDE.get(name) or ('left' if ('離職' in title or '非現任' in title) else ('retired' if ('退休' in title or '榮譽' in title) else 'active')),'supp':supp,'medals':medals,'awards':awards,
    'heritage':her,
    'stats':{'pubs':len(pubs),'hakkaPubs':len(hp_),'hakkaPubs5y':len(rec5),'projects':len(projs),'hakkaProjects':len(hj)+len(ho),'hakkaNstcProjects':len(hj),'hakkaOtherProjects':len(ho),'otherProjects':len(other),'hakkaProjByCat':bycat,
             'hakkaProjAmt':sum(p['amount'] for p in hj)+sum(p['amount'] for p in ho),'supp':len(supp),'indPubs':sum(1 for p in pubs if p['ind']),'indProjects':sum(1 for p in projs if p['ind']),
             'share':(round(len(hp_)/len(pubs)*100,1) if pubs else None)}
  })
out={'generated':datetime.date.today().isoformat(),'schools':SCHOOLS,'people':people,
     'keywords':HK.pattern,'projCats':CATS,'indKeywords':IND.pattern,'awardSources':[{'label':'客家委員會〈歷屆客家貢獻獎得主及人數統計〉（2025年11月10日更新）','url':GX}],'medalSources':[{'label':m['label'],'url':m['url']} for m in MEDALS]+[{'label':'111年客家事務專業獎章名單（三校教師無人在列）','url':'https://www.cna.com.tw/postwrite/chi/318666'}]}
os.makedirs(f'{BASE}/site',exist_ok=True)
open(f'{BASE}/site/data.js','w',encoding='utf-8').write('window.HKO_DATA='+json.dumps(out,ensure_ascii=False)+';\n')
json.dump(out,open(f'{BASE}/site/data.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
# summary
for s in SCHOOLS:
  P=[p for p in people if p['school']==s]
  print(s,len(P),'withHakkaPub',sum(1 for p in P if p['stats']['hakkaPubs']),'hakkaPubs',sum(p['stats']['hakkaPubs'] for p in P),'/',sum(p['stats']['pubs'] for p in P),'hakkaProj',sum(p['stats']['hakkaProjects'] for p in P),'/',sum(p['stats']['projects'] for p in P),'medal',sum(1 for p in P if p['medals']))
