import { useState, useEffect } from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Form, Button, Row, Col} from 'react-bootstrap'
import FormContainer from '../components/FormContainer'
import {toast} from 'react-toastify'
import Loader from '../components/Loader'

import {useDispatch, useSelector} from 'react-redux'
import { setCredentials } from '../slices/authSlice'
import { useRegisterMutation } from '../slices/usersApiSlice'

const RegisterPage = () => {

  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const {userInfo} = useSelector(state => state.auth)

  const [register, {isLoading}] = useRegisterMutation()

  useEffect(() => {
    if(userInfo) {
      navigate('/games')
    }
  }, [navigate, userInfo]) 

  const handleSubmit = async e => {
    e.preventDefault()
    if(password !== confirmPassword) {
      toast.error('Passwords do not match!')
    } else {
      try {
        const res = await register({username, email, password}).unwrap()
        dispatch(setCredentials({...res}))
        navigate('/')
      } catch (err) {
        toast.error(err?.data?.message || err.error)
      }
    }
  }

  return (
    <FormContainer>
      <h1>Sign Up</h1>

      <Form onSubmit={handleSubmit}>
        <Form.Group className='my-2' controlId='username'>
          {/* <Form.Label>Username</Form.Label> */}
          <Form.Control
            type='text'
            placeholder='Username'
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          >
          </Form.Control>
        </Form.Group>
        <Form.Group className='my-2' controlId='email'>
          {/* <Form.Label>Email</Form.Label> */}
          <Form.Control
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          >
          </Form.Control>
        </Form.Group>
        <Form.Group className='my-2' controlId='password'>
          {/* <Form.Label>Password</Form.Label> */}
          <Form.Control
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          >
          </Form.Control>
        </Form.Group>
        <Form.Group className='my-2' controlId='confirmPassword'>
          {/* <Form.Label>Confirm Password</Form.Label> */}
          <Form.Control
            type='password'
            placeholder='Confirm Password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          >
          </Form.Control>
        </Form.Group>

        {isLoading && <Loader />}

        <Button type='submit' variant='primary' className='mt-3'>
          Sign Up
        </Button>

        <Row className='py-3'>
          <Col>
            Already have an account? <Link to='/login'>Login</Link>
          </Col>
        </Row>
      </Form>
    </FormContainer>
  )
}
export default RegisterPage