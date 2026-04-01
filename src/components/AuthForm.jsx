import { useState } from 'react';
import { supabase } from '../lib/supabase';

function AuthForm() {
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

  return (
    <main className="auth-shell">
      <div className="auth-card">
        <p className="auth-eyebrow">Приватное пространство артиста</p>
        <h1 className="app-title">Приватная студия релизов</h1>
        <p className="auth-text">
          Вход в приложение сейчас доступен через Google. Это самый стабильный и быстрый способ
          попасть в своё приватное хранилище треков.
        </p>

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

        <button type="button" className="oauth-button" onClick={handleGoogleSignIn}>
          Продолжить через Google
        </button>
      </div>
    </main>
  );
}

export default AuthForm;
