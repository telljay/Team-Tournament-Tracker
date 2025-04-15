const sqlite3 = require('sqlite3'); 
 
class DBAbstraction { 
    constructor(fileName) { 
        this.fileName = fileName; 
    } 
 
    init() { 
        return new Promise((resolve, reject) => { 
            this.db = new sqlite3.Database(this.fileName, async (err) => { 
                if(err) { 
                    reject(err); 
                } else { 
                    try { 
                        await this.createTables(); 
                        resolve(); 
                    } catch (err) { 
                        reject(err) 
                    } 
                } 
            }); 
        }); 
    } 
 
    createTables() {
        const sqlTeams = `
            CREATE TABLE IF NOT EXISTS 'Teams' (
                'Id' INTEGER,
                'Name' TEXT,
                'TournamentId' INTEGER,
                PRIMARY KEY('Id'),
                FOREIGN KEY('TournamentId') REFERENCES 'Tournaments'('Id')
            );
        `;
        const sqlLocations = `
            CREATE TABLE IF NOT EXISTS 'Locations' (
                'Id' INTEGER,
                'Name' TEXT,
                PRIMARY KEY('Id')
            );
        `;
        const sqlGames = `
            CREATE TABLE IF NOT EXISTS 'Games' (
                'Id' INTEGER,
                'Timestamp' TEXT,
                'HomeScore' INTEGER,
                'AwayScore' INTEGER,
                'HomeTeam' INTEGER,
                'AwayTeam' INTEGER,
                'LocationId' INTEGER,
                'TournamentId' INTEGER,
                PRIMARY KEY('Id'),
                FOREIGN KEY ('HomeTeam') REFERENCES 'Teams'('Id'),
                FOREIGN KEY ('AwayTeam') REFERENCES 'Teams'('Id'),
                FOREIGN KEY ('LocationId') REFERENCES 'Locations'('Id'),
                FOREIGN KEY ('TournamentId') REFERENCES 'Tournaments'('Id')

            );
        `;
        const sqlUsers = `
                CREATE TABLE IF NOT EXISTS 'Users' (
                'Id' INTEGER PRIMARY KEY,
                'Username' TEXT UNIQUE,
                'HashedPassword' TEXT
            );`
        const sqlTournament = `
                CREATE TABLE IF NOT EXISTS 'Tournaments'(
                'Id' INTEGER PRIMARY KEY,
                'Name' TEXT UNIQUE,
                'StartDate' TEXT,
                'EndDate' TEXT
            );`
    
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(sqlTeams);
                this.db.run(sqlLocations);
                this.db.run(sqlUsers);
                this.db.run(sqlTournament)
                this.db.run(sqlGames, [], (err) => {
                    if (err) {
                        reject(new Error(`Error creating the tables: ${err.message}`));
                    } else {
                        resolve();
                    }
                });
            });
        });
    }
    //--

    insertGame(timeStamp, homeTeam, awayTeam, location,homeScore, awayScore,tournamentId){
        const sql = 'INSERT INTO Games (Timestamp, HomeScore, AwayScore,HomeTeam,AwayTeam,LocationId,TournamentId) VALUES (?,?,?,?,?,?,?)';
        return new Promise((resolve, reject)=>{
            this.db.run(sql,[timeStamp, homeScore, awayScore, homeTeam, awayTeam, location,tournamentId],(err)=>{
                if(err){
                    reject(new Error(`Error inserting Game: ${err.message}`));
                } else{
                    resolve();
                }
            })
        })
    }
    //--

    insertTeam(teamName,tournamentId){
        const sql = 'INSERT INTO Teams (Name,TournamentId) VALUES (?,?)'
        return new Promise((resolve, reject)=>{
            this.db.run(sql, [teamName,tournamentId], (err)=>{
                if(err){
                    reject(new Error(`Error inserting Team: ${err.message}`));
                }else{
                    resolve();
                }
            })
        })
    }
    //--

    insertLocation(fieldName){
        const sql = 'INSERT INTO Locations(Name) VALUES (?)'
        return new Promise((resolve,reject)=>{
            this.db.run(sql,[fieldName],(err)=>{
                if(err){
                    reject(new Error(`Error inserting Location: ${err.message}`));
                } else{
                    resolve();
                }
            })
        })
    }
    //--

    insertTournament(name, startDate,endDate){
        const sql = `INSERT INTO Tournaments(Name,StartDate,EndDate) VALUES (?,?,?)`
        return new Promise((resolve,reject)=>{
            this.db.run(sql,[name,startDate,endDate],(err)=>{
                if(err){
                    reject(new Error(`Error inserting Tournament: ${err.message}`))
                } else{
                    resolve();
                }
            })
        })
    }
    //--

    getAllTournaments(){
        const sql=`
        SELECT *
        FROM Tournaments`
        return new Promise((resolve, reject)=>{
            this.db.all(sql,(err,rows)=>{
                if(err){
                    reject(new Error(`Database error while collecting tournaments: ${err.message}`))
                } else{
                    let allData = [];
                    rows.forEach(row =>{
                        const startDate = new Date(row.StartDate);
                        const friendlyStartDate = startDate.toLocaleDateString('en-US',{
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        const endDate = new Date(row.EndDate);
                        const friendlyEndDate = endDate.toLocaleDateString('en-US',{
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                        });
                        let data = {
                            Id: row.Id,
                            Name: row.Name,
                            StartDate: friendlyStartDate,
                            EndDate: friendlyEndDate
                        };
                        allData.push(data);
                    })
                    resolve(allData);
                }
            })
        })
    }
    //--

    getAllTeams(){
        const sql =`
        SELECT *
        FROM Teams`
        return new Promise ((resolve, reject)=>{
            this.db.all(sql,(err,rows)=>{
                if(err){
                    reject(new Error(`Database error while collecting teams: ${err.message}`));
                } else{
                    resolve(rows);
                }
            })
        })
    }
    //--

    getAllLocations(){
        const sql =`
        SELECT *
        FROM Locations;`
        return new Promise ((resolve, reject)=>{
            this.db.all(sql,(err,rows)=>{
                if(err){
                    reject(new Error(`Database error while collecting locations: ${err.message}`));
                } else {
                    resolve(rows);
                }
            })
        })
    }
    //--

    getAllGames(){
        const sql = `
        SELECT *
        FROM Games;`;
        
        return new Promise((resolve, reject)=>{
            this.db.all(sql,(err,rows)=>{
                if(err){
                    reject(new Error(`Database error while collecting games: ${err.message}`));
                } else{
                    resolve(rows);
                }
            })
        })

    }
    //--

    getAllGameInformation(tournamentId){
        const sql = `
        SELECT *
        FROM Games
        WHERE TournamentId = ?
        ORDER BY Timestamp ASC;`
        let allData = [];
        return new Promise((resolve, reject)=>{
            this.db.all(sql,[tournamentId], async (err,rows)=>{
                if(err){
                    reject(new Error(`Error getting all information: ${err.message}`))
                }
                else{
                    const locMap = new Map();
                    const teamMap = new Map();
                    let allLoc=await this.getAllLocations();
                    for(let i = 0;i<allLoc.length;i++){
                        locMap.set(allLoc[i].Id, allLoc[i].Name);
                    }
                    let allTeams=await this.getAllTeams();
                    for(let i = 0;i<allTeams.length;i++){
                        teamMap.set(allTeams[i].Id,allTeams[i].Name);
                    }
                    rows.forEach(row => {
                        const date = new Date(row.Timestamp);
                        const friendlyDate = date.toLocaleDateString('en-US',{
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true 
                        })
                        let data ={
                            Id: row.Id,
                            Timestamp: friendlyDate,
                            Location: locMap.get(parseInt(row.LocationId)),
                            HomeTeam: teamMap.get(parseInt(row.HomeTeam)),
                            AwayTeam: teamMap.get(parseInt(row.AwayTeam)),
                            HomeScore: row.HomeScore,
                            AwayScore: row.AwayScore
                        }
                        allData.push(data);
                    });
                    resolve(allData);
                }
            })
        })
    }
    //--

    changeGameScore(gameId, homeScore,awayScore){
        const sql = `
        UPDATE Games
        SET HomeScore = ?, AwayScore = ?
        WHERE Id = ?`
        return new Promise((resolve, reject)=>{
            this.db.run(sql,[homeScore,awayScore,gameId],(err)=>{
                if(err){
                    reject(new Error(`Error updating game score: ${err.message}`));
                }else{
                    resolve();
                }
            })
        })
    }
    //--

    registerUser(username, hashedPassword) {
        const sql = 'INSERT INTO Users (Username, HashedPassword) VALUES (?, ?)';
        return new Promise((resolve, reject) => {
            this.db.run(sql, [username, hashedPassword], (err) => {
                if (err) reject(new Error(`Error registering user: ${err.message}`));
                else resolve();
            });
        });
    }
    //--

    getUserByUsername(username) {
        const sql = 'SELECT Username, HashedPassword FROM Users WHERE Username = ?';
        return new Promise((resolve, reject) => {
            this.db.get(sql, [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }
    //--

    getTournament(tournamentId){
        const sql= `
        SELECT * 
        FROM Tournaments
        WHERE Id = ?`
        return new Promise((resolve,reject)=>{
            this.db.get(sql,[tournamentId],(err,row)=>{
                if(err){
                    reject(new Error(`Error getting the tournament: ${tournamentId} because: ${err.message}`))
                } else{
                    resolve(row)
                }
            })
        })
    }
}
 
module.exports = DBAbstraction;