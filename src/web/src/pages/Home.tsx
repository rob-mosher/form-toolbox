import { useEffect, useState } from 'react'
import { Header } from 'semantic-ui-react'

import { API_PORT } from '../config/envConfig'

// const VITE_API_PORT = import.meta.env.VITE_API_PORT || 3000

export default function Home() {
  const [apiResponse, setApiResponse] = useState('Loading.')

  useEffect(() => {
    fetch(`//localhost:${API_PORT}/`)
      .then((resp) => {
        if (resp.ok) setApiResponse(resp.status.toString())
        else throw new Error(resp.status.toString())
      })
      .catch((err) => setApiResponse(err.toString()))
  }, [])

  return (
    <>
      <Header as='h2'>Home</Header>
      <p>
        API Response:
        {' '}
        {apiResponse}
      </p>

    </>
  )
}
