// import Button from 'react-bootstrap/Button'
// import Modal from 'react-bootstrap/Modal'

// function GameOverModal({ show, handleClose, gameTitle, gameOverMessage }) {
//   return (
//     <Modal show={show} onHide={handleClose} animation={false}>
//       <Modal.Header closeButton style={{ backgroundColor: '#000', color: '#fff' }}>
//         <Modal.Title>{gameTitle}</Modal.Title>
//       </Modal.Header>
//       <Modal.Body style={{ backgroundColor: '#000', color: '#fff' }}>{gameOverMessage}</Modal.Body>
//       <Modal.Footer style={{ backgroundColor: '#000', color: '#fff' }}>
//         <Button variant="secondary" onClick={handleClose}>
//           Close
//         </Button>
//         <Button variant="primary" onClick={handleClose}>
//           Play Again
//         </Button>
//       </Modal.Footer>
//     </Modal>
//   )
// }

// export default GameOverModal

import { Modal, Button } from 'react-bootstrap'

const GameOverModal = ({ 
  show, 
  handleClose, 
  gameTitle, 
  gameOverMessage,
  showPlayAgain = false,
  onPlayAgain
}) => {
  return (
    <Modal show={show} onHide={handleClose}>
      <Modal.Header closeButton style={{ backgroundColor: '#000', color: '#fff' }}>
        <Modal.Title>{gameTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ backgroundColor: '#000', color: '#fff' }}>
        <p>{gameOverMessage}</p>
      </Modal.Body>
      <Modal.Footer style={{ backgroundColor: '#000', color: '#fff' }}>
        {showPlayAgain && (
          <Button variant="success" onClick={onPlayAgain}>
            Play Again
          </Button>
        )}
        <Button variant="secondary" onClick={handleClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

export default GameOverModal
