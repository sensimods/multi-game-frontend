import { useState, useEffect } from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Form, Button, Row, Col} from 'react-bootstrap'
import FormContainer from '../components/FormContainer'
import Loader from '../components/Loader'
import {toast} from 'react-toastify'

import {useDispatch, useSelector} from 'react-redux'
import { useLoginMutation } from '../slices/usersApiSlice'
import { setCredentials } from '../slices/authSlice'
// import { apiSlice } from '../slices/apiSlice'

const LoginPage = () => {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const navigate = useNavigate()
  const dispatch = useDispatch()

  const [login, {isLoading}] = useLoginMutation()

  const {userInfo} = useSelector(state => state.auth)

  // useEffect(() => {
  //   // Reset the API state when the login page loads
  //   dispatch(apiSlice.util.resetApiState())
  // }, [dispatch])

  useEffect(() => {
    if(userInfo) {
      navigate('/games')
    }
  }, [navigate, userInfo])

  const handleSubmit = async e => {
    e.preventDefault()
    try {
      const res = await login({email, password}).unwrap()
     // console.log('Login response:', res) // Check what's in the response
      dispatch(setCredentials({...res}))
      ////console.log('After dispatch - userInfo:', userInfo) // Check state after dispatch
      navigate('/games')
    } catch (err) {
      toast.error(err?.data?.message || err.error)
    }
  }

  return (
    <FormContainer>
      <h1>Sign In</h1>

      <Form onSubmit={handleSubmit}>
        <Form.Group className='my-2' controlId='email'>
          <Form.Label>Email</Form.Label>
          <Form.Control
            type='email'
            placeholder='Email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          >
          </Form.Control>
        </Form.Group>
        <Form.Group className='my-2' controlId='password'>
          <Form.Label>Password</Form.Label>
          <Form.Control
            type='password'
            placeholder='Password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          >
          </Form.Control>
        </Form.Group>

        {isLoading && <Loader />}

        <Button type='submit' variant='primary' className='mt-3'>
          Sign In
        </Button>

        <Row className='py-3'>
          <Col>
            New Customer? <Link to='/register'>Register</Link>
          </Col>
        </Row>
      </Form>
    </FormContainer>
  )
}
export default LoginPage