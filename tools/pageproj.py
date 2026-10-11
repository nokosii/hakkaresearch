import re,glob,os
HDR_KW=re.compile(r'計畫|計劃|產學|委託|委辦|研究案|補助')
HDR_EX=re.compile(r'指導|審查|評審|亮點|學海|專題生|大專生|獎|成果發表|研討會|論文|著作|期刊')
YEAR_START=re.compile(r'^\s*[\(（【\[]?\s*((19|20)\d\d|\d{2,3}(\s*[-~～至]\s*\d{2,3})?\s*(學年度|年度|年))')
ITEM_OK=re.compile(r'計畫|計劃|委託|委辦|補助|產學|研究|調查|案|NSC|MOST|NSTC|主持|客家委員會|客委會|文化部|教育部|政府|基金會|公司')
ITEM_BAD=re.compile(r'審查|評論人|口試委員|評審|編輯|獎學金|榮譽|副主編|主編,|指導學生|擔任|講座|演講')
def strip_hdr(l):
  t=re.sub(r'^[\s◆■●▲★☆•\-–—#*【\[（(一二三四五六七八九十0-9、.．)）]+','',l)
  return re.sub(r'[】\]\s:：🏗\U0001F300-\U0001FAFF]+$','',t)
def is_hdr(l):
  t=strip_hdr(l)
  if not t or len(t)>24: return False
  if re.search(r'(19|20)\d\d|\d{3}-\d|NSC|MOST|NSTC|[《〈「]',l): return False
  return bool(HDR_KW.search(t)) and not HDR_EX.search(t)
def is_end(l):
  if YEAR_START.match(l): return False
  if l.startswith('【') or l.startswith('['):
    inner=l[1:l.find('】')] if '】' in l else l[1:30]
    return not HDR_KW.search(inner)
  return len(l)<=24 and not re.search(r'(19|20)\d\d',l)
def projects(txt):
  L=[l.strip() for l in txt.split('\n')]
  out=[];on=False
  for l in L:
    if not l: continue
    if is_hdr(l): on=True; continue
    if not on: continue
    if is_end(l): on=False; continue
    newitem=YEAR_START.match(l) or l[0] in '〈《「【•●‧-' or (out and re.search(r'[。）)\]】]\s*$',out[-1]))
    if out and not newitem and len(out[-1])<400: out[-1]+=l; continue
    out.append(l)
  # split glued items like "...計畫102-103年 《..."
  res=[]
  for x in out:
    parts=re.split(r'(?<=[畫劃辦助案）)」》])\s*(?=\d{2,3}(?:-\d{2,3})?年\s*[《「〈])',x)
    for q in parts:
      res+=[r for r in re.split(r'(?<=[司會心處局部院）)。])\s*(?=[\u4e00-\u9fff、.．]{2,24}\s*[（(]\d{4})',q) if r]
  return [x for x in res if len(x)>=12 and ITEM_OK.search(x) and not ITEM_BAD.search(x)]
if __name__=='__main__':
  for f in sorted(glob.glob('data/pages/*.txt')):
    p=projects(open(f,encoding='utf-8').read())
    if p: print(os.path.basename(f),len(p))
