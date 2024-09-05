import '../styles/pawnPromotion.css'
const PawnPromote = ({handlePromotionMove})=>{
    const handlePromotionCall = (promotedTo)=>{
        handlePromotionMove(promotedTo)
    }
    return (
        <div className='pawnPromote-dialog-wrapper'>
            <div className='pawnPromote-dialog-box'>
            <h1>Promote Pawn to...</h1>
            <ul className='pawnPromote-options-wrapper'>
                <li onClick={()=>{handlePromotionCall('q')}}>♛</li>
                <li onClick={()=>{handlePromotionCall('r')}}>♜</li>
                <li onClick={()=>{handlePromotionCall('b')}}>♝</li>
                <li onClick={()=>{handlePromotionCall('n')}}>♞</li>
            </ul>
            </div>
        </div>
    )
}

export default PawnPromote