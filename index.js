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
	  return fs.writeFile("./scores.json", JSON.stringify(scores), null, (err,data)=>{})
	}
	scores=JSON.parse(data)
	console.log(scores)
})

app.post('/', (req,res)=>{
  let s = req.body.s
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

function sortScore(){
	return Object.entries(scores).sort((a,b)=>b[1][0]-a[1][0])
}

function calculateScore(score){

  let date = new Date().toISOString()

  let notExists = !(score._name in scores[score._mode])
  let beatTime = score._name in scores[score._mode] && score._time > scores[score._mode][score._name][2]
  let isCorrectVersion = score._version == version
  let mode = score._mode
  let isCheating = false

  // if ((notExists || beatTime) &&
  //     isCorrectVersion &&
  //     !isCheating) {
    let s = [score._name, score._time, date]
    console.log(s)
    scores[mode][score._name] = s
  // }
  let stripDate = s => Object.values(s).map(([n,t,d])=>[n,t,d.split("T")[0]])
  return {result:[stripDate(scores.mouse), stripDate(scores.keyboard), beatTime, isCorrectVersion, isCheating]}
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
    _time:4,
    _mode:"mouse",
    _version:9,
    _dodge:2,
    _startTime:"19:54:24",
    _endTime:"19:54:28"
}
console.log(calculateScore(j))

app.listen(3000)
console.log("listening on port 3000")
