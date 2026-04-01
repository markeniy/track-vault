import { useState } from 'react';
import { supabase } from '../lib/supabase';

function AuthForm() {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleGoogleSignIn() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Ошибка входа через Google:', error);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const authAction =
      mode === 'sign-up'
        ? supabase.auth.signUp({
            email,
            password,
          })
        : supabase.auth.signInWithPassword({
            email,
            password,
          });

    const { error } = await authAction;

    if (error) {
      console.error('Ошибка авторизации:', error);
      return;
    }

    setEmail('');
    setPassword('');
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="auth-eyebrow">Приватное пространство артиста</p>
        <h1 className="app-title">Трек Хранилище</h1>
        <p className="auth-text">
          Войди, чтобы видеть свои приватные треки, или создай новый аккаунт.
        </p>

        <button type="button" className="oauth-button" onClick={handleGoogleSignIn}>
          Продолжить через Google
        </button>

        <div className="auth-divider">
          <span>или используй почту</span>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Почта</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={function (event) {
                setEmail(event.target.value);
              }}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={function (event) {
                setPassword(event.target.value);
              }}
              placeholder="Введите пароль"
              required
            />
          </div>

          <button type="submit" className="save-track-button auth-submit-button">
            {mode === 'sign-up' ? 'Зарегистрироваться' : 'Войти'}
          </button>
        </form>

        <button
          type="button"
          className="secondary-button auth-switch-button"
          onClick={function () {
            setMode(function (currentMode) {
              return currentMode === 'sign-up' ? 'sign-in' : 'sign-up';
            });
          }}
        >
          {mode === 'sign-up'
            ? 'Уже есть аккаунт? Войти'
            : 'Нет аккаунта? Зарегистрироваться'}
        </button>
      </div>
    </main>
  );
}

export default AuthForm;
