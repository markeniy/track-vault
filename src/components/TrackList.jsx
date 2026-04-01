import { Fragment, useState } from 'react';
import EmptyState from './EmptyState';

function TrackList({ tracks, onDelete, onEdit, searchQuery }) {
  const [expandedTrackIds, setExpandedTrackIds] = useState([]);

  const statusLabels = {
    idea: 'Идея',
    draft: 'Черновик',
    mix: 'Микс',
    released: 'Релиз',
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
        return <mark key={index} className="search-highlight">{part}</mark>;
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
          const comment = track.comment || '';
          const isExpanded = expandedTrackIds.includes(track.id);
          const isLongComment = comment.length > 220;
          const isLyricsMode = comment.includes('\n');
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
                  {comment ? <p className={commentClassName}>{highlightText(displayedComment)}</p> : null}
                  {isLongComment ? (
                    <button
                      type="button"
                      className="comment-toggle-button"
                      onClick={function () {
                        handleToggleExpand(track.id);
                      }}
                    >
                      {isExpanded ? 'Свернуть' : 'Показать полностью'}
                    </button>
                  ) : null}
                </div>
                <span className={statusClassName}>{statusLabels[track.status]}</span>
              </div>

              <div className="track-item-actions">
                <button
                  type="button"
                  className="edit-track-button"
                  onClick={function () {
                    onEdit(track);
                  }}
                >
                  Редактировать
                </button>
                <button
                  type="button"
                  className="delete-track-button"
                  onClick={function () {
                    onDelete(track.id);
                  }}
                >
                  Удалить
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

export default TrackList;

