const { chromium } = require('playwright'); const fs=require('fs');
(async () => {
  const b = await chromium.launch({executablePath:'/opt/pw-browsers/chromium', args:['--ignore-certificate-errors']});
  const lines=fs.readFileSync(process.argv[2],'utf8').trim().split('\n');
  for (const l of lines){ const [out,url]=l.split('\t');
    const p = await b.newPage();
    try { await p.goto(url,{waitUntil:'networkidle',timeout:60000}); await p.waitForTimeout(1500);
      // expand tabs/accordions
      const t = await p.evaluate(()=>{document.querySelectorAll('details').forEach(d=>d.open=true); return document.body.innerText;});
      fs.writeFileSync(out,t); console.log(out,t.length);
    } catch(e){ console.log(out,'ERR',e.message.slice(0,80)); }
    await p.close(); }
  await b.close();
})();
