import express, { urlencoded } from 'express'
let app = express()
app.use(urlencoded({ extended: true }))
import { readFile, writeFile } from 'fs'
import { inflateSync, deflateSync } from 'zlib'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration.js'
dayjs.extend(duration)

let KEY = process.env.KEY
if (!KEY) console.log("KEY not set")
let VERSION = 13
let PORT = process.env.PORT || 3000
let LEADERBOARD_FN = `./leaderboard-${VERSION}.json`
let LEADERBOARD = { mouse: {}, keyboard: {} }

readFile(LEADERBOARD_FN, null, (err, data) => {
  if (err) {
    return saveLeaderboard()
  }
  LEADERBOARD = JSON.parse(data)
  console.log(LEADERBOARD)
})


app.post('/', (req, res) => {
  let s = req.body.s
  console.log('\n----------')
  console.log(req.ip)
  if (!s) {
    console.log('illegal request')
    return res.end()
  }
  let score = decrypt(s.split(" ").join("+"))
  if (!score) {
    return res.end()
  }
  score.id = score._name + req.ip
  let r = processScore(score)
  res.send(r)
})

app.get('/leaderboard', (req, res) => {
  return res.send({ result: [prepare(LEADERBOARD.mouse), prepare(LEADERBOARD.keyboard)] })
})

function saveLeaderboard() {
  writeFile(LEADERBOARD_FN, JSON.stringify(LEADERBOARD), null, (err, data) => {
    if (err) {
      console.log(err)
    }
  })
}

function processScore(score) {
  let date = new Date().toISOString()
  let time = parseFloat(score._time)
  let mode = score._mode
  let name = score._name
  let startTime = score._startTime
  let endTime = score._endTime

  // temp shit while migrating name+ip
  if (name in LEADERBOARD[mode]) {
    LEADERBOARD[mode][score.id] = LEADERBOARD[mode][name]
    delete LEADERBOARD[mode][name]
  }

  let notExists = !(score.id in LEADERBOARD[mode])
  let beatTime = score.id in LEADERBOARD[mode] && time > LEADERBOARD[mode][score.id][1]
  let isCorrectVersion = score._version == VERSION
  let isCheating = time > 0 && Math.abs(startTime + time - endTime) > 3 + time * .1

  let lastTime = notExists ? 0 : LEADERBOARD[mode][score.id][3]

  console.log(score.id)

  if (!isCorrectVersion) {
    console.log(`Wrong version:`)
    console.log(score)
    return { result: [prepare(LEADERBOARD.mouse), prepare(LEADERBOARD.keyboard), notExists || beatTime, isCorrectVersion, isCheating, -1, -1] }
  }
  else if (isCheating) {
    console.log(`Cheating:`)
    console.log(score)
    return { result: [prepare(LEADERBOARD.mouse), prepare(LEADERBOARD.keyboard), notExists || beatTime, isCorrectVersion, isCheating, -1, -1] }
  }
  else if (notExists || beatTime) {
    console.log(`New highscore: ${score.id} ${time}`)
    LEADERBOARD[mode][score.id] = [name, time, date, lastTime]
  }
  LEADERBOARD[mode][score.id][3] += time
  saveLeaderboard()

  let [sortedMouse, mouseRank] = sortAndPrepare(LEADERBOARD.mouse, score.id)
  let [sortedKeyboard, keyboardRank] = sortAndPrepare(LEADERBOARD.keyboard, score.id)

  return { result: [sortedMouse, sortedKeyboard, notExists || beatTime, isCorrectVersion, isCheating, mouseRank, keyboardRank] }
}

let formatDate = d => {
  return dayjs(d).format("DD.MMM.YY")
}

let formatTotal = p => {
  let d = dayjs.duration(p * 1000)
  if (d.hours() > 0) return d.format('H:mm:ss')
  if (d.minutes() > 0) return d.format('m:ss')
  return d.format('s')
}

function sortAndPrepare(mode, id) {
  let s = Object.entries(mode)
    .map(([k, v]) => [...v, k])
    .sort(cmp)

  let i = s.findIndex(i => i[4] == id)
  s = s.map(([n, t, d, p, _]) => [n, t, formatDate(d), formatTotal(p)])
  return [s, i]
}

let cmp = (a, b) => {
  if (a[1] == b[1]) {
    return a[2] - b[2]
  }
  return b[1] - a[1]
}

function decrypt(d) {
  try {
    let b = Buffer.from(d, 'base64')
    let s = b.map(a => a ^ KEY)
    let z = inflateSync(s)
    return JSON.parse(z)
  } catch (e) {
    console.log('could not decrypt: most likely old client version')
  }
}

function encrypt(d) {
  let j = JSON.stringify(d)
  return deflateSync(j)
    .map(a => a ^ KEY)
    .toString('base64')
}

function test() {
  let score = {
    _name: "Karl",
    _time: 10,
    _mode: "mouse",
    _version: VERSION,
    _startTime: 1230,
    _endTime: 1240,
    id: 1
  }
  let r = processScore(score)
  console.log(r)
}

app.listen(PORT)
console.log(`listening on port ${PORT}`)
