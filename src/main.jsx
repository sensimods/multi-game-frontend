import { createRoot } from 'react-dom/client'
import store from './store'
import {Provider} from 'react-redux'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import {createBrowserRouter, createRoutesFromElements, Route, RouterProvider } from 'react-router-dom'
import App from './App.jsx'
import PrivateRoute from './components/PrivateRoute'
import NotFound from './pages/NotFound.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import ProfilePage from './pages/ProfilePage'
import TestPage from './pages/TestPage.jsx'
import GamesPage from './pages/GamesPage.jsx'
import GamePage from './pages/GamePage.jsx'
import MultiplayerPage from './pages/MultiplayerPage.jsx'
import SinglePlayerPage from './pages/SingleplayerPage.jsx'


const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path='/' element={<App />} errorElement={<NotFound />}>
      <Route index={true} element={<HomePage />} />
      <Route path='/login' element={<LoginPage />} />
      <Route path='/register' element={<RegisterPage />} />
      <Route path='/games' element={<GamesPage />} />
      <Route path='/games/:game' element={<GamePage />} />
      <Route path='/games/:game/multiplayer' element={<MultiplayerPage />} />
      <Route path='/games/:game/single' element={<SinglePlayerPage />} />
      <Route path='/test' element={<TestPage />} />

      {/*Private Routes*/}
      <Route element={<PrivateRoute />}>
        <Route path='/profile' element={<ProfilePage />} />
      </Route>
    </Route>
  )
)

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <RouterProvider router={router} />
  </Provider>
)
