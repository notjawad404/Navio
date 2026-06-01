import { useState } from 'react'
import SignUp from './SignUp'
import ConfirmSignUp from './ConfirmSignUp'
import SignIn from './SignIn'

// Screens: 'signin' | 'signup' | 'confirm'
export default function AuthFlow({ onAuthenticated }) {
  const [screen, setScreen] = useState('signin')
  const [pendingEmail, setPendingEmail] = useState('')

  const handleSignUpSuccess = (email) => {
    setPendingEmail(email)
    setScreen('confirm')
  }

  const handleChangeEmail = () => {
    setScreen('signup')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-3xl font-bold text-indigo-600">Navio</h1>

        {screen === 'signin' && (
          <>
            <SignIn onSuccess={onAuthenticated} />
            <p className="mt-5 text-center text-sm text-gray-500">
              No account?{' '}
              <button
                type="button"
                className="font-medium text-indigo-600 hover:underline"
                onClick={() => setScreen('signup')}
              >
                Sign up
              </button>
            </p>
          </>
        )}

        {screen === 'signup' && (
          <>
            <SignUp onSuccess={handleSignUpSuccess} initialEmail={pendingEmail} />
            <p className="mt-5 text-center text-sm text-gray-500">
              Already have an account?{' '}
              <button
                type="button"
                className="font-medium text-indigo-600 hover:underline"
                onClick={() => setScreen('signin')}
              >
                Sign in
              </button>
            </p>
          </>
        )}

        {screen === 'confirm' && (
          <ConfirmSignUp
            email={pendingEmail}
            onSuccess={() => setScreen('signin')}
            onChangeEmail={handleChangeEmail}
          />
        )}
      </div>
    </div>
  )
}
