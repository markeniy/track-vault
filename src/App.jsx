import { useEffect, useState } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import CustomSelect from './components/CustomSelect';
import Header from './components/Header';
import StatusFilter from './components/StatusFilter';
import TrackList from './components/TrackList';
import { supabase } from './lib/supabase';

const initialForm = {
  title: '',
  bpm: '',
  status: 'idea',
  comment: '',
  visibility: 'private',
};

function App() {
  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [tracks, setTracks] = useState([]);
  const [activeLibrary, setActiveLibrary] = useState('mine');
  const [activeAudienceFilter, setActiveAudienceFilter] = useState('mine');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingTrackId, setEditingTrackId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({
    type: '',
    text: '',
  });

  function isMissingCommentColumnError(error) {
    const errorText = [
      error?.message || '',
      error?.details || '',
      error?.hint || '',
    ]
      .join(' ')
      .toLowerCase();

    return errorText.includes('comment') && errorText.includes('column');
  }

  async function loadTracksForUser(userId) {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .or('user_id.eq.' + userId + ',visibility.eq.public')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Ошибка загрузки треков:', error);
      return [];
    }

    setTracks(data || []);
    return data || [];
  }

  useEffect(function () {
    async function loadSession() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Ошибка загрузки сессии:', error);
        setIsSessionLoading(false);
        return;
      }

      setSession(data.session);
      setIsSessionLoading(false);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(function (_event, nextSession) {
      setSession(nextSession);
      setIsSessionLoading(false);
    });

    return function () {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(function () {
    async function loadTracks() {
      if (!session?.user) {
        setTracks([]);
        return;
      }

      await loadTracksForUser(session.user.id);
    }

    loadTracks();
  }, [session]);

  function handleToggleForm() {
    setFeedback({
      type: '',
      text: '',
    });

    if (isFormOpen) {
      setIsFormOpen(false);
      setEditingTrackId(null);
      setFormData(initialForm);
      return;
    }

    setEditingTrackId(null);
    setFormData(initialForm);
    setIsFormOpen(true);
  }

  function handleChange(event) {
    const { name, value } = event.target;

    if (feedback.text) {
      setFeedback({
        type: '',
        text: '',
      });
    }

    setFormData(function (currentForm) {
      return {
        ...currentForm,
        [name]: value,
      };
    });
  }

  const visibilityOptions = [
    { value: 'private', label: 'Приватный' },
    { value: 'public', label: 'Публичный' },
  ];

  function handleEdit(track) {
    setFeedback({
      type: '',
      text: '',
    });
    setEditingTrackId(track.id);
    setFormData({
      title: track.title,
      bpm: String(track.bpm),
      status: track.status,
      comment: track.comment || '',
      visibility: track.visibility || 'private',
    });
    setIsFormOpen(true);
  }

  function handleResetTools() {
    setActiveLibrary('mine');
    setActiveAudienceFilter('mine');
    setActiveFilter('all');
    setSearchQuery('');
    setSortBy('newest');
  }

  function handleAudienceFilterChange(event) {
    const nextValue = event.target.value;

    setActiveAudienceFilter(nextValue);
    setActiveLibrary(nextValue === 'public' ? 'community' : 'mine');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFeedback({
      type: '',
      text: '',
    });

    if (!session?.user) {
      setFeedback({
        type: 'error',
        text: 'Сессия не найдена. Перезайди в аккаунт и попробуй снова.',
      });
      return;
    }

    setIsSaving(true);

    if (editingTrackId) {
      let updateResult = await supabase
        .from('tracks')
        .update({
          title: formData.title,
          bpm: Number(formData.bpm),
          status: formData.status,
          comment: formData.comment,
          visibility: formData.visibility,
        })
        .eq('id', editingTrackId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (updateResult.error && isMissingCommentColumnError(updateResult.error)) {
        console.error('Колонка comment не найдена:', updateResult.error);

        updateResult = await supabase
          .from('tracks')
          .update({
            title: formData.title,
            bpm: Number(formData.bpm),
            status: formData.status,
            visibility: formData.visibility,
          })
          .eq('id', editingTrackId)
          .eq('user_id', session.user.id)
          .select()
          .single();

        if (!updateResult.error) {
          setFeedback({
            type: 'info',
            text: 'Трек сохранён, но комментарий не записался. Чтобы он сохранялся, добавь колонку comment в таблицу tracks.',
          });
        }
      }

      const { data, error } = updateResult;

      if (error) {
        console.error('Ошибка обновления трека:', error);
        setFeedback({
          type: 'error',
          text: 'Не удалось сохранить изменения. Проверь консоль и настройки таблицы tracks.',
        });
        setIsSaving(false);
        return;
      }

      if (!data) {
        await loadTracksForUser(session.user.id);
      } else {
        setTracks((prev) =>
          prev.map((track) =>
            track.id === editingTrackId ? data : track
          )
        );
      }
    } else {
      const newTrack = {
        title: formData.title,
        bpm: Number(formData.bpm),
        status: formData.status,
        comment: formData.comment,
        visibility: formData.visibility,
        user_id: session.user.id,
      };

      let insertResult = await supabase
        .from('tracks')
        .insert([newTrack])
        .select()
        .single();

      if (insertResult.error && isMissingCommentColumnError(insertResult.error)) {
        console.error('Колонка comment не найдена:', insertResult.error);

        insertResult = await supabase
          .from('tracks')
          .insert([
            {
              title: formData.title,
              bpm: Number(formData.bpm),
              status: formData.status,
              visibility: formData.visibility,
              user_id: session.user.id,
            },
          ])
          .select()
          .single();

        if (!insertResult.error) {
          setFeedback({
            type: 'info',
            text: 'Трек сохранён, но комментарий не записался. Чтобы он сохранялся, добавь колонку comment в таблицу tracks.',
          });
        }
      }

      const { data, error } = insertResult;

      if (error) {
        console.error('Ошибка добавления трека:', error);
        setFeedback({
          type: 'error',
          text: 'Не удалось сохранить трек. Проверь консоль и структуру таблицы tracks.',
        });
        setIsSaving(false);
        return;
      }

      if (!data) {
        await loadTracksForUser(session.user.id);
      } else {
        setTracks(function (currentTracks) {
          return [data, ...currentTracks];
        });
      }
    }

    setFormData(initialForm);
    setEditingTrackId(null);
    setIsFormOpen(false);
    setIsSaving(false);
  }

  async function handleDelete(id) {
    if (!session?.user) {
      return;
    }

    const { error } = await supabase
      .from('tracks')
      .delete()
      .eq('id', id)
      .eq('user_id', session.user.id);

    if (error) {
      console.error('Ошибка удаления трека:', error);
      return;
    }

    setTracks(function (previousTracks) {
      return previousTracks.filter(function (track) {
        return track.id !== id;
      });
    });
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Ошибка выхода из аккаунта:', error);
    }
  }

  const libraryTracks = tracks.filter(function (track) {
    if (activeAudienceFilter === 'all') {
      return true;
    }

    if (activeAudienceFilter === 'public') {
      return track.user_id !== session.user.id && track.visibility === 'public';
    }

    return track.user_id === session.user.id;
  });

  const filteredTracks =
    activeFilter === 'all'
      ? libraryTracks
      : libraryTracks.filter(function (track) {
          return track.status === activeFilter;
        });

  const searchedTracks = filteredTracks.filter(function (track) {
    const searchValue = searchQuery.trim().toLowerCase();

    if (!searchValue) {
      return true;
    }

    const title = (track.title || '').toLowerCase();
    const comment = (track.comment || '').toLowerCase();

    return title.includes(searchValue) || comment.includes(searchValue);
  });

  const visibleTracks = [...searchedTracks].sort(function (firstTrack, secondTrack) {
    if (sortBy === 'bpm-asc') {
      return Number(firstTrack.bpm || 0) - Number(secondTrack.bpm || 0);
    }

    if (sortBy === 'bpm-desc') {
      return Number(secondTrack.bpm || 0) - Number(firstTrack.bpm || 0);
    }

    if (sortBy === 'title-asc') {
      return (firstTrack.title || '').localeCompare(secondTrack.title || '', 'ru');
    }

    if (sortBy === 'title-desc') {
      return (secondTrack.title || '').localeCompare(firstTrack.title || '', 'ru');
    }

    if (sortBy === 'oldest') {
      return new Date(firstTrack.created_at || 0) - new Date(secondTrack.created_at || 0);
    }

    return new Date(secondTrack.created_at || 0) - new Date(firstTrack.created_at || 0);
  });

  if (isSessionLoading) {
    return (
      <main className="auth-shell">
        <div className="auth-card">
          <h1 className="app-title">Приватная студия релизов</h1>
          <p className="auth-text">Загрузка...</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return <AuthForm />;
  }

  return (
    <main className="app-shell">
      <div className="app-card">
        <div className="workspace-layout">
          <aside className="sidebar-nav">
            <p className="section-label">Библиотека</p>
            <button
              type="button"
              className={
                activeLibrary === 'mine' ? 'library-button active' : 'library-button'
              }
              onClick={function () {
                setActiveLibrary('mine');
                setActiveAudienceFilter('mine');
              }}
            >
              Мои заметки
            </button>
            <button
              type="button"
              className={
                activeLibrary === 'community' ? 'library-button active' : 'library-button'
              }
              onClick={function () {
                setActiveLibrary('community');
                setActiveAudienceFilter('public');
              }}
            >
              Заметки других артистов
            </button>
          </aside>

          <div className="workspace-main">
            <div className="app-topbar">
              <Header trackCount={libraryTracks.length} userEmail={session.user.email} />
              <div className="topbar-actions">
                <button type="button" className="add-track-button" onClick={handleToggleForm}>
                  {isFormOpen ? 'Закрыть форму' : 'Добавить трек'}
                </button>
                <button type="button" className="secondary-button" onClick={handleSignOut}>
                  Выйти
                </button>
              </div>
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

            {isFormOpen ? (
              <form className="track-form" onSubmit={handleSubmit}>
                <div className="section-heading form-heading">
                  <p className="section-label">Редактор трека</p>
                  <h2 className="section-title">
                    {editingTrackId ? 'Редактировать трек' : 'Добавить новый трек'}
                  </h2>
                </div>

                <div className="form-field">
                  <label htmlFor="title">Название</label>
                  <input
                    id="title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Введите название трека"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="bpm">BPM</label>
                  <input
                    id="bpm"
                    name="bpm"
                    type="number"
                    value={formData.bpm}
                    onChange={handleChange}
                    placeholder="Введите BPM"
                    required
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="status">Статус</label>
                  <CustomSelect
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={[
                      { value: 'idea', label: 'Идея' },
                      { value: 'draft', label: 'Черновик' },
                      { value: 'mix', label: 'Микс' },
                      { value: 'released', label: 'Релиз' },
                    ]}
                  />
                </div>

                <div className="form-field form-field-wide">
                  <label htmlFor="comment">Заметки / Текст</label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={formData.comment}
                    onChange={handleChange}
                    placeholder="Запиши идеи, текст куплета, референсы или любые рабочие заметки"
                    rows="6"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="visibility">Доступ</label>
                  <CustomSelect
                    id="visibility"
                    name="visibility"
                    value={formData.visibility}
                    onChange={handleChange}
                    options={visibilityOptions}
                  />
                </div>

                <button type="submit" className="save-track-button" disabled={isSaving}>
                  {isSaving
                    ? 'Сохраняем...'
                    : editingTrackId
                      ? 'Сохранить изменения'
                      : 'Сохранить трек'}
                </button>
              </form>
            ) : null}

            <div className="tools-grid tools-grid-single">
              <div className="search-panel">
                <div className="section-heading">
                  <p className="section-label">Поиск</p>
                  <h2 className="section-title">Название и заметки</h2>
                </div>

                <div className="search-input-wrap">
                  <span className="search-icon" aria-hidden="true">Поиск</span>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={function (event) {
                      setSearchQuery(event.target.value);
                    }}
                    placeholder=""
                  />
                </div>
              </div>
            </div>

            <div className="tools-actions">
              <button type="button" className="secondary-button" onClick={handleResetTools}>
                Сбросить фильтры
              </button>
            </div>

            <StatusFilter
              activeFilter={activeFilter}
              onFilterChange={function (event) {
                setActiveFilter(event.target.value);
              }}
              sortBy={sortBy}
              onSortChange={function (event) {
                setSortBy(event.target.value);
              }}
              activeAudienceFilter={activeAudienceFilter}
              onAudienceChange={handleAudienceFilterChange}
            />
            <TrackList
              tracks={visibleTracks}
              onDelete={handleDelete}
              onEdit={handleEdit}
              searchQuery={searchQuery}
              currentUserId={session.user.id}
            />
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;


