import { useState, useEffect } from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {Form, Button} from 'react-bootstrap'
// import {useDispatch, useSelector} from 'react-redux'
// import { setCredentials } from '../slices/authSlice'
import FormContainer from '../components/FormContainer'
import {toast} from 'react-toastify'
import Loader from '../components/Loader'
// import { useUpdateUserMutation } from '../slices/usersApiSlice'
import { useSelector } from 'react-redux'

const ProfilePage = () => {

  const { userInfo } = useSelector(state => state.auth)


  return (
    <>
      <p>Games Played: {userInfo.gamesPlayed || 0}</p>
      <p>Games Won: {userInfo.gamesWon || 0}</p>
    </>
      
  )
}
export default ProfilePage