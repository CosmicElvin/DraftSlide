import { Prospect } from '../types';

const TEAM_NORMALIZER: Record<string, string> = {
  'UNC': 'North Carolina',
  'N. Carolina': 'North Carolina',
  'UConn': 'Connecticut',
  'UCONN': 'Connecticut',
  'NB': 'Nebraska',
  'UC': 'Connecticut',
  'OE': 'Butler',
  'Overtime Elite': 'Butler',
  'Mich St.': 'Michigan State',
  'USC': 'Southern California',
  'Cal': 'California',
  'Ole Miss': 'Mississippi',
  'St. John\'s': 'St. John\'s (NY)',
  'St. Johns': 'St. John\'s (NY)',
  'LSU': 'Louisiana State',
  'NC State': 'NC State',
  'UCLA': 'UCLA',
  'UNLV': 'UNLV',
  'SMU': 'SMU',
  'TCU': 'TCU',
  'BYU': 'BYU',
  'VCU': 'VCU',
  'UCF': 'UCF',
  'WVU': 'West Virginia',
  'UMass': 'Massachusetts',
  'Pitt': 'Pittsburgh',
};

const LOGO_OVERRIDES: Record<string, string> = {
  'connecticut': 'https://a.espncdn.com/guid/c7561e25-c7f2-5ddd-4191-899a98236d54/logos/primary_logo_on_primary_color.png',
  'st. john\'s (ny)': 'https://a.espncdn.com/i/teamlogos/ncaa/500/2599.png',
  'kansas': 'https://a.espncdn.com/combiner/i?img=/i/teamlogos/ncaa/500/2305.png',
  'southern california': 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png',
  'usc': 'https://a.espncdn.com/i/teamlogos/ncaa/500/30.png'
};

export async function fetchNCAATeams() {
  try {
    const response = await fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/mens-college-basketball/teams?limit=1000');
    const data = await response.json();
    return data.sports[0].leagues[0].teams;
  } catch (error) {
    console.error('Error fetching NCAA teams:', error);
    return [];
  }
}

export function normalizeSchoolName(school: string): string {
  if (!school) return 'N/A';
  // Handle transfers or arrows like "Kansas ➔ Louisville"
  const cleanSchool = school.split(/[➔\->]/)[0].trim();
  
  // Try case-insensitive lookup in TEAM_NORMALIZER
  for (const [key, val] of Object.entries(TEAM_NORMALIZER)) {
    if (key.toLowerCase() === cleanSchool.toLowerCase()) return val;
  }
  return cleanSchool;
}

export function findTeamLogo(teams: any[], school: string): string {
  const normalized = normalizeSchoolName(school);
  const lowerNormalized = normalized.toLowerCase();
  
  // Check overrides first (case-insensitive)
  if (LOGO_OVERRIDES[lowerNormalized]) {
    return LOGO_OVERRIDES[lowerNormalized];
  }
  
  // Check against school name directly too
  const lowerSchool = school.trim().toLowerCase();
  if (LOGO_OVERRIDES[lowerSchool]) {
    return LOGO_OVERRIDES[lowerSchool];
  }

  const teamData = teams.find((t: any) => 
    t.team.location.toLowerCase() === normalized.toLowerCase() || 
    t.team.displayName.toLowerCase() === normalized.toLowerCase() ||
    t.team.name.toLowerCase() === normalized.toLowerCase()
  );
  
  return teamData?.team.logos?.[0]?.href || 'https://via.placeholder.com/40?text=' + school;
}
