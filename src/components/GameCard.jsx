import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import { Link } from 'react-router-dom'

const GameCard = ({image, title, description, link}) => {
  return (
    <Card style={{ width: '18rem' }} bg='dark' text='white'>
      <Card.Img variant="top" src={image} />
      <Card.Body>
        <Card.Title className='text-center'>{title}</Card.Title>
        <Card.Text>
          {description}
        </Card.Text>
        <div className="d-grid gap-2">
          <Button variant="primary" size='lg' as={Link} to={`/games/${link}`}>Play</Button>
        </div>
      </Card.Body>
    </Card>
  )
}
export default GameCard