// Run against local Next.js and Supabase only; creates and deletes a synthetic participant.
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createClient}=require('@supabase/supabase-js');
const {chromium}=require('playwright-core');
const env=Object.fromEntries(execFileSync('supabase',['status','-o','env'],{encoding:'utf8'}).split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^"|"$/g,'')]}));
const admin=createClient('http://127.0.0.1:54321',env.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
(async()=>{
 let id,browser;
 try {
  const email=`marriage-browser-${Date.now()}@test.invalid`,password=`LocalOnly!${crypto.randomUUID()}Z9`;
  const created=await admin.auth.admin.createUser({email,password,email_confirm:true});if(created.error)throw created.error;id=created.data.user.id;
  browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true});
  await page.goto('http://127.0.0.1:3187/login?next=/marriage-journey/1');
  await page.locator('input[type=email]').fill(email);
  await page.locator('input[type=password]').fill(password);
  await page.getByRole('button',{name:'Sign In',exact:true}).click();
  await page.waitForURL('**/marriage-journey/1',{timeout:20000});
  await page.getByLabel('Private reflection').waitFor();
  for(const day of [1,7,14,16,18,21]){await page.goto(`http://127.0.0.1:3187/marriage-journey/${day}`);await page.getByText('Understanding Scripture in its setting').waitFor({timeout:15000});const overflow=await page.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth);assert.ok(overflow<=2,`Day ${day}: horizontal overflow ${overflow}`);}await page.goto('http://127.0.0.1:3187/marriage-journey/1');
  await page.getByLabel('Private reflection').fill('Synthetic private reflection');
  await page.getByLabel('A practical commitment').fill('Listen before responding');
  await page.getByLabel('Mark this session complete').check();
  await page.getByRole('button',{name:'Save my responses'}).click();
  await page.waitForURL('**/marriage-journey/1?saved=1',{timeout:20000});
  assert.equal(await page.getByLabel('Private reflection').inputValue(),'Synthetic private reflection');
  await page.goto('http://127.0.0.1:3187/marriage-journey/sharing');
  await page.getByRole('heading',{name:'Your sharing permissions'}).waitFor();
  await page.goto('http://127.0.0.1:3187/marriage-journey/mentor');
  await page.getByRole('heading',{name:'Mentor check-ins'}).waitFor();
  console.log('PASS: iPhone-sized Chrome viewport, representative lessons, no horizontal overflow, private save and mentor navigation');
 } finally {if(browser)await browser.close();if(id){const r=await admin.auth.admin.deleteUser(id);if(r.error)console.error('cleanup:',r.error.message)}}
})().catch(e=>{console.error(e);process.exitCode=1});
