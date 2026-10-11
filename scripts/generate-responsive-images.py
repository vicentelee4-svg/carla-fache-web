from pathlib import Path
from PIL import Image
import json
root=Path(__file__).resolve().parents[1];p=root/'dist/data.json';d=json.loads((root/'src/data.json').read_text());folder=root/'dist/assets/responsive';folder.mkdir(exist_ok=True)
byimage={a['image']:a for v in d.values() if isinstance(v,dict) for a in v.get('images',[])}
original=smaller=0
for image,a in byimage.items():
 sources=[];im=Image.open(root/'dist'/image).convert('RGB');w,h=im.size
 if w>400:
  for target in [400,640]:
   if w<=target:continue
   rel='assets/responsive/'+Path(image).stem+'-'+str(target)+'.webp';out=root/'dist'/rel
   im.resize((target,round(h*target/w)),Image.Resampling.LANCZOS).save(out,'WEBP',quality=92,method=4)
   if out.stat().st_size<(root/'dist'/image).stat().st_size:sources.append([rel,target])
   else:out.unlink()
  original+=(root/'dist'/image).stat().st_size;smaller+=(root/'dist'/sources[0][0]).stat().st_size if sources else (root/'dist'/image).stat().st_size
 sources.append([image,w]);a['responsiveSources']=sources
for v in d.values():
 if isinstance(v,dict):
  for a in v.get('images',[]):a['responsiveSources']=byimage[a['image']]['responsiveSources']
(root/'src/data.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
# Hosting-only sharing JPEG paths and original upstream provenance remain in source/static pages.
runtime=json.loads(json.dumps(d))
for v in runtime.values():
 if isinstance(v,dict):
  for a in v.get('images',[]):
   a.pop('sourceImage',None);a.pop('shareImage',None)
p.write_text(json.dumps(runtime,ensure_ascii=False,separators=(',',':')))
print(json.dumps({'images':len(byimage),'full_bytes':original,'400px_bytes':smaller,'smaller_percent':round(100*(1-smaller/original),1)}))
