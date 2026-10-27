const {test} = require('node:test');
const assert = require('node:assert/strict');
const {availableTimes, vietnamNow, services} = require('./booking.js');
const now = new Date('2026-10-27T12:00:00Z');
test('Vietnam time is independent of the visitor timezone, including midnight', () => {
  assert.deepEqual(vietnamNow(now), {date:'2026-10-27', minutes:1140});
  assert.deepEqual(vietnamNow(new Date('2026-10-27T17:00:00Z')), {date:'2026-10-28', minutes:0});
});
test('Monday, Wednesday and Friday include all three working windows', () => {
  for (const date of ['2026-11-02','2026-10-28','2026-10-30']) {
    const short = availableTimes(date,30,now), long = availableTimes(date,60,now);
    assert.equal(short.length,18);
    assert.equal(long.length,15);
    for (const t of ['10:30','16:30','21:30']) {assert(short.includes(t)); assert(!long.includes(t));}
    for (const t of ['08:00','10:00','14:00','16:00','19:00','21:00']) assert(long.includes(t));
  }
});
test('Saturday includes afternoon, never evening', () => {
  const times = availableTimes('2026-10-31',60,now);
  assert.equal(times.length,10);
  assert(times.includes('16:00'));
  assert(!times.some(t => t >= '19:00'));
});
test('Closed days, past dates and malformed dates are unavailable', () => {
  for (const d of ['2026-10-27','2026-10-29','2026-11-01','2026-10-26','2026-02-30','bad-date',''])
    assert.deepEqual(availableTimes(d,60,now),[]);
});
test('Past and in-progress starting times disappear without spilling past a closing time', () => {
  assert.equal(availableTimes('2026-10-28',30,new Date('2026-10-28T03:30:00Z'))[0],'14:00');
  assert.deepEqual(availableTimes('2026-10-28',60,new Date('2026-10-28T14:01:00Z')),[]);
});
test('All service prices and durations match the published offers', () => {
  assert.deepEqual(Object.values(services).map(s => [s.minutes,s.price]),[[30,100000],[60,150000],[60,200000]]);
});
