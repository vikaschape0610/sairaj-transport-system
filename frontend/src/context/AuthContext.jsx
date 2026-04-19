import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Restore user from sessionStorage on mount
    // sessionStorage clears automatically when browser tab is closed (secure)
    const userId    = sessionStorage.getItem('userId')
    const userName  = sessionStorage.getItem('userName')
    const userEmail = sessionStorage.getItem('userEmail')
    const userToken = sessionStorage.getItem('userToken')
    if (userId && userName) {
      setUser({ id: userId, name: userName, email: userEmail, token: userToken })
    }
  }, [])

  const login = (userData) => {
    sessionStorage.setItem('userId',    userData.id)
    sessionStorage.setItem('userName',  userData.name)
    sessionStorage.setItem('userEmail', userData.email)
    sessionStorage.setItem('userToken', userData.token)
    setUser(userData)
  }

  const logout = () => {
    sessionStorage.removeItem('userId')
    sessionStorage.removeItem('userName')
    sessionStorage.removeItem('userEmail')
    sessionStorage.removeItem('userToken')
    setUser(null)
  }

  const isLoggedIn = !!user

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export default AuthContext
