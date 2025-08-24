import React, { useState } from 'react'
import loginImg from '../../assets/login.png'
import { Link, useNavigate } from 'react-router-dom'
import axiosInstance from '@/api/axios'

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function Login () {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState({ email: '', password: '', global: '' })
  const [loading, setLoading] = useState(false)

  const setField = (k, v) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(e => ({ ...e, [k]: '', global: '' }))
  }

  const validate = () => {
    const cur = { email: '', password: '', global: '' }
    if (!form.email.trim()) cur.email = 'Email is required.'
    else if (!emailRegex.test(form.email))
      cur.email = 'Enter a valid email address.'
    if (!form.password.trim()) cur.password = 'Password is required.'
    else if (form.password.length < 5)
      cur.password = 'Password must be at least 5 characters.'
    setErrors(cur)
    return !cur.email && !cur.password
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    setErrors(p => ({ ...p, global: '' }))
    try {
      const { data } = await axiosInstance.post('/auth/login', {
        email: form.email.trim(),
        password: form.password
      })
      console.log(data)
      const token = data?.token
      if (token) {
        localStorage.setItem('token', token)
      }
      navigate('/forms')
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Invalid email or password.'
      setErrors(p => ({ ...p, global: String(msg) }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className='container w-50 flex flex-col justify-center mt-5'>
        <div className='p-5 rounded-lg'>
          <div className='flex flex-col items-center gap-2 mb-5'>
            <h2 className='text-[42px] font-bold'>Login</h2>
            <h4 className='text-[22px] font-light'>
              If you are already a member, Welcome back!
            </h4>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-3 place-items-center'>
            <form
              className='w-full mt-3 flex flex-col'
              onSubmit={handleSubmit}
              noValidate
            >
              {errors.global && (
                <div className='mb-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700 text-sm'>
                  {errors.global}
                </div>
              )}

              <div className='mb-3'>
                <label
                  htmlFor='email'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Your email
                </label>
                <input
                  type='email'
                  id='email'
                  className={`bg-gray-50 border ${
                    errors.email ? 'border-rose-500' : 'border-gray-300'
                  } text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                  placeholder='name@example.com'
                  value={form.email}
                  onChange={e => setField('email', e.target.value)}
                  onBlur={validate}
                  autoComplete='email'
                  required
                />
                {errors.email && (
                  <p className='mt-1 text-xs text-rose-600'>{errors.email}</p>
                )}
              </div>

              <div className='mb-1'>
                <label
                  htmlFor='password'
                  className='block mb-2 text-sm font-medium text-gray-900 dark:text-white'
                >
                  Your password
                </label>
                <input
                  type='password'
                  id='password'
                  className={`bg-gray-50 border ${
                    errors.password ? 'border-rose-500' : 'border-gray-300'
                  } text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white`}
                  placeholder='••••••••'
                  value={form.password}
                  onChange={e => setField('password', e.target.value)}
                  onBlur={validate}
                  autoComplete='current-password'
                  required
                />
                {errors.password && (
                  <p className='mt-1 text-xs text-rose-600'>
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type='submit'
                disabled={loading}
                className='text-white mt-3 bg-blue-700 hover:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700'
              >
                {loading ? 'Logging in…' : 'Login'}
              </button>

              <p className='mt-3'>
                Don&apos;t have an account?{' '}
                <Link to={'/register'} className='underline font-bold'>
                  Register Now
                </Link>
              </p>
            </form>

            <img src={loginImg} alt='login' className='w-full' />
          </div>
        </div>
      </div>
    </div>
  )
}
