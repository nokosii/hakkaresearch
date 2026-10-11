import re,glob,json,os
HDR=re.compile(r'^\s*(研究計畫一覽|研究計畫|參與研究計畫|執行計畫|計畫|主持計畫|研究計畫與產學合作|產學合作計畫|產學合作|委託研究計畫|主要研究計畫|近年研究計畫|計畫案|研究案|研究與產學計畫|研究計畫\(.*\)|研究計畫（.*）)\s*[:：]?\s*$')
YEAR=re.compile(r'(19|20)\d\d|\b(8|9|10|11)\d\s*年|^\s*(8|9|10|11)\d(學年度|年度)')
def projects(txt):
  L=[l.strip() for l in txt.split('\n')]
  out=[];on=False;blank=0
  for i,l in enumerate(L):
    if HDR.match(l): on=True; continue
    if not on: continue
    if not l: continue
    # end of section: short header-like line without year
    if len(l)<=14 and not YEAR.search(l): on=False; continue
    if len(l)<14: continue
    # join wrapped line
    newitem=re.match(r'^\s*[\(（]?((19|20)\d\d|(8|9|10|11)\d\s*(學年度|年度|年))',l) or l[0] in '〈《「[【•●-‧' or (out and re.search(r'[。）)\]]\s*$',out[-1]))
    if out and not newitem and len(out[-1])<400: out[-1]+=l; continue
    out.append(l)
  return out
if __name__=='__main__':
  for f in sorted(glob.glob('data/pages/*.txt')):
    p=projects(open(f,encoding='utf-8').read())
    if p: print(os.path.basename(f),len(p)); [print('   ',x[:110]) for x in p[:3]]
