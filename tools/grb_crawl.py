import sys,os,json,time,re,collections
sys.path.insert(0,'tools')
import grb
SCH={'nuu':r'聯合大學|聯合工專|聯合技術學院','ncu':r'中央大學','nycu':r'交通大學|陽明'}
os.makedirs('data/grb',exist_ok=True)
def allrows(kw,host,po='',eo=''):
  out=[];page=1
  while True:
    d=grb.post('',kw,host,page,100,po,eo)
    if not d or 'obj' not in d: break
    out+=d['obj'] or []
    if page>=d.get('totalPages',1) or not d['obj']: break
    page+=1
  return out
for line in open('data/roster.tsv',encoding='utf-8'):
  sch,dept,name,title,url=line.rstrip('\n').split('\t')
  fn=f'data/grb/{sch}_{name}.json'
  if os.path.exists(fn): continue
  rec={'name':name,'school':sch}
  hosts=grb.post('/grouping/hostName',name) or []
  if not any(h.get('name')==name for h in hosts):
    rec['projects']=[]; rec['note']='GRB 查無以本人為主持人之計畫'
    json.dump(rec,open(fn,'w',encoding='utf-8'),ensure_ascii=False,indent=1); print(sch,name,'none',flush=True); continue
  ex=grb.post('/grouping/excuOrgan',name,name) or []
  po=grb.post('/grouping/planOrgan',name,name) or []
  rec['excuGroups']=ex; rec['planGroups']=po
  # identify baseSeq via school-matching executing orgs
  bs=collections.Counter()
  for e in ex:
    if re.search(SCH[sch],e['name']):
      for o in allrows(name,name,'',e['code']):
        for b in (o.get('baseSeqList') or [])[:1]: bs[b]+=1
  rec['baseSeq']=bs.most_common(1)[0][0] if bs else None
  # agency map
  agency={}
  for g in po:
    for o in allrows(name,name,g['code'],''):
      agency[o['id']]=g['name']
  exmap={}
  for e in ex:
    for o in allrows(name,name,'',e['code']):
      exmap[o['id']]=e['name']
  rows=allrows(name,name)
  keep=[]
  for o in rows:
    if name not in (o.get('hostNameList') or o.get('host1NameC') or []): continue
    if rec['baseSeq'] is not None and o.get('baseSeqList') and rec['baseSeq'] not in o['baseSeqList']: continue
    keep.append({'id':o['id'],'year':o.get('planYear'),'title':o.get('title'),'keyword':o.get('keyword'),'amount':o.get('planAmt'),'projkey':o.get('projkey'),
                 'agency':agency.get(o['id'],''),'excu':exmap.get(o['id'],''),'hosts':o.get('hostNameList'),'abstract':(o.get('abstractC') or '')[:300]})
  rec['projects']=keep
  json.dump(rec,open(fn,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
  print(sch,name,'bs',rec['baseSeq'],'rows',len(rows),'keep',len(keep),collections.Counter(k['agency'] for k in keep).most_common(6),flush=True)
  time.sleep(1)
