import {Container, Card, Button} from 'react-bootstrap'
// import { LinkContainer } from 'react-router-bootstrap'
// import LinkContainer from 'react-router-bootstrap/LinkContainer'
import { Link } from 'react-router-dom'
const Hero = () => {
  return (
    <div className='py-5'>
      <Container className='d-flex justify-content-center'>
        <Card className='p-5 d-flex flex-column align-items-center hero-card bg-ligh w-75'>
          <h1 className="text-center mb-4">MERN Authentication</h1>
          <p className="text-center mb-4">
            Multi Game
          </p>
          <div className="d-flex">
            <Link to='/login'>
              <Button variant='primary' className='me-3'>
                Sign In
              </Button>
            </Link>

            <Link to='/register'>
              <Button variant='secondary'>
                Sign Up
              </Button>
            </Link>   
          </div>
        </Card>
      </Container>

    </div>
  )
}
export default Hero