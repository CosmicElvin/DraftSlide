import { Prospect } from "../types";

export interface ScoutingData {
  report: string;
  xFactor: string;
}

export async function generateScoutingReport(prospect: Prospect): Promise<ScoutingData> {
  const prompt = `
    You are Clyde, a trusty AI assistant GM and expert scout for the 2026 NBA Draft.
    Analyze the following prospect data and provide two things:
    1. A 2-3 sentence scouting report.
    2. A 1-3 word "X-Factor" description (e.g., "3-Level Mastery", "Defensive Anchor", "Elite Gravity").
    
    Prospect Data:
    Name: ${prospect.name}
    Position: ${prospect.position}
    Height/Weight: ${prospect.height} / ${prospect.weight}
    School: ${prospect.school}
    Stats: PPG: ${prospect.stats.pts}, APG: ${prospect.stats.ast}, RPG: ${prospect.stats.reb}, FG%: ${prospect.stats.fg}
    Attributes (1-5 scale): 
      Athleticism: ${prospect.attributes.athleticism}
      Shooting: ${prospect.attributes.shooting}
      Creation: ${prospect.attributes.creation}
      On-Ball Defense: ${prospect.attributes.onBallDefense}
      Off-Ball Defense: ${prospect.attributes.offBallDefense}
    
    The tone should be professional, evaluative, and slightly personalized as "Clyde".
    Respond with JSON containing 'report' and 'xFactor'.
  `;

  try {
    const response = await fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) throw new Error("API call failed");
    
    return await response.json();
  } catch (error) {
    console.error("Error generating scouting report:", error);
    return {
      report: prospect.description,
      xFactor: prospect.xFactor
    };
  }
}

export interface SleeperPick {
  prospectId: string;
  report: string;
  defense: string;
}

export async function generateSleeperPick(candidates: Prospect[]): Promise<SleeperPick> {
  const prompt = `
    You are Clyde, a trusty AI assistant GM and expert scout for the 2026 NBA Draft.
    Your task is to choose ONE "Sleeper Pick" from a list of prospects who are ranked outside the top 14 (Lottery).
    
    Candidates (Ranked 15+):
    ${candidates.map(p => `ID: ${p.id}, Name: ${p.name}, Rank: ${p.consensusRank}, Position: ${p.position}, School: ${p.school}, Stats: ${p.stats.pts} PPG, ${p.stats.ast} AST, ${p.stats.reb} REB`).join('\n')}
    
    Pick the most intriguing player who has a unique skill that will translate to the NBA.
    Provide:
    1. The prospectId of your pick.
    2. A short scouting report (1-2 sentences).
    3. A defense of your pick (2-3 sentences) explaining why they are a sleeper and why their unique skill makes them a great pick.
    
    The tone should be professional and insightful.
    Respond with JSON containing 'prospectId', 'report', and 'defense'.
  `;

  try {
    const response = await fetch('/api/generate-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    
    if (!response.ok) throw new Error("API call failed");
    
    return await response.json();
  } catch (error) {
    console.error("Error generating sleeper pick:", error);
    // Fallback to random candidate
    const fallback = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      prospectId: fallback.id,
      report: `Clyde's high-value target from ${fallback.school}.`,
      defense: `Despite ranking #${fallback.consensusRank}, this prospect's physical tools and production suggest high NBA upside.`
    };
  }
}
