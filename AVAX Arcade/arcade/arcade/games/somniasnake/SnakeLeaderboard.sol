// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SnakeLeaderboard
 * @dev Leaderboard for Snake Arena. Matches ABI expected by somniasnake (getTop, getEntry, highScores, etc.)
 */
contract SnakeLeaderboard {
    error InvalidScore();
    error ScoreNotImproved();

    uint256 public constant MAX_ENTRIES = 100;

    mapping(address => uint256) public highScores;
    address[] private _entries;        // ordered by score descending (best first)
    uint256[] private _scores;

    event ScoreSubmitted(address indexed player, uint256 score);

    function totalEntries() external view returns (uint256) {
        return _entries.length;
    }

    function getEntry(uint256 index) external view returns (address player, uint256 score) {
        require(index < _entries.length, "Index out of range");
        player = _entries[index];
        score = _scores[index];
    }

    function getTop(uint256 limit) external view returns (address[] memory players, uint256[] memory scores) {
        uint256 n = _entries.length;
        if (limit < n) n = limit;
        players = new address[](n);
        scores = new uint256[](n);
        for (uint256 i = 0; i < n; i++) {
            players[i] = _entries[i];
            scores[i] = _scores[i];
        }
    }

    function submitScore(uint256 score) external {
        if (score == 0) revert InvalidScore();
        uint256 prev = highScores[msg.sender];
        if (score <= prev) revert ScoreNotImproved();

        highScores[msg.sender] = score;
        emit ScoreSubmitted(msg.sender, score);

        // Update sorted list: remove old position if any, insert new in order
        _removeFromList(msg.sender);
        _insertSorted(msg.sender, score);
    }

    function _removeFromList(address player) private {
        for (uint256 i = 0; i < _entries.length; i++) {
            if (_entries[i] == player) {
                _entries[i] = _entries[_entries.length - 1];
                _scores[i] = _scores[_scores.length - 1];
                _entries.pop();
                _scores.pop();
                return;
            }
        }
    }

    function _insertSorted(address player, uint256 score) private {
        if (_entries.length >= MAX_ENTRIES && score <= _scores[_scores.length - 1]) return;
        uint256 i;
        for (i = 0; i < _scores.length; i++) {
            if (score > _scores[i]) break;
        }
        if (_entries.length >= MAX_ENTRIES) {
            _entries.pop();
            _scores.pop();
        }
        address[] memory a = new address[](_entries.length + 1);
        uint256[] memory s = new uint256[](_scores.length + 1);
        for (uint256 j = 0; j < i; j++) {
            a[j] = _entries[j];
            s[j] = _scores[j];
        }
        a[i] = player;
        s[i] = score;
        for (uint256 j = i; j < _entries.length; j++) {
            a[j + 1] = _entries[j];
            s[j + 1] = _scores[j];
        }
        _entries = a;
        _scores = s;
    }
}
