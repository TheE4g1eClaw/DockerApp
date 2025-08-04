import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [people, setPeople] = useState([])
  var handleAddPerson = () => {
    const name = document.querySelector('input[type="text"]').value
    const age = document.querySelector('input[type="text"]:nth-child(2)').value
    if (name && age) {
      setPeople([...people, { name, age }])
      document.querySelector('input[type="text"]').value = ''
      document.querySelector('input[type="text"]:nth-child(2)').value = ''
    }
  }

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
