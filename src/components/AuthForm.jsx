import { useState } from 'react';
import { supabase } from '../lib/supabase';

function AuthForm() {
  const [mode, setMode] = useState('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '',
    text: '',
  });

  async function handleGoogleSignIn() {
    setFeedback({
      type: '',
      text: '',
    });

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error('Ошибка входа через Google:', error);
      setFeedback({
        type: 'error',
        text: 'Не удалось начать вход через Google. Проверь настройки провайдера и адреса redirect URL.',
      });
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback({
      type: '',
      text: '',
    });
    setIsSubmitting(true);

    const authAction =
      mode === 'sign-up'
        ? supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: window.location.origin,
            },
          })
        : supabase.auth.signInWithPassword({
            email,
            password,
          });

    const { data, error } = await authAction;

    if (error) {
      console.error('Ошибка авторизации:', error);
      setFeedback({
        type: 'error',
        text:
          mode === 'sign-up'
            ? 'Не удалось зарегистрироваться. Проверь почту, пароль и настройки Email Auth в Supabase.'
            : 'Не удалось войти. Проверь почту, пароль и подтверждение аккаунта.',
      });
      setIsSubmitting(false);
      return;
    }

    if (mode === 'sign-up' && !data.session) {
      setFeedback({
        type: 'info',
        text: 'Аккаунт создан. Подтверди почту через письмо и затем войди в приложение.',
      });
    }

    setEmail('');
    setPassword('');
    setIsSubmitting(false);
  }

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="auth-eyebrow">Приватное пространство артиста</p>
        <h1 className="app-title">Приватная студия релизов</h1>
        <p className="auth-text">
          Войди, чтобы видеть свои приватные треки, или создай новый аккаунт.
        </p>

        <button type="button" className="oauth-button" onClick={handleGoogleSignIn}>
          Продолжить через Google
        </button>

        <div className="auth-divider">
          <span>или используй почту</span>
        </div>

        {feedback.text ? (
          <div
            className={
              feedback.type === 'error'
                ? 'form-message form-message-error'
                : 'form-message form-message-info'
            }
          >
            {feedback.text}
          </div>
        ) : null}

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

          <button
            type="submit"
            className="save-track-button auth-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? 'Отправляем...'
              : mode === 'sign-up'
                ? 'Зарегистрироваться'
                : 'Войти'}
          </button>
        </form>

        <button
          type="button"
          className="secondary-button auth-switch-button"
          onClick={function () {
            setFeedback({
              type: '',
              text: '',
            });
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


