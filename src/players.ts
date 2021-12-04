import fs from 'fs/promises';
import csvParser from 'papaparse';

interface Player {
  id: number;
  first_name: string;
  height_feet: number | null;
  height_inches: number | null;
  last_name: string;
  position: string;
  team: {
    id: number;
    abbreviation: string;
    city: string;
    conference: string;
    division: string;
    full_name: string;
    name: string;
  };
  weight_pounds: number | null;
}
const givenCsvData = async () => {
  const playersFile = await fs.readFile('players.csv', { encoding: 'utf-8' });
  //Slicing first element due to first element being the properties of a player.
  const data = csvParser.parse(playersFile, { header: false }).data.slice(1);
  const playersMinimalData: any[] = data.map((row: any) => {
    const player = {
      id: row[0],
      name: row[1],
    };
    return player;
  });
  return playersMinimalData;
};
export { Player, givenCsvData };
