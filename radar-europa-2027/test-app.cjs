const test=require('node:test');
const assert=require('node:assert/strict');
let radar;try{radar=require('./app.js')}catch{radar={}}
const now=Date.parse('2026-11-05T12:00:00Z');
const offers=[{destination:'LIS',price:4200,departure:'2027-02-20',return:'2027-03-06',currency:'BRL',direct:true,domestic_connection:false,checked_at:'2026-11-05T11:00:00Z'},
{destination:'MAD',price:3800,departure:'2027-07-01',return:'2027-07-15',currency:'BRL',direct:false,domestic_connection:true,checked_at:'2026-11-05T11:00:00Z'}];
test('exclude expired, non-BRL and malformed offers',()=>{
 assert.equal(radar.validOffers({environment:'production',offers:[...offers,{...offers[0],checked_at:'2026-10-01T00:00:00Z'},{...offers[0],price:NaN},{...offers[0],currency:'USD'}]},now).length,2);
 assert.equal(radar.validOffers({environment:'test',offers},now).length,0);
});
test('combine destination, month, direct and price filters',()=>{
 assert.equal(radar.filterOffers(offers,{destination:'LIS',month:'02',max:4500,direct:true}).length,1);
 assert.equal(radar.filterOffers(offers,{max:4000,noDomestic:true}).length,0);
 assert.equal(radar.filterOffers(offers,{})[0].destination,'MAD');
});
