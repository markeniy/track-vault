import { Fragment, useState } from 'react';
import EmptyState from './EmptyState';

function TrackList({ tracks, onDelete, onEdit, searchQuery, currentUserId }) {
  const [expandedTrackIds, setExpandedTrackIds] = useState([]);

  const statusLabels = {
    idea: '\u0418\u0434\u0435\u044f',
    draft: '\u0427\u0435\u0440\u043d\u043e\u0432\u0438\u043a',
    mix: '\u041c\u0438\u043a\u0441',
    released: '\u0420\u0435\u043b\u0438\u0437',
  };

  const visibilityLabels = {
    private: '\u041f\u0440\u0438\u0432\u0430\u0442\u043d\u044b\u0439',
    public: '\u041f\u0443\u0431\u043b\u0438\u0447\u043d\u044b\u0439',
  };

  function handleToggleExpand(trackId) {
    setExpandedTrackIds(function (currentIds) {
      if (currentIds.includes(trackId)) {
        return currentIds.filter(function (id) {
          return id !== trackId;
        });
      }

      return [...currentIds, trackId];
    });
  }

  function highlightText(text) {
    const value = text || '';
    const query = searchQuery.trim();

    if (!query) {
      return value;
    }

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = value.split(new RegExp('(' + escapedQuery + ')', 'gi'));

    return parts.map(function (part, index) {
      if (part.toLowerCase() === query.toLowerCase()) {
        return (
          <mark key={index} className="search-highlight">
            {part}
          </mark>
        );
      }

      return <Fragment key={index}>{part}</Fragment>;
    });
  }

  if (tracks.length === 0) {
    return (
      <section className="track-list">
        <EmptyState />
      </section>
    );
  }

  return (
    <section className="track-list">
      <div className="track-items">
        {tracks.map(function (track) {
          const statusClassName = 'track-status-badge track-status-' + track.status;
          const visibilityClassName =
            'track-visibility-badge track-visibility-' + (track.visibility || 'private');
          const comment = track.comment || '';
          const isExpanded = expandedTrackIds.includes(track.id);
          const isLongComment = comment.length > 220;
          const isLyricsMode = comment.includes('\n');
          const isOwner = track.user_id === currentUserId;
          const displayedComment =
            isLongComment && !isExpanded ? comment.slice(0, 220).trim() + '...' : comment;
          const commentClassName = isLyricsMode
            ? 'track-comment track-comment-lyrics'
            : 'track-comment';

          return (
            <article key={track.id} className="track-item">
              <div className="track-item-header">
                <div>
                  <h2 className="track-item-title">{highlightText(track.title)}</h2>
                  <p className="track-item-text">BPM: {track.bpm}</p>

                  <div className="track-badges">
                    <span className={statusClassName}>{statusLabels[track.status]}</span>
                    <span className={visibilityClassName}>
                      {visibilityLabels[track.visibility] || '\u041f\u0440\u0438\u0432\u0430\u0442\u043d\u044b\u0439'}
                    </span>
                    <span className="track-owner-note">
                      {isOwner
                        ? '\u0422\u0432\u043e\u0439 \u0442\u0440\u0435\u043a'
                        : '\u041f\u0443\u0431\u043b\u0438\u0447\u043d\u044b\u0439 \u0442\u0440\u0435\u043a'}
                    </span>
                  </div>

                  {comment ? (
                    <p className={commentClassName}>{highlightText(displayedComment)}</p>
                  ) : null}

                  {isLongComment ? (
                    <button
                      type="button"
                      className="comment-toggle-button"
                      onClick={function () {
                        handleToggleExpand(track.id);
                      }}
                    >
                      {isExpanded
                        ? '\u0421\u0432\u0435\u0440\u043d\u0443\u0442\u044c'
                        : '\u041f\u043e\u043a\u0430\u0437\u0430\u0442\u044c \u043f\u043e\u043b\u043d\u043e\u0441\u0442\u044c\u044e'}
                    </button>
                  ) : null}
                </div>
              </div>

              {isOwner ? (
                <div className="track-item-actions">
                  <button
                    type="button"
                    className="edit-track-button"
                    onClick={function () {
                      onEdit(track);
                    }}
                  >
                    {'\u0420\u0435\u0434\u0430\u043a\u0442\u0438\u0440\u043e\u0432\u0430\u0442\u044c'}
                  </button>
                  <button
                    type="button"
                    className="delete-track-button"
                    onClick={function () {
                      onDelete(track.id);
                    }}
                  >
                    {'\u0423\u0434\u0430\u043b\u0438\u0442\u044c'}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default TrackList;
