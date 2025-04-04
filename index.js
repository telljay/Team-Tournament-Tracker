'use strict'

const express = require('express'); 
const morgan = require('morgan'); 
const path = require('path')
const bodyParser = require("body-parser"); 
const DBAbstraction = require('./DBAbstraction');
const port = 53140;
const db = new DBAbstraction(path.join(__dirname,'data','sports.sqlite'));

const app = express();

const handlebars = require('express-handlebars').create({}); 
app.engine('handlebars', handlebars.engine); 
app.set('view engine', 'handlebars');  

app.use(morgan('dev')); 
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json()); 
app.get('/search',async (req,res)=>{
    const searchQuery = req.query.query;
    const searchType = req.query.searchType;
    let everything = await db.getAllGameInformation();
    let newEverything =[];
    for(let i = 0;i<everything.length;i++){
        if(searchType == "Team"){
            if(everything[i].HomeTeam.includes(searchQuery)){
                newEverything.push(everything[i]);
            }
            if(everything[i].AwayTeam.includes(searchQuery)){
                newEverything.push(everything[i]);
            }
        }
        if(searchType =="Date"){
            if(everything[i].Timestamp.includes(searchQuery)){
                newEverything.push(everything[i]);
            }
        }
        if(searchType=="Location"){
            if(everything[i].Location.includes(searchQuery)){
                newEverything.push(everything[i]);
            }
        }
    }
    everything = newEverything;
    res.render("home",{everything})
})
//--

app.get('/', async (req,res)=>{
    let everything = await db.getAllGameInformation();
    res.render('home', {everything});
})
//--

app.get('/edit',async (req,res)=>{
    const allGameInfo = await db.getAllGameInformation();
    let gameInfo ={};
    const gameId = req.query.id;
    for(let i =0;i<allGameInfo.length;i++){
        if(allGameInfo[i].Id == gameId){
            gameInfo= allGameInfo[i];
            break;
        }
    }
    console.log(gameInfo);
    res.render('edit', gameInfo);
})
//--

app.post('/submit-edit',async (req,res)=>{
    const gameId = req.query.id;
    const homeScore = req.body.homeScore;
    const awayScore = req.body.awayScore
    await db.changeGameScore(gameId,homeScore,awayScore);
    res.redirect('/');
})
app.get('/newTeam',(req,res)=>{
    res.render('addTeam');
})
//--

app.post('/insert-team',async (req,res)=>{
    let teamName = req.body.teamName;
    await db.insertTeam(teamName);
    res.redirect("/"); 
})
//--

app.get('/newLocation',(req,res)=>{
    res.render('addLocation')
})
//--

app.post('/insert-location',async (req,res)=>{
    let locName = req.body.locName;
    await db.insertLocation(locName);
    res.redirect("/"); 
})
//--
app.get('/newGame',async (req,res)=>{
    const teams = await db.getAllTeams();
    const locations = await db.getAllLocations();
    res.render('addGame',{teams, locations})
})
//--
app.post('/insert-game',async (req,res)=>{
    let homeTeam = parseInt(req.body.homeTeam);
    let awayTeam=parseInt(req.body.awayTeam);
    let homeScore=parseInt(req.body.homeScore);
    let awayScore=parseInt(req.body.awayScore);
    let timeStamp=req.body.timeStamp;
    let location=parseInt(req.body.location);
    if(homeTeam==awayTeam){
        res.send("ERROR: HOME AND AWAY MUST BE DIFFERENT TEAMS")
    }
    else{
        await db.insertGame(timeStamp,homeTeam,awayTeam,location,homeScore,awayScore);
        res.redirect('/');
    }
})
app.use((req, res) => { 
    res.status(404).render('err');
});
//--

db.init() 
    .then(() => { 
        app.listen(53140, () => console.log(`The server is up and running at http://localhost:${port}`)); 
    }) 
    .catch(err => { 
        console.log('Problem setting up the database'); 
        console.log(err); 
    });