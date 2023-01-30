var express = require('express')
var app = express()
var fs = require('fs')
var zlib = require('zlib')

let KEY=process.env.KEY
let version=10
let scores = { mouse: {}, keyboard: {} }

fs.readFile("./scores.json",null,(err,data)=>{
	if(err) {
	  return fs.writeFile("./scores.json", JSON.stringify(scores))
	}
	scores=JSON.parse(data)
	console.log(scores)
})

app.post('/', (req,res)=>{
  console.log(req.query)
  if ("s" in req.query){
    let s = req.query.s
    let score = decrypt(s)
    calculateScore(score)
  }else{
    console.log("wrong submit")
  }
  res.send(scores)
})
app.get('/scores', (req,res)=>{
	res.send(scores)
})

function sortScore(){
	return Object.entries(scores).sort((a,b)=>b[1][0]-a[1][0])
}

function calculateScore(score){
  // [mouse, keyboard, is_pb, your_mouse, your_keyboard, right_version, cheating]
  let date = new Date().toISOString()

  let notExists = !score.name in scores[score.mode]
  let beatTime = score.name in scores[score.mode] && score.time > scores[score.mode][score.name][2]
  let isCorrectVersion = score.version == version
  let mode = score.mode
  let isCheating = false

  if ((notExists || beatTime) &&
      isCorrectVersion &&
      !isCheating) {
    scores[score.mode][score.name] = [score.dodge, date, score.time]
  }
}

function decrypt(d){
  let b = Buffer.from(d, 'base64')
  let x = b.map(a=>a^KEY)
  let s = zlib.inflateSync(x)
  return JSON.parse(s.toString())
}

function encrypt(d){
  let j=JSON.stringify(d)
  let s = zlib.deflateSync(j)
  let x = s.map(a=>a^KEY)
  return x.toString('base64')
}

let j = {yo:123,test:[1,3,4]}
let d = encrypt(j)
console.log(d)
let e = decrypt(d)
console.log(e)

app.listen(3000)
console.log("listening on port 3000")
