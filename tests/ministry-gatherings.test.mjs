import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
const read=(p)=>fs.readFileSync(p,"utf8");

test("gatherings preserve destination and continue into ministry spaces",()=>{const events=read("app/events/page.tsx");assert.match(events,/login\?next=%2Fevents/);assert.match(events,/Open ministry space/);assert.match(events,/Find/);assert.match(events,/Join/);assert.match(events,/Continue/);});
test("ministry spaces expose the common operating navigation",()=>{const page=read("app/ministries/[slug]/page.tsx");for(const label of ["Home","Updates","Gatherings","Resources","People"])assert.match(page,new RegExp(`>${label}<`));assert.match(page,/All L&F gatherings/);assert.match(page,/Belong without turning people into metrics/);});
test("this batch does not invent RSVP or attendance persistence",()=>{const events=read("app/events/page.tsx");const ministry=read("app/ministries/[slug]/page.tsx");assert.doesNotMatch(events,/event_registrations|rsvp|attendance/i);assert.doesNotMatch(ministry,/event_registrations|rsvp|attendance/i);});
