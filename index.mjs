import express, { urlencoded } from 'express'
let app = express()
app.use(urlencoded({ extended: true }))
import { readFile, writeFile } from 'fs'
import { inflateSync, deflateSync } from 'zlib'

let KEY=process.env.KEY
if (!KEY) console.log("KEY not set")
let VERSION=10
let FILENAME=`./leaderboard-${VERSION}.json`
let LEADERBOARD = { mouse: {}, keyboard: {} }
const PORT=process.env.PORT || 3000

readFile(FILENAME,null,(err,data)=>{
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
  writeFile(FILENAME, JSON.stringify(LEADERBOARD), null, (err,data)=>{
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

  let notExists = !(name in LEADERBOARD[mode])
  let beatTime = name in LEADERBOARD[mode] && time > LEADERBOARD[mode][name][1]
  let isCorrectVersion = score._version == VERSION
  let isCheating = false

  if ((notExists || beatTime) &&
      isCorrectVersion &&
      !isCheating) {
    let s = [name, time, date]
    LEADERBOARD[mode][name] = s
    saveLeaderboard()
  }
  return {result:[prepare(LEADERBOARD.mouse), prepare(LEADERBOARD.keyboard), notExists || beatTime, isCorrectVersion, isCheating]}
}

let dates="Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

let formatDate = d => {
  let a = d.split("T")[0].split("-")
  a[1] = dates[parseInt(a[1])-1]
  return a.reverse().join(".")
}

let prepare = s => Object.values(s)
                         .sort(cmp)
                         .map(([n,t,d])=>[n,t,formatDate(d)])

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
      _version:10,
      _dodge:2,
      _startTime:"19:54:24",
      _endTime:"19:54:28"
  }
  let r = processScore(score)
  console.log(r)
}

app.listen(PORT)
console.log(`listening on port ${PORT}`)
