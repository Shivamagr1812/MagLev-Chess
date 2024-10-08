class Piece {
    constructor(color) {
        this.color = color
    }
}
//this is a common class for all the pieces


//instead of images for the pieces, text that looks exactly like the pieces is used.
class Pawn extends Piece {
    constructor(color){
        super(color)
        this.type = 'Pawn'
        this.icon = '♟'
    }
}

class King extends Piece {
    constructor(color){
        super(color)
        this.type = 'King'
        this.icon = '♚'
    }
}

class Queen extends Piece {
    constructor(color){
        super(color)
        this.type = 'Queen'
        this.icon = '♛'
    }
}

class Rook extends Piece {
    constructor(color){
        super(color)
        this.type = 'Rook'
        this.icon = '♜'
    }
}

class Bishop extends Piece {
    constructor(color){
        super(color)
        this.type = 'Bishop'
        this.icon = '♝'
    }
}

class Knight extends Piece {
    constructor(color){
        super(color)
        this.type = 'Knight'
        this.icon = '♞'
    }
}

export {Pawn , King , Queen , Rook , Knight , Bishop}



