let express = require('express')
let app = express()
app.use(express.urlencoded({ extended: true }))
let fs = require('fs')
let zlib = require('zlib')

let KEY=process.env.KEY
let version=10
let scores = { mouse: {}, keyboard: {} }

fs.readFile("./scores.json",null,(err,data)=>{
	if(err) {
	  return saveScores()
	}
	scores=JSON.parse(data)
	console.log(scores)
})

app.post('/', (req,res)=>{
  let s = req.body.s
  console.log('\n----------')
  console.log(s)
  if (!s) {
    return res.end()
  }
  let score = decrypt(s.split(" ").join("+"))
  let r = calculateScore(score)
  res.send(r)
})
app.get('/scores', (req,res)=>{
	res.send(scores)
})

let cmp = (a,b) => {
  if (a[1] == b[1]){
    return a[2] - b[2]
  }
  return b[1] - a[1]
}
function saveScores(){
  fs.writeFile("./scores.json", JSON.stringify(scores), null, (err,data)=>{
    if(err){
      console.log(err)
    }
  })
}

function calculateScore(score){
  let date = new Date().toISOString()
  let notExists = !(score._name in scores[score._mode])
  let beatTime = score._name in scores[score._mode] && score._time > scores[score._mode][score._name][2]
  let isCorrectVersion = score._version == version
  let mode = score._mode
  let isCheating = false

  if ((notExists || beatTime) &&
      isCorrectVersion &&
      !isCheating) {
    let s = [score._name, score._time, date]
    scores[mode][score._name] = s
    saveScores()
  }
  let prepare = s => Object.values(s)
                           .sort(cmp)
                           .map(([n,t,d])=>[n,t,formatDate(d)])
  console.log(prepare(scores.mouse))
  return {result:[prepare(scores.mouse), prepare(scores.keyboard), beatTime, isCorrectVersion, isCheating]}
}

let dates="Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" ")

let formatDate = d => {
  let a = d.split("T")[0].split("-")
  a[1] = dates[parseInt(a[1])-1]
  return a.reverse().join(".")
}

function decrypt(d){
  let b = Buffer.from(d, 'base64')
  let s = b.map(a=>a^KEY)
  let z = zlib.inflateSync(s)
  return JSON.parse(z)
}

function encrypt(d){
  let j=JSON.stringify(d)
  return zlib.deflateSync(j)
             .map(a=>a^KEY)
             .toString('base64')
}

let j = {
    _name:"Karl",
    _time:10,
    _mode:"mouse",
    _version:10,
    _dodge:2,
    _startTime:"19:54:24",
    _endTime:"19:54:28"
}
// calculateScore(j)

app.listen(3000)
console.log("listening on port 3000")
