import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { GoogleOAuthProvider } from "@react-oauth/google"

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId="20825754415-44sa21kcii8v5f90b7jcf1vnb677e5r7.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
)