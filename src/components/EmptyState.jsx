function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-state-orb" />
      <p className="empty-state-title">В твоём хранилище пока нет треков</p>
      <p className="empty-state-text">
        Добавь первый трек, чтобы собрать приватный каталог идей, черновиков,
        миксов и готовых релизов.
      </p>
    </div>
  );
}

export default EmptyState;

