// Browser acceptance test for local development only; uses disposable accounts.
const assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const {createClient}=require('@supabase/supabase-js');
const {chromium}=require('playwright-core');
const env=Object.fromEntries(execFileSync('supabase',['status','-o','env'],{encoding:'utf8'}).split('\n').filter(x=>x.includes('=')).map(x=>{const i=x.indexOf('=');return [x.slice(0,i),x.slice(i+1).replace(/^"|"$/g,'')]}));
const admin=createClient('http://127.0.0.1:54321',env.SERVICE_ROLE_KEY,{auth:{persistSession:false}});
const base='http://127.0.0.1:3187';
(async()=>{
 const ids=[];let browser;
 try{
  const accounts=[];
  for(const role of ['participant','mentor']){
   const email=`marriage-ui-${role}-${Date.now()}@test.invalid`,password=`LocalOnly!${crypto.randomUUID()}Z9`;
   const r=await admin.auth.admin.createUser({email,password,email_confirm:true});if(r.error)throw r.error;
   ids.push(r.data.user.id);accounts.push({email,password});
  }
  browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true,args:['--no-sandbox']});
  const participant=await browser.newPage(),mentor=await browser.newPage();
  async function signIn(page,account,next){
   await page.goto(`${base}/login?next=${encodeURIComponent(next)}`);
   await page.locator('input[type=email]').fill(account.email);
   await page.locator('input[type=password]').fill(account.password);
   await page.getByRole('button',{name:'Sign In',exact:true}).click();
   await page.waitForURL(`**${next}`,{timeout:20000});
  }
  await signIn(participant,accounts[0],'/marriage-journey/1');
  await signIn(mentor,accounts[1],'/marriage-journey/mentor');
  await participant.getByLabel('Private reflection').fill('ONLY PARTICIPANT CAN READ THIS');
  await participant.getByLabel('A practical commitment').fill('Listen with patience');
  await participant.getByLabel('Mark this session complete').check();
  await participant.getByRole('button',{name:'Save my responses'}).click();
  await participant.waitForURL('**/marriage-journey/1?saved=1',{timeout:20000});
  await participant.goto(`${base}/marriage-journey/sharing`);
  await participant.getByLabel('Mentor account ID').fill(ids[1]);
  await participant.getByLabel('I have independently confirmed this account belongs to my intended mentor, and I understand what I am allowing them to see.').check();
  await participant.getByRole('button',{name:'Grant permission'}).click();
  await participant.getByText('Sharing settings updated.').waitFor({timeout:20000});
  await participant.getByRole('button',{name:'Share this session update'}).click();
  await participant.getByText('Sharing settings updated.').waitFor({timeout:20000});
  await mentor.reload();
  await mentor.getByText('Session 1 · Completed').waitFor({timeout:20000});
  assert.equal(await mentor.getByText('ONLY PARTICIPANT CAN READ THIS').count(),0);
  assert.equal(await mentor.getByText('Listen with patience').count(),0);
  await participant.getByRole('button',{name:'Revoke and delete shared updates'}).click();
  await participant.getByText('No mentor access granted.').waitFor({timeout:20000});
  await mentor.reload();
  await mentor.getByText('No participants have granted you access.').waitFor({timeout:20000});
  console.log('PASS: Chrome mentor grant, explicit sharing, private data isolation and revocation');
 }finally{if(browser)await browser.close();for(const id of ids){const r=await admin.auth.admin.deleteUser(id);if(r.error)console.error('cleanup:',r.error.message)}}
})().catch(e=>{console.error(e);process.exitCode=1});
