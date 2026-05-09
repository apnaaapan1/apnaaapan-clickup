import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { signInWithGoogle } from '../config/firebase';
import googleLogo from '../assets/google-logo.svg';

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const inviteToken = searchParams.get('inviteToken') || '';
  const inviteEmail = searchParams.get('email') || '';

  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (inviteEmail) {
      setForm((prev) => ({ ...prev, email: inviteEmail }));
    }
  }, [inviteEmail]);

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Enter a valid email';
    }
    if (!form.password) {
      newErrors.password = 'Password is required';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        inviteToken: inviteToken || undefined,
      });

      const { user, accessToken, refreshToken, workspaceId } = res.data;
      login(user, accessToken, refreshToken, workspaceId);
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Registration failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setApiError('');
    setLoading(true);
    try {
      const idToken = await signInWithGoogle();
      const res = await api.post('/auth/google', {
        idToken,
        inviteToken: inviteToken || undefined,
      });

      const { user, accessToken, refreshToken, workspaceId } = res.data;
      login(user, accessToken, refreshToken, workspaceId || '');
      navigate('/');
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Google sign-up failed. Please try again.';
      setApiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-[420px]">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-purple-600">Apnaaapan ClickUp</h1>
            <p className="text-gray-500 text-sm mt-1">Create your account</p>
            {inviteToken && (
              <p className="text-xs text-violet-600 mt-2">
                Sign up to accept your workspace invitation.
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <input
                type="text"
                name="name"
                placeholder="Enter your name"
                value={form.name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <input
                type="password"
                name="password"
                placeholder="Min 6 characters"
                value={form.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
            </div>

            {apiError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {apiError}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors duration-200 flex items-center justify-center"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>

            <button
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full py-2.5 border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
            >
              <img src={googleLogo} alt="Google" className="w-[18px] h-[18px]" />
              <span>Continue with Google</span>
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 font-medium hover:underline">
              Login
            </Link>
          </p>
          {inviteToken && (
            <p className="text-center text-xs text-gray-500 mt-2">
              Already have account?{' '}
              <Link to={`/login?inviteToken=${encodeURIComponent(inviteToken)}&email=${encodeURIComponent(inviteEmail)}`} className="text-purple-600 hover:underline">
                Login and join workspace
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
