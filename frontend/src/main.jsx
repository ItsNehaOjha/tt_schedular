import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { TeacherProvider } from './context/TeacherContext.jsx'
import { SubjectProvider } from './context/SubjectContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TeacherProvider>
      <SubjectProvider>
        <App />
      </SubjectProvider>
    </TeacherProvider>
  </React.StrictMode>,
)