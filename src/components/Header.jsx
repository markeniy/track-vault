function Header({ trackCount, userEmail }) {
  return (
    <div className="header-block">
      <p className="auth-eyebrow">
        {'\u041f\u0440\u0438\u0432\u0430\u0442\u043d\u0430\u044f \u0441\u0442\u0443\u0434\u0438\u044f \u0440\u0435\u043b\u0438\u0437\u043e\u0432'}
      </p>
      <h1 className="app-title">
        {'\u041f\u0440\u0438\u0432\u0430\u0442\u043d\u0430\u044f \u0441\u0442\u0443\u0434\u0438\u044f \u0440\u0435\u043b\u0438\u0437\u043e\u0432'}
      </h1>
      <p className="header-subtitle">
        {
          '\u041f\u0440\u0435\u043c\u0438\u0430\u043b\u044c\u043d\u043e\u0435 \u0440\u0430\u0431\u043e\u0447\u0435\u0435 \u043f\u0440\u043e\u0441\u0442\u0440\u0430\u043d\u0441\u0442\u0432\u043e \u0434\u043b\u044f \u0434\u0435\u043c\u043e\u043a, \u043c\u0438\u043a\u0441\u043e\u0432 \u0438 \u0433\u043e\u0442\u043e\u0432\u044b\u0445 \u0440\u0435\u043b\u0438\u0437\u043e\u0432.'
        }
      </p>
      <div className="header-meta">
        <div className="header-chip">
          <span className="header-chip-label">
            {'\u0422\u0440\u0435\u043a\u0438'}
          </span>
          <strong>{trackCount}</strong>
        </div>
        <div className="header-chip">
          <span className="header-chip-label">
            {'\u0410\u043a\u043a\u0430\u0443\u043d\u0442'}
          </span>
          <strong>{userEmail}</strong>
        </div>
      </div>
    </div>
  );
}

export default Header;
