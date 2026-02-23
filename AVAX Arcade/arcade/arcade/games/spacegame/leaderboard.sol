// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SpaceEscapeLeaderboard {
    // Best score in centiseconds for each player (address)
    mapping(address => uint256) public bestScore;  

    // Array of top players (for leaderboard view)
    address[] public leaderboardPlayers;

    // To check if player is already on the leaderboard array
    mapping(address => bool) private isOnLeaderboard;

    // Event for UI/off-chain
    event NewHighScore(address indexed player, uint256 centiSeconds);

    // Submit time in centiseconds (20.13s => 2013); only increases
    function submitScore(uint256 centiSeconds) external {
        require(centiSeconds > 0, "Invalid score");
        // If new high for this player
        if (centiSeconds > bestScore[msg.sender]) {
            bestScore[msg.sender] = centiSeconds;

            // Add to leaderboard array on first highscore only
            if (!isOnLeaderboard[msg.sender]) {
                leaderboardPlayers.push(msg.sender);
                isOnLeaderboard[msg.sender] = true;
            }

            emit NewHighScore(msg.sender, centiSeconds);
        }
    }

    // Returns full leaderboard: addresses and their best so far
    function getAllBestScores() external view returns (address[] memory, uint256[] memory) {
        uint256 len = leaderboardPlayers.length;
        address[] memory addrs = new address[](len);
        uint256[] memory scores = new uint256[](len);
        for (uint256 i = 0; i < len; i++) {
            addrs[i] = leaderboardPlayers[i];
            scores[i] = bestScore[addrs[i]];
        }
        return (addrs, scores);
    }
}
