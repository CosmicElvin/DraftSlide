import { Prospect } from "../types";

export interface ScoutingData {
  report: string;
  xFactor: string;
}

export async function generateScoutingReport(prospect: Prospect): Promise<ScoutingData> {
  // AI is disabled; return placeholder
  return {
    report: "Clyde's AI analysis is currently unavailable. Coming soon!",
    xFactor: "Coming soon"
  };
}

export interface SleeperPick {
  prospectId: string;
  report: string;
  defense: string;
}

export async function generateSleeperPick(candidates: Prospect[]): Promise<SleeperPick> {
  // AI is disabled; return placeholder
  return {
    prospectId: candidates[0]?.id || "",
    report: "Clyde's AI analysis is currently unavailable. Coming soon!",
    defense: "Clyde's AI analysis is currently unavailable. Coming soon!"
  };
}
