export interface Ranking {
  site: string;
  rank: number;
  url?: string;
}

export interface Prospect {
  id: string;
  name: string;
  school: string;
  logo: string;
  height: string;
  weight: string;
  age: number;
  sizeScore: number;
  position: string;
  strengths: string[];
  weaknesses: string[];
  xFactor: string;
  consensusRank: number;
  rankings: Ranking[];
  description: string;
  stats: {
    gp: number;
    min: number;
    pts: number;
    reb: number;
    ast: number;
    stl: number;
    blk: number;
    tov: number;
    fg: string;
    fga: number;
    threeP: string;
    threePA: number;
    ft: string;
  };
  attributes: {
    athleticism: number;
    shooting: number;
    creation: number;
    onBallDefense: number;
    offBallDefense: number;
  };
}
