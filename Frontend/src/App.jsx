import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import './App.css'
import Layout from './pages/Layout/Layout'
import Register from './pages/Register/Register'
import Login from './pages/Login/Login'
import FormsList from './pages/FormsList/FormsList'
import ProtectedRoute from './pages/ProtectedRoutes/ProtectedRoute'
import FormResponses from './pages/FormResponses/FormResponses'
import SubmitForm from './pages/SubmitForm/SubmitForm'

const routes = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to='login' replace /> },
      { path: 'register', element: <Register /> },
      { path: 'login', element: <Login /> },
      {
        element: <ProtectedRoute />,
        children: [
          { path: 'forms', element: <FormsList /> },
          { path: 'forms/:id/responses', element: <FormResponses /> }
        ]
      },
      { path: 'forms/:id/respond', element: <SubmitForm /> },
      { path: 's/:code', element: <SubmitForm /> }
    ]
  }
])

export default function App () {
  return <RouterProvider router={routes} />
}
