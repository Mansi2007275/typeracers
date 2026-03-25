// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract TypingScores {
    struct Score {
        uint256 bestWpm;
        uint256 races;
        uint256 bestAccuracy;
        uint256 bestCorrectWords;
        uint256 lastPlayedAt;
    }

    mapping(address => Score) private _scores;
    mapping(address => bool) private _hasPlayed;
    address[] private _players;

    uint256 public totalRaces;
    uint256 public totalWords;

    event ScoreSubmitted(
        address indexed player,
        uint256 correctWords,
        uint256 wpm,
        uint256 accuracy,
        uint256 totalRacesForPlayer,
        uint256 timestamp
    );

    function submitScore(uint256 correctWords, uint256 wpm, uint256 accuracy) external {
        require(accuracy <= 100, "accuracy must be <= 100");

        if (!_hasPlayed[msg.sender]) {
            _hasPlayed[msg.sender] = true;
            _players.push(msg.sender);
        }

        Score storage player = _scores[msg.sender];
        player.races += 1;
        player.lastPlayedAt = block.timestamp;

        if (wpm > player.bestWpm) {
            player.bestWpm = wpm;
            player.bestAccuracy = accuracy;
            player.bestCorrectWords = correctWords;
        }

        totalRaces += 1;
        totalWords += correctWords;

        emit ScoreSubmitted(msg.sender, correctWords, wpm, accuracy, player.races, block.timestamp);
    }

    function getPlayerStats(address player)
        external
        view
        returns (uint256 bestWpm, uint256 races, uint256 bestAccuracy, uint256 bestCorrectWords, uint256 lastPlayedAt)
    {
        Score memory s = _scores[player];
        return (s.bestWpm, s.races, s.bestAccuracy, s.bestCorrectWords, s.lastPlayedAt);
    }

    function getGlobalStats() external view returns (uint256, uint256, uint256) {
        return (totalRaces, totalWords, _players.length);
    }

    function getTopScores(uint256 limit)
        external
        view
        returns (address[] memory players, uint256[] memory wpms, uint256[] memory races)
    {
        uint256 totalPlayers = _players.length;
        if (limit > totalPlayers) {
            limit = totalPlayers;
        }

        address[] memory sorted = new address[](totalPlayers);
        for (uint256 i = 0; i < totalPlayers; i++) {
            sorted[i] = _players[i];
        }

        // Simple selection sort for demo readability.
        for (uint256 i = 0; i < totalPlayers; i++) {
            uint256 bestIdx = i;
            for (uint256 j = i + 1; j < totalPlayers; j++) {
                if (_scores[sorted[j]].bestWpm > _scores[sorted[bestIdx]].bestWpm) {
                    bestIdx = j;
                }
            }
            if (bestIdx != i) {
                address tmp = sorted[i];
                sorted[i] = sorted[bestIdx];
                sorted[bestIdx] = tmp;
            }
        }

        players = new address[](limit);
        wpms = new uint256[](limit);
        races = new uint256[](limit);

        for (uint256 i = 0; i < limit; i++) {
            address player = sorted[i];
            players[i] = player;
            wpms[i] = _scores[player].bestWpm;
            races[i] = _scores[player].races;
        }

        return (players, wpms, races);
    }
}
