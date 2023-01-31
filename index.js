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
  let m=Object.values(scores.mouse)
  let k=Object.values(scores.keyboard)

  return {result:[m?m:[], k?k:[], beatTime, scores.mouse[score._name], scores.keyboard[score._keyboard], isCorrectVersion, isCheating]}
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
    name:"Karl",
    time:4,
    mode:"mouse",
    version:9,
    dodge:2,
    startTime:"19:54:24",
    endTime:"19:54:28"
}
//let s = "vFhvkpQOjwiJkXaWlDaK6A6VFpWUDgmLxTe3N49Pl4XGoW2BAV09vYT1j/nH5Pvh++HZYAbMCO/qjejuzQ1AXKWsraGupqGgxhZSXlNG4qjF1upFTF0s3ewQxsR3D+Vq"
let s = "vFhvkpRO6w0IiZF2lvQQ9/T1hMUCYmKCIkICoiLS0sLCYv6EYX097eRhjn09YQFtjuRVdhBmJgg4+FS6x/nHVIyOuo7+jFXVQJ+YVpyQ1sZ1hg0UFg4QEA4MwGjx8evBiRjI6FpTzNUwiemN8JeWbMHEo/vuiw=="
console.log(s)
console.log(decrypt(s))
console.log(j)
console.log(encrypt(j))
console.log(encrypt(j) == s)
console.log(decrypt(s) == j)

app.listen(3000)
console.log("listening on port 3000")
