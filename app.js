const express = require("express");
const app = express();
app.use(express.json());
const { open } = require("sqlite");
const path = require("path");
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const sqlite3 = require("sqlite3");
let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is Running At http://localhost:3000/");
    });
  } catch (error) {
    console.log(`DBError: ${error.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectToResponseObject1 = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToResponseObject2 = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

const convertDbObjectToResponseObject3 = (dbObject) => {
  return {
    playerId: dbObject.playerId,
    playerName: dbObject.playerName,
    totalScore: dbObject.totalScore,
    totalFours: dbObject.totalFours,
    totalSixes: dbObject.totalSixes,
  };
};

//get player details
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
 SELECT
 *
 FROM
 player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) =>
      convertDbObjectToResponseObject1(eachPlayer)
    )
  );
});

//Returns player based on player_id

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayer = `
    SELECT
      *
    FROM
      player_details
    WHERE 
      player_id = ${playerId};`;
  const player = await db.get(getPlayer);
  response.send(convertDbObjectToResponseObject1(player));
});

//Updates player based on player_id

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const playerDetails = request.body;
  const { playerName } = playerDetails;
  const getPlayer = `
    UPDATE
      player_details
    SET 
      player_name = '${playerName}'
    WHERE 
      player_id = ${playerId};`;
  await db.get(getPlayer);
  response.send("Player Details Updated");
});

//Returns match details

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatch = `
    SELECT
      *
    FROM
      match_details
    WHERE 
      match_id = ${matchId};`;
  const match = await db.get(getMatch);
  response.send(convertDbObjectToResponseObject2(match));
});

//API 5

app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatches = `
    SELECT
      *
    FROM
      player_match_score 
      NATURAL JOIN match_details
    WHERE 
      player_id = ${playerId}`;
  const playerMatches = await db.all(getPlayerMatches);
  response.send(
    playerMatches.map((eachMatch) =>
      convertDbObjectToResponseObject2(eachMatch)
    )
  );
});

//API 6

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerMatches = `
    SELECT
      *
    FROM
      player_match_score 
      NATURAL JOIN player_details
    WHERE 
      match_id = ${matchId}`;
  const playerMatches = await db.all(getPlayerMatches);
  response.send(
    playerMatches.map((eachMatch) =>
      convertDbObjectToResponseObject1(eachMatch)
    )
  );
});

//API 7

app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScored = `
    SELECT
    player_details.player_id AS playerId,
    player_details.player_name AS playerName,
    SUM(player_match_score.score) AS totalScore,
    SUM(fours) AS totalFours,
    SUM(sixes) AS totalSixes FROM 
    player_details INNER JOIN player_match_score ON
    player_details.player_id = player_match_score.player_id
    WHERE player_details.player_id = ${playerId};
    `;
  const playerScoredMatches = await db.get(getPlayerScored);
  response.send(convertDbObjectToResponseObject3(playerScoredMatches));
});

module.exports = app;
