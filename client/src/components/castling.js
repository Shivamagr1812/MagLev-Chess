const Castling = ({castling ,handleCastleMove })=>{
    return(
        <div className="castling-btn-wrapper">
            {castling?.kingSide?.status && <button className="castling-btn" onClick={()=>{handleCastleMove('K')}}>Castle King Side</button>}
            {castling?.queenSide?.status && <button className="castling-btn" onClick={()=>{handleCastleMove('Q')}}>Castle Queen Side</button>}
        </div>
    )
}

export default Castling
