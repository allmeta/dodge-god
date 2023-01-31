import express, { urlencoded } from 'express'
let app = express()
app.use(urlencoded({ extended: true }))
import { readFile, writeFile } from 'fs'
import { inflateSync, deflateSync } from 'zlib'

let KEY=process.env.KEY
if (!KEY) console.log("KEY not set")
let version=10
let leaderboard = { mouse: {}, keyboard: {} }
const PORT=process.env.PORT || 3000

readFile("./leaderboard.json",null,(err,data)=>{
	if(err) {
	  return saveLeaderboard()
	}
	leaderboard=JSON.parse(data)
	console.log(leaderboard)
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
  res.send(r)
})
app.get('/leaderboard', (req,res)=>{
  return res.send({result:[prepare(leaderboard.mouse), prepare(leaderboard.keyboard)]})
})

function saveLeaderboard(){
  writeFile("./leaderboard.json", JSON.stringify(leaderboard), null, (err,data)=>{
    if(err){
      console.log(err)
    }
  })
}

function processScore(score){
  let date = new Date().toISOString()
  let notExists = !(score._name in leaderboard[score._mode])
  let beatTime = score._name in leaderboard[score._mode] && score._time > leaderboard[score._mode][score._name][2]
  let isCorrectVersion = score._version == version
  let mode = score._mode
  let isCheating = false

  if ((notExists || beatTime) &&
      isCorrectVersion &&
      !isCheating) {
    let s = [score._name, score._time, date]
    leaderboard[mode][score._name] = s
    saveLeaderboard()
  }
  return {result:[prepare(leaderboard.mouse), prepare(leaderboard.keyboard), beatTime, isCorrectVersion, isCheating]}
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
  let j = {
      _name:"Karl",
      _time:10,
      _mode:"mouse",
      _version:10,
      _dodge:2,
      _startTime:"19:54:24",
      _endTime:"19:54:28"
  }
  processScore(j)
}

app.listen(PORT)
console.log(`listening on port ${PORT}`)
