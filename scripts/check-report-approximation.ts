import assert from 'node:assert/strict'
import {approximateReportTotal,reportQuote} from '../src/domain/report-approximation'
const q=(c:string)=>({USD:1,TWD:32,USDT:1}[c]??null)
const rows=[{currency:'USD',amount:100},{currency:'TWD',amount:3200}]
assert.equal(approximateReportTotal(rows,'USD',q),200)
assert.equal(approximateReportTotal(rows,'TWD',q),6400)
assert.equal(rows[1].amount,3200)
assert.equal(approximateReportTotal([{currency:'X',amount:100}],'USD',q),null)
assert.equal(approximateReportTotal([{currency:'USD',amount:null}],'USD',q),null)
assert.equal(approximateReportTotal([{currency:'USD',amount:-20}],'USD',q),-20)
const rate={fromCurrency:'USDT',toCurrency:'USD',finalRate:1.1,date:'2026-09-09',status:'Locked'}
assert.equal(reportQuote('USD',[rate,{...rate,date:'2026-09-11',finalRate:9}],'2026-09-10'),1.1)
assert.equal(reportQuote('HKD',[],'2026-09-10'),7.8)
console.log('PASS report approximation: conversion, immutable sources, missing values, negative GGR, future rate exclusion')
