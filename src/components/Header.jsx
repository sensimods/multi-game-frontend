import {Navbar, Nav, Container, NavDropdown, Badge} from 'react-bootstrap'
import {FaSignInAlt, FaSignOutAlt} from 'react-icons/fa'
import { Link } from 'react-router-dom'
import {useNavigate} from 'react-router-dom'
import {toast} from 'react-toastify'

import {useSelector, useDispatch} from 'react-redux'
import { useLogoutMutation } from '../slices/usersApiSlice'
import { clearCredentials } from '../slices/authSlice'
import LevelProgress from './LevelProgress'

const Header = () => {

 
  const {userInfo} = useSelector(state => state.auth)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const [logout] = useLogoutMutation()

  const handleLogout = async () => {
    try {
      await logout().unwrap()
      dispatch(clearCredentials())
      navigate('/')
    } catch (err) {
      console.log(err)
      toast.error(err)
    }
  }



  return (
    <header>
      <Navbar bg='dark' variant='dark' expand='lg' collapseOnSelect style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        {/* <Container> */}
          <Link to='/'>
            <Navbar.Brand>Multi Game</Navbar.Brand>
          </Link>
          <Navbar.Toggle aria-controls='basic-navbar-nav' />
          <Navbar.Collapse id='basic-navbar-nav'>
            <Nav className='ms-auto'>
              {userInfo ? (
                <>
                  <NavDropdown title={userInfo?.username} id='username'>
                    <NavDropdown.Item as={Link} to='/profile'>
                        Profile
                    </NavDropdown.Item>

                    <NavDropdown.Item as={Link} to='/games'>
                        Games
                    </NavDropdown.Item>

                    <NavDropdown.Item onClick={handleLogout}>
                        Logout
                    </NavDropdown.Item>
                  </NavDropdown>
                </>
              ) : (
                <>
                  <Link to='/login'>
                    <FaSignInAlt /> Sign In
                  </Link>
              
                  <Link to='/register'>
                    <FaSignOutAlt /> Sign Up
                  </Link>    
                </>
              )}
              
            </Nav>
            

              <LevelProgress level={userInfo.level || 0} currentXP={userInfo.xp || 0} nextLevelXP={userInfo.xpToNextLevel} />

              
          </Navbar.Collapse>
        {/* </Container> */}
      </Navbar>
    </header>
  )
}
export default Header