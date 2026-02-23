// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SoneiumArcadeLeaderboard
 * @dev Single leaderboard contract for all Soneium Arcade games.
 *      Game IDs: 0 = Quake, 1 = ArcadeBot, 2 = SpaceGame, 3 = Snake
 */
contract SoneiumArcadeLeaderboard {
    uint256 public constant MAX_ENTRIES = 100;

    error InvalidScore();
    error ScoreNotImproved();

    mapping(uint8 => mapping(address => uint256)) public highScores;
    mapping(uint8 => mapping(address => uint256)) public lastSubmitTime;
    mapping(uint8 => address[]) private _entries;
    mapping(uint8 => uint256[]) private _scores;

    event ScoreSubmitted(uint8 indexed gameId, address indexed player, uint256 score, uint256 timestamp);
    event NewHighScore(uint8 indexed gameId, address indexed player, uint256 score);

    /**
     * @dev Submit a score for the given game. Only updates if score is higher than player's previous.
     */
    function submitScore(uint8 gameId, uint256 score) external {
        if (score == 0) revert InvalidScore();
        uint256 prev = highScores[gameId][msg.sender];
        if (score <= prev) revert ScoreNotImproved();

        highScores[gameId][msg.sender] = score;
        lastSubmitTime[gameId][msg.sender] = block.timestamp;
        emit ScoreSubmitted(gameId, msg.sender, score, block.timestamp);
        emit NewHighScore(gameId, msg.sender, score);

        _removeFromList(gameId, msg.sender);
        _insertSorted(gameId, msg.sender, score);
    }

    function totalEntries(uint8 gameId) external view returns (uint256) {
        return _entries[gameId].length;
    }

    function getEntry(uint8 gameId, uint256 index) external view returns (address player, uint256 score) {
        require(index < _entries[gameId].length, "Index out of range");
        player = _entries[gameId][index];
        score = _scores[gameId][index];
    }

    function getTop(uint8 gameId, uint256 limit) external view returns (address[] memory players, uint256[] memory scores) {
        uint256 n = _entries[gameId].length;
        if (limit < n) n = limit;
        players = new address[](n);
        scores = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            players[i] = _entries[gameId][i];
            scores[i] = _scores[gameId][i];
        }
    }

    function getHighScore(uint8 gameId, address player) external view returns (uint256) {
        return highScores[gameId][player];
    }

    /// @dev For Arcade Bot: returns (score, timestamp)
    function getPlayerScore(uint8 gameId, address player) external view returns (uint256 score, uint256 timestamp) {
        score = highScores[gameId][player];
        timestamp = lastSubmitTime[gameId][player];
    }

    /// @dev For Arcade Bot: players by index
    function players(uint8 gameId, uint256 index) external view returns (address) {
        return _entries[gameId][index];
    }

    function _removeFromList(uint8 gameId, address player) private {
        address[] storage ent = _entries[gameId];
        uint256[] storage sc = _scores[gameId];
        for (uint256 i = 0; i < ent.length; i++) {
            if (ent[i] == player) {
                ent[i] = ent[ent.length - 1];
                sc[i] = sc[sc.length - 1];
                ent.pop();
                sc.pop();
                return;
            }
        }
    }

    function _insertSorted(uint8 gameId, address player, uint256 score) private {
        address[] storage ent = _entries[gameId];
        uint256[] storage sc = _scores[gameId];

        if (ent.length >= MAX_ENTRIES && score <= sc[sc.length - 1]) return;
        if (ent.length >= MAX_ENTRIES) {
            ent.pop();
            sc.pop();
        }

        uint256 i;
        for (i = 0; i < sc.length; i++) {
            if (score > sc[i]) break;
        }

        ent.push(address(0));
        sc.push(0);
        uint256 len = ent.length;
        for (uint256 j = len - 1; j > i; j--) {
            ent[j] = ent[j - 1];
            sc[j] = sc[j - 1];
        }
        ent[i] = player;
        sc[i] = score;
    }
}
