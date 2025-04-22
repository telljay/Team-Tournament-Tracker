'use strict'

const express = require('express'); 
const morgan = require('morgan'); 
const path = require('path')
const bodyParser = require("body-parser"); 
const DBAbstraction = require('./DBAbstraction');
const session = require('express-session');
const bcrypt = require('bcrypt');
const port = 53140;
const db = new DBAbstraction(path.join(__dirname,'data','sports.sqlite'));

const app = express();

const handlebars = require('express-handlebars').create({}); 
app.engine('handlebars', handlebars.engine); 
app.set('view engine', 'handlebars');  

app.use(morgan('dev')); 
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json()); 
app.use(session({
    secret: 'Carthage-Firebirds',
    resave: false,
    saveUninitialized: true
}));
//--

app.get('/deleteTournament', async (req,res)=>{
    const tournamentId = parseInt(req.query.id);
    await db.deleteTournament(tournamentId);
    res.redirect(`/`)
})
//--

app.get('/deleteGame', async (req,res)=>{
    const gameId = parseInt(req.query.id);
    const tournamentId = parseInt(req.query.tournamentId);
    await db.deleteGame(gameId);
    res.redirect(`/tournament/${tournamentId}`)
})
//--

app.get('/tournament/:id',async (req,res)=>{
    const tournamentId = req.params.id;
    let tournament = await db.getTournament(tournamentId);
    let games = await db.getAllGameInformation(tournamentId);
    res.render('tournamentHome',{games, user: req.session.user, tournament:tournament})
});
//--

app.get('/login', async (req,res)=>{
    res.render('login',{user:req.session.user});
});
//--

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await db.registerUser(username, hashedPassword);
        req.session.user = username;
        res.redirect('/');
    } catch (err) {
        res.status(500).send(`Error adding new user: ${err}`);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await db.getUserByUsername(username);
    if (user && await bcrypt.compare(password, user.HashedPassword)) {
        req.session.user = username;
        res.redirect('/');
    } else {
        res.status(401).send("Invalid credentials.");
    }
});
//--

app.post('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});
//--

app.get('/search',async (req,res)=>{
    const tournamentId = req.query.id;
    const searchQuery = req.query.query;
    const searchType = req.query.searchType;
    let everything = await db.getAllGameInformation(tournamentId);
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
    res.render("tournamentHome",{everything, user:req.session.user})
})
//--

app.get('/', async (req,res)=>{
    let everything = await db.getAllTournaments();
    res.render('home', {everything,user:req.session.user});
})
//--

app.get('/edit',async (req,res)=>{
    const tournamentId = parseInt(req.query.tournamentId)
    const allGameInfo = await db.getAllGameInformation(tournamentId);
    let gameInfo ={};
    const gameId = req.query.id;
    for(let i =0;i<allGameInfo.length;i++){
        if(allGameInfo[i].Id == gameId){
            gameInfo= allGameInfo[i];
            break;
        }
    }

    res.render('edit', gameInfo);
})
//--

app.post('/submit-edit',async (req,res)=>{
    const gameId = req.query.id;
    const homeScore = req.body.homeScore;
    const awayScore = req.body.awayScore
    const tournamentId = req.body.tournamentId;
    await db.changeGameScore(gameId,homeScore,awayScore);
    res.redirect(`/tournament/${tournamentId}`);
})
//--

app.get('/newTournament',(req,res)=>{
    res.render('addTournament', {user: req.session.user})
})
//--

app.post('/insert-tournament', async (req,res)=>{
    let tournamentName = req.body.tournamentName;
    let startTimestamp = req.body.start;
    let endTimestamp = req.body.end;
    console.log(`Inserting tournament: ${tournamentName} which is from ${startTimestamp}-${endTimestamp}`)
    await db.insertTournament(tournamentName,startTimestamp,endTimestamp)
    res.redirect('/')
})
//--

app.get('/tournament/:id/newTeam',(req,res)=>{
    const tournamentId = req.params.id;
    res.render('addTeam', {user: req.session.user,Id:tournamentId});
})
//--

app.post('/insert-team',async (req,res)=>{
    let teamName = req.body.teamName;
    let tournamentId = req.body.tournamentId;
    await db.insertTeam(teamName,tournamentId);
    res.redirect(`/tournament/${tournamentId}`); 
})
//--

app.get('/tournament/:id/newLocation',(req,res)=>{
    res.render('addLocation',{user:req.session.user, Id:req.params.id})
})
//--

app.post('/insert-location',async (req,res)=>{
    const locName = req.body.locName;
    const tournamentId = req.body.tournamentId
    if(locName == ""){
        res.render("err")
    }
    console.log(locName);
    await db.insertLocation(locName);
    res.redirect(`/tournament/${tournamentId}`); 
})
//--
app.get('/tournament/:id/newGame',async (req,res)=>{
    const locations = await db.getAllLocations();
    const tournamentId = req.params.id;
    const teams = await db.getAllTeams(tournamentId);
    res.render('addGame',{teams, locations, user:req.session.user,tournamentId:tournamentId})
})
//--
app.post('/insert-game',async (req,res)=>{
    let homeTeam = parseInt(req.body.homeTeam);
    let awayTeam=parseInt(req.body.awayTeam);
    let homeScore=parseInt(req.body.homeScore);
    let awayScore=parseInt(req.body.awayScore);
    let timeStamp=req.body.timeStamp;
    let location=parseInt(req.body.location);
    const tournamentId = req.body.tournamentId;
    if(homeTeam==awayTeam){
        res.render("err",{message:"ERROR: HOME AND AWAY MUST BE DIFFERENT TEAMS"})
    }
    if(!timeStamp){
        res.render("err",{message:"ERROR: GAME MUST HAVE DATE AND TIME"})
    }
    else{
        await db.insertGame(timeStamp,homeTeam,awayTeam,location,homeScore,awayScore,tournamentId);
        res.redirect(`/tournament/${tournamentId}`);
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