import subprocess,json,re,os,sys,time
CJ='data/it.cj'
def curl(args):
  for i in range(4):
    p=subprocess.run(['curl','-sSL','-m','60','-c',CJ,'-b',CJ]+args,capture_output=True)
    if p.returncode==0 and p.stdout: return p.stdout.decode('utf-8','ignore')
    time.sleep(3)
  return ''
os.makedirs('data/iteacher',exist_ok=True)
h=curl(['https://cis.ncu.edu.tw/iTeacher/home'])
tok=re.search(r'"_token" : "([^"]+)"',h).group(1)
for line in open('data/roster.tsv',encoding='utf-8'):
  sch,dept,name,title,url=line.rstrip('\n').split('\t')
  if sch!='ncu': continue
  fn=f'data/iteacher/{name}.html'
  if os.path.exists(fn): continue
  r=curl(['-X','POST','https://cis.ncu.edu.tw/iTeacher/cardList','--data-urlencode',f'q={name}','-d','page=1','--data-urlencode',f'_token={tok}','-H','X-Requested-With: XMLHttpRequest'])
  try: d=json.loads(r)
  except Exception: print(name,'bad',r[:200]); continue
  c=[x for x in d.get('data',[]) if x.get('info',{}).get('Name')==name or name in json.dumps(x,ensure_ascii=False)[:400]]
  if not c: print(name,'nocard',[x.get('info',{}).get('Name') for x in d.get('data',[])]); continue
  pid=c[0]['info']['PersonalNoEncode']
  page=curl([f'https://cis.ncu.edu.tw/iTeacher/home/{pid}'])
  open(fn,'w',encoding='utf-8').write(page)
  open(f'data/iteacher/{name}.url','w').write(f'https://cis.ncu.edu.tw/iTeacher/home/{pid}')
  print(name,pid,len(page),flush=True); time.sleep(1)
