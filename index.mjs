import express, { urlencoded } from 'express'
let app = express()
app.use(urlencoded({ extended: true }))
import { readFile, writeFile } from 'fs'
import { inflateSync, deflateSync } from 'zlib'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
dayjs.extend(duration)

let KEY=process.env.KEY
if (!KEY) console.log("KEY not set")
let VERSION=12
let PORT=process.env.PORT || 3000
let LEADERBOARD_FN=`./leaderboard-${VERSION}.json`
let LEADERBOARD = { mouse: {}, keyboard: {} }

readFile(LEADERBOARD_FN,null,(err,data)=>{
	if(err) {
	  return saveLeaderboard()
	}
	LEADERBOARD=JSON.parse(data)
	console.log(LEADERBOARD)
})


app.post('/', (req,res)=>{
  let s = req.body.s
  console.log('\n----------')
  console.log(s)
  if (!s) {
    return res.end()
  }
  let score = decrypt(s.split(" ").join("+"))
  let r = processScore(score)
  let mRank = r.result[0].findIndex(e=>e[0]==score._name)
  let kRank = r.result[1].findIndex(e=>e[0]==score._name)
  r.result.push(mRank, kRank)
  res.send(r)
})
app.get('/leaderboard', (req,res)=>{
  return res.send({result:[prepare(LEADERBOARD.mouse), prepare(LEADERBOARD.keyboard)]})
})

function saveLeaderboard(){
  writeFile(LEADERBOARD_FN, JSON.stringify(LEADERBOARD), null, (err,data)=>{
    if(err){
      console.log(err)
    }
  })
}

function processScore(score){
  let date = new Date().toISOString()
  let time = parseFloat(score._time)
  let mode = score._mode
  let name = score._name
  let startTime = score._startTime
  let endTime = score._endTime

  let notExists = !(name in LEADERBOARD[mode])
  let beatTime = name in LEADERBOARD[mode] && time > LEADERBOARD[mode][name][1]
  let isCorrectVersion = score._version == VERSION
  let isCheating = Math.abs(startTime + time - endTime) > 2 + time*.1

  let lastTime = notExists ? 0 : LEADERBOARD[mode][name][3]

  if (!isCorrectVersion){
    console.log(`Wrong version:`)
    console.log(score)
    return {result:[prepare(LEADERBOARD.mouse), prepare(LEADERBOARD.keyboard), notExists || beatTime, isCorrectVersion, isCheating]}
  }
  else if (isCheating){
    console.log(`Cheating:`)
    console.log(score)
    return {result:[prepare(LEADERBOARD.mouse), prepare(LEADERBOARD.keyboard), notExists || beatTime, isCorrectVersion, isCheating]}
  }
  else if (notExists || beatTime) {
    LEADERBOARD[mode][name] = [name, time, date, lastTime]
  }
  LEADERBOARD[mode][name][3] += time
  saveLeaderboard()

  return {result:[prepare(LEADERBOARD.mouse), prepare(LEADERBOARD.keyboard), notExists || beatTime, isCorrectVersion, isCheating]}
}


let formatDate = d => {
  return dayjs(d).format("YY.MMM.DD")
}

let formatTotal = p => { 
  let d = dayjs.duration(p*1000)
  if (d.hours()>0) return d.format('H:mm:ss')
  if (d.minutes()>0) return d.format('m:ss')
  return d.format('s')
}

let prepare = mode => Object.values(mode)
                         .sort(cmp)
                         .map(([n,t,d,p])=>[n,t,formatDate(d),formatTotal(p)])

let cmp = (a,b) => {
  if (a[1] == b[1]){
    return a[2] - b[2]
  }
  return b[1] - a[1]
}

function decrypt(d){
  let b = Buffer.from(d, 'base64')
  let s = b.map(a=>a^KEY)
  let z = inflateSync(s)
  return JSON.parse(z)
}

function encrypt(d){
  let j=JSON.stringify(d)
  return deflateSync(j)
             .map(a=>a^KEY)
             .toString('base64')
}

function test(){
  let score = {
      _name:"Karl",
      _time:10,
      _mode:"mouse",
      _version:12,
      _startTime:1230,
      _endTime:1240,
  }
}
test()

app.listen(PORT)
console.log(`listening on port ${PORT}`)
