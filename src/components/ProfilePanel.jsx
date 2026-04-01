function ProfilePanel({
  displayName,
  email,
  avatarUrl,
  onChange,
  onSubmit,
  onAvatarUpload,
  onAvatarDelete,
  isSaving,
  isAvatarUploading,
  isAvatarDeleting,
}) {
  return (
    <section className="profile-panel">
      <div className="section-heading">
        <p className="section-label">{'\u041b\u0438\u0447\u043d\u044b\u0439 \u043a\u0430\u0431\u0438\u043d\u0435\u0442'}</p>
        <h2 className="section-title">{'\u041f\u0440\u043e\u0444\u0438\u043b\u044c \u0430\u0440\u0442\u0438\u0441\u0442\u0430'}</h2>
      </div>

      <form className="profile-form" onSubmit={onSubmit}>
        <div className="profile-avatar-card">
          <span className="profile-meta-label">{'\u0410\u0432\u0430\u0442\u0430\u0440'}</span>
          <div className="profile-avatar-row">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={'\u0410\u0432\u0430\u0442\u0430\u0440 \u0430\u0440\u0442\u0438\u0441\u0442\u0430'}
                className="profile-avatar-image"
              />
            ) : (
              <div className="profile-avatar-placeholder">&#128578;</div>
            )}

            <div className="profile-avatar-copy">
              <p className="profile-meta-text">
                {
                  '\u0417\u0430\u0433\u0440\u0443\u0437\u0438 \u043a\u0432\u0430\u0434\u0440\u0430\u0442\u043d\u0443\u044e \u0438\u043b\u0438 \u043f\u043e\u0440\u0442\u0440\u0435\u0442\u043d\u0443\u044e \u043a\u0430\u0440\u0442\u0438\u043d\u043a\u0443. \u041c\u044b \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u043c \u0435\u0451 \u0432 \u043f\u0440\u043e\u0444\u0438\u043b\u0435 \u0438 \u043f\u043e\u043a\u0430\u0436\u0435\u043c \u0432 \u0448\u0430\u043f\u043a\u0435.'
                }
              </p>
              <div className="profile-avatar-actions">
                <label className="secondary-button profile-upload-button">
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="profile-upload-input"
                    onChange={onAvatarUpload}
                  />
                  {isAvatarUploading
                    ? '\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c...'
                    : avatarUrl
                      ? '\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c'
                      : '\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c'}
                </label>

                {avatarUrl ? (
                  <button
                    type="button"
                    className="delete-track-button profile-delete-button"
                    onClick={onAvatarDelete}
                    disabled={isAvatarDeleting}
                  >
                    {isAvatarDeleting
                      ? '\u0423\u0434\u0430\u043b\u044f\u0435\u043c...'
                      : '\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div className="form-field">
          <label htmlFor="displayName">{'\u0418\u043c\u044f \u0430\u0440\u0442\u0438\u0441\u0442\u0430'}</label>
          <input
            id="displayName"
            name="displayName"
            type="text"
            value={displayName}
            onChange={onChange}
            placeholder={
              '\u0423\u043a\u0430\u0436\u0438 \u0438\u043c\u044f, \u043f\u043e\u0434 \u043a\u043e\u0442\u043e\u0440\u044b\u043c \u0442\u0435\u0431\u044f \u0431\u0443\u0434\u0443\u0442 \u0432\u0438\u0434\u0435\u0442\u044c \u0434\u0440\u0443\u0433\u0438\u0435'
            }
            required
          />
        </div>

        <div className="profile-meta-card">
          <span className="profile-meta-label">{'\u041f\u043e\u0447\u0442\u0430 \u0430\u043a\u043a\u0430\u0443\u043d\u0442\u0430'}</span>
          <strong>{email}</strong>
        </div>

        <button type="submit" className="save-track-button" disabled={isSaving}>
          {isSaving
            ? '\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c \u043f\u0440\u043e\u0444\u0438\u043b\u044c...'
            : '\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u043f\u0440\u043e\u0444\u0438\u043b\u044c'}
        </button>
      </form>
    </section>
  );
}

export default ProfilePanel;
