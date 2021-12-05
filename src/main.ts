import express from 'express';
import axios from 'axios';
import { createClient } from 'redis';
import bluebird from 'bluebird';
import csvParser from 'papaparse';
import cron from 'node-cron';
import { Server } from 'socket.io';
import { Player, givenCsvData } from './players';

const PORT = process.env.PORT || 3000;
const app = express();
const redis = createClient();
const io = new Server();
const playersAPI = 'https://www.balldontlie.io/api/v1/players';
// make all redis methods a Promise based.
bluebird.promisifyAll(redis);
redis.connect().then(() => console.log('redis is connected.'));

io.on('connection', (socket) => {
  socket.on('player update', (msg) => {
    console.log(`new player data: ${msg}`);
  });
});
app.get('/player', async (req, res) => {
  try {
    const playersMinimalData = await givenCsvData();
    const playersArray = await Promise.all(
      playersMinimalData.map(async (playerRecord) => {
        const playerCache = await redis.get(playerRecord.id.toString());
        if (playerCache !== null) return JSON.parse(playerCache) as Player;
        const playerData = (
          await axios.get<Player>(`${playersAPI}/${playerRecord.id}`)
        ).data;
        await redis.set(playerData.id.toString(), JSON.stringify(playerData));
        return playerData;
      })
    );

    const csvRelevantData = playersArray.map((player) => {
      return { ...player, team: player.team.full_name };
    });
    const playersCsvString = csvParser.unparse(csvRelevantData);
    res.attachment('players.csv');
    return res.status(200).send(playersCsvString);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: 'Internal Server Error!' });
  }
});
//Update cache data every 15 minutes
//if data has been changed in the 3rd party api or never been cached before.
cron.schedule('*/15 * * * *', async () => {
  const playersMinimalData = await givenCsvData();
  const players = await Promise.all(
    playersMinimalData.map(async (minimalPlayerData) => {
      return (await axios.get<Player>(`${playersAPI}/${minimalPlayerData.id}`))
        .data;
    })
  );
  players.forEach(async (player) => {
    const playerCache = await redis.get(player.id.toString());
    const playerString = JSON.stringify(player);
    // equality operator checks for null as well.
    if (playerString !== playerCache) {
      await redis.set(player.id.toString(), JSON.stringify(player));
      io.emit('player update', playerString);
    }
  });
});

app.listen(PORT, () => {
  console.log(`app is listening on port ${PORT}`);
});
