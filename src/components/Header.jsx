function Header({ trackCount, userEmail }) {
  return (
    <div className="header-block">
      <p className="auth-eyebrow">Трек Хранилище</p>
      <h1 className="app-title">Приватная студия релизов</h1>
      <p className="header-subtitle">
        Премиальное рабочее пространство для демок, миксов и готовых релизов.
      </p>
      <div className="header-meta">
        <div className="header-chip">
          <span className="header-chip-label">Треки</span>
          <strong>{trackCount}</strong>
        </div>
        <div className="header-chip">
          <span className="header-chip-label">Аккаунт</span>
          <strong>{userEmail}</strong>
        </div>
      </div>
    </div>
  );
}

export default Header;
