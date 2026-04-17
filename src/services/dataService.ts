import Papa from 'papaparse';
import { Prospect, Ranking } from '../types';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI(import.meta.env.VITE_GEMINI_API_KEY);
export async function generateScoutingReport(prospect: Prospect): Promise<ScoutingData> {
  const prompt = `Act as an expert NBA scout. Provide a brief scouting report and identify an X-factor for ${prospect.name}, a ${prospect.position} from ${prospect.school}. 
    
    Return the response strictly as a JSON object with these exact keys:
    "report": "A 2-sentence professional scouting summary"
    "xFactor": "A 3-5 word specific elite trait"
    
    Do not include markdown formatting or backticks.`;

    try {
      const model = ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const response = await result.response;
const text = response.text().replace(/```json|```/gi, '').trim();      
      return JSON.parse(text);
  } catch (error) {
    console.error('Error generating scouting report:', error);
    return {
      report: 'Analysis currently unavailable.',
      xFactor: 'Pending Analysis'
    };
  }
}

const CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSzT5gr4E4bZKV_JDp6f4ueVkQa8i4rGoDsxY9Vo811L2XRM4oSvR3733a5VybGuVYuIWl8MCFjNoLk/pub?gid=0&output=csv';

interface UnifiedRow {
  'CON RANK': string;
  'NAME': string;
  'AGE': string;
  'COLLEGE/TEAM': string;
  'CLASS': string;
  'POSITION': string;
  'HEIGHT': string;
  'WEIGHT': string;
  'Athleticism': string;
  'Shooting': string;
  'Creation': string;
  'On Ball Defense': string;
  'Off Ball Defense': string;
  'GP': string;
  'MPG': string;
  'PPG': string;
  'FGA': string;
  'FG%': string;
  '3PA': string;
  '3P%': string;
  'FTA': string;
  'FT%': string;
  'ORB': string;
  'DRB': string;
  'REB': string;
  'AST': string;
  'STL': string;
  'BLK': string;
  'TOV': string;
}

export async function fetchProspectData(): Promise<Prospect[]> {
  try {
    const res = await fetch(CSV_URL);
    const text = await res.text();

    const result = Papa.parse<UnifiedRow>(text, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });
    
    const data = result.data;

    return data.map((row, index) => {
      const name = row['NAME'] || 'Unknown Player';
      const conRank = parseInt(row['CON RANK']) || (index + 1);

      // We only keep the Consensus ranking as requested
      const rankings: Ranking[] = [
        { site: 'Consensus', rank: conRank }
      ];

      return {
        id: (index + 1).toString(),
        name: name,
        school: row['COLLEGE/TEAM'] || 'N/A',
        logo: 'WORLD_ICON',
        height: row['HEIGHT'] || "0'0\"",
        weight: row['WEIGHT'] || '0',
        age: parseFloat(row['AGE']) || 0,
        sizeScore: 85, // Default or calculated if we had more info
        position: row['POSITION'] || 'N/A',
        strengths: [], // Clyde will infer or we can leave empty
        weaknesses: [],
        xFactor: 'Pending AI Analysis', // Clyde will replace this
        consensusRank: conRank,
        rankings: rankings,
        description: `${name} is a top prospect from ${row['COLLEGE/TEAM']}.`,
        stats: {
          gp: parseInt(row['GP']) || 0,
          min: parseFloat(row['MPG']) || 0,
          pts: parseFloat(row['PPG']) || 0,
          reb: parseFloat(row['REB']) || 0,
          ast: parseFloat(row['AST']) || 0,
          stl: parseFloat(row['STL']) || 0,
          blk: parseFloat(row['BLK']) || 0,
          tov: parseFloat(row['TOV']) || 0,
          fg: row['FG%'] || '0%',
          fga: parseFloat(row['FGA']) || 0,
          threeP: row['3P%'] || '0%',
          threePA: parseFloat(row['3PA']) || 0,
          ft: row['FT%'] || '0%'
        },
        attributes: {
          athleticism: parseInt(row['Athleticism']) || 3,
          shooting: parseInt(row['Shooting']) || 3,
          creation: parseInt(row['Creation']) || 3,
          onBallDefense: parseInt(row['On Ball Defense']) || 3,
          offBallDefense: parseInt(row['Off Ball Defense']) || 3
        }
      };
    }).sort((a, b) => a.consensusRank - b.consensusRank);
  } catch (error) {
    console.error('Error fetching prospect data:', error);
    return [];
  }
}
