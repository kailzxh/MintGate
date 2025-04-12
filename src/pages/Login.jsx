import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from '../components/ProtectedRoute';
import { LogIn, Lock, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';

function SignUpForm() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const { signUp, signIn } = useAuth();

  const handleEmailSignUp = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      await signUp(email, password);
      toast.success('Account created successfully!');
    } catch (error) {
      toast.error('Error creating account');
      console.error(error);
    }
  };

  const handlePhoneSignUp = async (e) => {
    e.preventDefault();
    try {
      await signIn.withPhone(phone);  // Assuming `signIn.withPhone` handles phone sign-up
      toast.success('Phone number verification sent');
    } catch (error) {
      toast.error('Error with phone registration');
      console.error(error);
    }
  };

  const handleGoogleSignUp = async () => {
    try {
      await signIn.withGoogle();
      toast.success('Signed up with Google');
    } catch (error) {
      toast.error('Error with Google sign-up');
      console.error(error);
    }
  };

  const handleMetaMaskSignUp = async () => {
    try {
      await signIn.withMetamask();
      toast.success('Signed up with MetaMask');
    } catch (error) {
      toast.error('Error with MetaMask sign-up');
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <UserPlus className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Create your account</h2>
        </div>

        <form onSubmit={handleEmailSignUp} className="mt-8 space-y-6">
          <div className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Sign Up with Email
          </button>
        </form>

        {/* Option to sign up with phone number */}
        <div className="mt-6">
          <form onSubmit={handlePhoneSignUp}>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              type="submit"
              className="mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign Up with Phone
            </button>
          </form>
        </div>

        {/* Buttons for signing up with Google and MetaMask */}
        <div className="mt-6 grid grid-cols-1 gap-3">
          <button
            onClick={handleGoogleSignUp}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
          >
            Sign Up with Google
          </button>
          <button
            onClick={handleMetaMaskSignUp}
            className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
          >
            Sign Up with MetaMask
          </button>
        </div>

        <div className="text-sm text-center">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [showOTP, setShowOTP] = React.useState(false);
  const [otp, setOTP] = React.useState('');
  const { signIn, signUp, forgotPassword, verifyOTP } = useAuth();

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      await signIn.withEmail(email, password);
    } catch (error) {
      console.error(error);
    }
  };

  const handlePhoneLogin = async (e) => {
    e.preventDefault();
    try {
      await signIn.withPhone(phone);
      setShowOTP(true);
    } catch (error) {
      console.error(error);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    try {
      await verifyOTP(phone, otp);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center">
          <LogIn className="mx-auto h-12 w-12 text-indigo-600" />
          <h2 className="mt-6 text-3xl font-bold text-gray-900">Sign in to your account</h2>
        </div>

        <div className="mt-8 space-y-6">
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
            <button
              type="submit"
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign in with Email
            </button>
          </form>

          <div className="text-sm text-center">
            <Link to="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
              Don't have an account? Sign up
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <button
              onClick={() => signIn.withGoogle()}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
            >
              Sign in with Google
            </button>
            <button
              onClick={() => signIn.withMetamask()}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white hover:bg-gray-50"
            >
              Sign in with MetaMask
            </button>
          </div>

          {!showOTP ? (
            <form onSubmit={handlePhoneLogin} className="mt-4">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone number"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Sign in with Phone
              </button>
            </form>
          ) : (
            <form onSubmit={handleOTPVerification} className="mt-4">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOTP(e.target.value)}
                placeholder="Enter OTP"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <button
                type="submit"
                className="mt-2 w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Verify OTP
              </button>
            </form>
          )}

          <div className="text-sm text-center">
            <button
              onClick={() => forgotPassword(email)}
              className="font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot your password?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthRoutes() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignUpForm />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                  <div className="bg-white p-8 rounded-lg shadow-md">
                    <Lock className="h-12 w-12 text-indigo-600 mx-auto" />
                    <h1 className="text-2xl font-bold text-center mt-4">Protected Route</h1>
                    <p className="text-gray-600 text-center mt-2">You're logged in!</p>
                  </div>
                </div>
              </ProtectedRoute>
            }
          />
        </Routes>
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default AuthRoutes;

// Export forms for separate use:
export { LoginForm, SignUpForm };
