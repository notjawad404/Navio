import { createContext, useContext, useState, useEffect } from 'react'
import { getCurrentUser, fetchUserAttributes, signOut as amplifySignOut } from 'aws-amplify/auth'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null)
  const [userAttrs, setUserAttrs] = useState(null)
  const [checking, setChecking] = useState(true)

  const loadUser = async () => {
    try {
      const u     = await getCurrentUser()
      const attrs = await fetchUserAttributes()
      setUser(u)
      setUserAttrs(attrs)
    } catch {
      setUser(null)
      setUserAttrs(null)
    } finally {
      setChecking(false)
    }
  }

  useEffect(() => { loadUser() }, [])

  const signOut = async () => {
    await amplifySignOut()
    setUser(null)
    setUserAttrs(null)
  }

  return (
    <AuthContext.Provider value={{ user, userAttrs, checking, signOut, reload: loadUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
