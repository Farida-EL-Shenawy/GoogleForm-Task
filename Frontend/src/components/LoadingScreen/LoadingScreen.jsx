import { Loader2 } from 'lucide-react'
import React from 'react'

const LoadingScreen = () => {
  return (
    <div className='flex items-center justify-center w-full h-screen'>
      <div className='flex flex-col items-center'>
        <Loader2 className='w-12 h-12 animate-spin text-[#2A2524]' />
        <p className='mt-4 text-lg font-semibold text-[#2A2524]'>
          جارٍ التحميل...                
        </p>
      </div>
    </div>
  )
}

export default LoadingScreen
