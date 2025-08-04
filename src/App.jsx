import { useEffect, useState } from 'react'

import './App.css'
import axios from 'axios'

function App() {
  const [people, setPeople] = useState([])
  var handleAddPerson = () => {
    const name = document.querySelector('input[type="text"]').value
    const age = document.querySelector('input[type="text"]:nth-child(2)').value
    if (name && age) {
      var user = { name, age }
      axios.post('http://localhost:8000/users', user)
        .then(response => {
          setPeople([...people, response.data])
          document.querySelector('input[type="text"]').value = ''
          document.querySelector('input[type="text"]:nth-child(2)').value = ''
        })
        .catch(error => {
          console.error("There was an error adding the person!", error);
        });
    }
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
    <>
    <div>
      <h1>Hello World</h1>
    </div>
    <div>
      <input type="text" placeholder="Name" />
      <input type="text" placeholder="Age" />
      <button className='add-person-button' onClick={handleAddPerson}>Add person</button>
    </div>
    <div>
      <h2>People List</h2>
          <ul className="people-list">
            {people.map((person, index) => (
              <li key={index}>
                {person.name} - {person.age}
              </li>
            ))}
          </ul>
    </div>
    </>
  )
}

export default App
