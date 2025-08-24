import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import 'flowbite-react'
import 'flowbite'
import '@fortawesome/fontawesome-free/css/all.min.css'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import { QueryClient, QueryClientProvider } from 'react-query'
import { HeroUIProvider, ToastProvider } from '@heroui/react'

const myClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')).render(
  <QueryClientProvider client={myClient}>
    <HeroUIProvider>
      <ToastProvider placement='top-center' toastOffset={20}/>
        <App />
    </HeroUIProvider>
  </QueryClientProvider>
)
