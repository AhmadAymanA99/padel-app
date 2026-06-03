export interface TranslationKeys {
  app: { title: string; tagline: string; footer: string }
  home: {
    heading: string; newTournament: string; tournamentName: string; tournamentPlaceholder: string
    mode: string; leagueCup: string; leagueCupDesc: string; cup: string; cupDesc: string
    ffa: string; ffaDesc: string; legs: string; leg1: string; leg2: string
    courts: string; deuceRule: string; classicAdvantage: string; goldenPoint: string; starPoint: string
    targetScore: string; players: string; addPlayer: string
    playersHint_league: string; playersHint_ffa: string; playerPlaceholder: string
    create: string; creating: string; minPlayers: string
  }
  dashboard: {
    standings: string; cupBracket: string; settings: string; share: string; copied: string
    copyCode: string; yourCreatorCode: string; saveCode: string
    startLeague: string; startFFA: string; activeMatches: string; upcomingMatches: string
    completedMatches: string; teams: string; players: string; editTeams: string
    doneEditing: string; saveTeams: string; matchesRemaining: string
    backToDashboard: string; viewScore: string
  }
  match: {
    vs: string; set: string; addSet: string; saveScore: string; saving: string
    updateScore: string; editScore: string; history: string; noScoresYet: string
    creatorAccess: string; currentScores: string; editHistory: string
    noEdits: string; old: string; new: string
  }
  standings: {
    title: string; leagueTable: string; billboard: string; topPlayers: string; topTeams: string
    noData: string; noMatches: string; leagueComplete: string; startCup: string
    completed: string; back: string; pos: string; team: string; P: string; W: string
    D: string; L: string; Pts: string; SD: string; GD: string
  }
  cup: {
    title: string; semi1: string; semi2: string; final: string; thirdPlace: string; notStarted: string
  }
  settings: {
    title: string; back: string; editSettings: string; changesImmediate: string
    locked: string; noAccess: string; save: string; saving: string
  }
  status: {
    setup: string; inProgress: string; completed: string; pending: string; in_progress: string
  }
}
