export const TYPING_SCORES_ABI = [
  "function submitScore(uint256 correctWords,uint256 wpm,uint256 accuracy) external",
  "function getTopScores(uint256 limit) external view returns (address[] memory players,uint256[] memory wpms,uint256[] memory races)",
  "function getGlobalStats() external view returns (uint256 totalRaces,uint256 totalWords,uint256 totalPlayers)",
  "function getPlayerStats(address player) external view returns (uint256 bestWpm,uint256 races,uint256 bestAccuracy,uint256 bestCorrectWords,uint256 lastPlayedAt)",
] as const;
