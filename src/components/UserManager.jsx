import { useState } from 'react'
import './UserManager.css'

const UserManager = ({ people, onAddPerson }) => {
  const [name, setName] = useState('')
  const [age, setAge] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (name.trim() && age.trim()) {
      onAddPerson({ name: name.trim(), age: age.trim() })
      setName('')
      setAge('')
    }
  }

  return (
    <div className="user-manager">
      <header className="header">
        <h1>Gestión de Usuarios</h1>
        <p>Administra tu lista de usuarios de manera fácil y eficiente</p>
      </header>

      <div className="add-user-section">
        <h2>Agregar Nuevo Usuario</h2>
        <form onSubmit={handleSubmit} className="add-user-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
              required
            />
            <input
              type="number"
              placeholder="Edad"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              className="input-field"
              min="1"
              max="120"
              required
            />
          </div>
          <button type="submit" className="add-button">
            <span>+</span> Agregar Usuario
          </button>
        </form>
      </div>

      <div className="users-section">
        <div className="section-header">
          <h2>Lista de Usuarios</h2>
          <span className="user-count">{people.length} usuario{people.length !== 1 ? 's' : ''}</span>
        </div>
        
        {people.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <p>No hay usuarios registrados</p>
            <small>Agrega tu primer usuario usando el formulario de arriba</small>
          </div>
        ) : (
          <div className="users-grid">
            {people.map((person, index) => (
              <div key={index} className="user-card">
                <div className="user-avatar">
                  {person.name.charAt(0).toUpperCase()}
                </div>
                <div className="user-info">
                  <h3 className="user-name">{person.name}</h3>
                  <p className="user-age">{person.age} años</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default UserManager
