import { useEffect } from 'react'

const TestPage = () => {

  const fetchTest = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/games')
      const data = await res.json()
      console.log('test data: ', data)
    } catch (error) {
      console.error('test error: ', error)
    }
  }

  useEffect(() => {
    fetchTest()
  }, [])

  return (
    <div>Test</div>
  )
}
export default TestPage