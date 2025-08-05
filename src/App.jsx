import { useEffect, useState } from 'react'
import axios from 'axios'
import UserManager from './components/UserManager'
import './App.css'

function App() {
  const [people, setPeople] = useState([])

  const handleAddPerson = (userData) => {
    axios.post('http://localhost:8000/users', userData)
      .then(response => {
        setPeople([...people, response.data])
      })
      .catch(error => {
        console.error("There was an error adding the person!", error);
      });
  }

  // Fetch people from the server when the component mounts
  useEffect(() => {
    axios.get('http://localhost:8000/users')
      .then(response => {
        setPeople(response.data)
      })
      .catch(error => {
        console.error("There was an error fetching the people!", error);
      });
  }, [])

  return (
    <div className="app">
      <UserManager people={people} onAddPerson={handleAddPerson} />
    </div>
  )
}

export default App
