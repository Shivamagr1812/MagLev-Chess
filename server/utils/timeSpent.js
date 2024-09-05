const calculateTimeSpent = (player, lastMoveTime)=> {
    const now = Date.now();
    const opponentColor = player === 'b' ? 'white' : 'black';
    const timeSpent = Math.floor((now - lastMoveTime[opponentColor]) / 1000); // Time spent in seconds
    return timeSpent;
}

module.exports = calculateTimeSpent