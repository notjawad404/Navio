import { useState } from 'react'
import SignUp from './SignUp'
import ConfirmSignUp from './ConfirmSignUp'
import SignIn from './SignIn'
import ForgotPassword from './ForgotPassword'
import ResetCode from './ResetCode'
import NewPassword from './NewPassword'

// Screens: 'signin' | 'signup' | 'confirm' | 'forgot' | 'reset-code' | 'new-password'
export default function AuthFlow({ onAuthenticated }) {
  const [screen, setScreen] = useState('signin')
  const [pendingEmail, setPendingEmail] = useState('')
  const [pendingResetCode, setPendingResetCode] = useState('')

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-6 text-3xl font-bold text-indigo-600">Navio</h1>

        {screen === 'signin' && (
          <>
            <SignIn
              onSuccess={onAuthenticated}
              onForgotPassword={() => setScreen('forgot')}
            />
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
            <SignUp
              onSuccess={(email) => { setPendingEmail(email); setScreen('confirm') }}
              initialEmail={pendingEmail}
            />
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
            onChangeEmail={() => setScreen('signup')}
          />
        )}

        {screen === 'forgot' && (
          <ForgotPassword
            onCodeSent={(email) => { setPendingEmail(email); setScreen('reset-code') }}
            onBack={() => setScreen('signin')}
          />
        )}

        {screen === 'reset-code' && (
          <ResetCode
            email={pendingEmail}
            onVerified={(code) => { setPendingResetCode(code); setScreen('new-password') }}
            onChangeEmail={() => setScreen('forgot')}
          />
        )}

        {screen === 'new-password' && (
          <NewPassword
            email={pendingEmail}
            code={pendingResetCode}
            onSuccess={() => setScreen('signin')}
          />
        )}
      </div>
    </div>
  )
}
