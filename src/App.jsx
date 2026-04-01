import { useEffect, useState } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import StatusFilter from './components/StatusFilter';
import TrackList from './components/TrackList';
import { supabase } from './lib/supabase';

const initialForm = {
  title: '',
  bpm: '',
  status: 'idea',
  comment: '',
};

function App() {
  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [tracks, setTracks] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formData, setFormData] = useState(initialForm);
  const [editingTrackId, setEditingTrackId] = useState(null);

  async function loadTracksForUser(userId) {
    const { data, error } = await supabase
      .from('tracks')
      .select('*')
      .eq('user_id', userId)
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

    setFormData(function (currentForm) {
      return {
        ...currentForm,
        [name]: value,
      };
    });
  }

  function handleEdit(track) {
    setEditingTrackId(track.id);
    setFormData({
      title: track.title,
      bpm: String(track.bpm),
      status: track.status,
      comment: track.comment || '',
    });
    setIsFormOpen(true);
  }

  function handleResetTools() {
    setActiveFilter('all');
    setSearchQuery('');
    setSortBy('newest');
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!session?.user) {
      return;
    }

    if (editingTrackId) {
      const { data, error } = await supabase
        .from('tracks')
        .update({
          title: formData.title,
          bpm: Number(formData.bpm),
          status: formData.status,
          comment: formData.comment,
        })
        .eq('id', editingTrackId)
        .eq('user_id', session.user.id)
        .select()
        .single();

      if (error) {
        console.error('Ошибка обновления трека:', error);
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
        user_id: session.user.id,
      };

      const { data, error } = await supabase
        .from('tracks')
        .insert([newTrack])
        .select()
        .single();

      if (error) {
        console.error('Ошибка добавления трека:', error);
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

  const filteredTracks =
    activeFilter === 'all'
      ? tracks
      : tracks.filter(function (track) {
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
        <div className="app-topbar">
          <Header trackCount={tracks.length} userEmail={session.user.email} />
          <div className="topbar-actions">
            <button type="button" className="add-track-button" onClick={handleToggleForm}>
              {isFormOpen ? 'Закрыть форму' : 'Добавить трек'}
            </button>
            <button type="button" className="secondary-button" onClick={handleSignOut}>
              Выйти
            </button>
          </div>
        </div>

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
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="idea">Идея</option>
                <option value="draft">Черновик</option>
                <option value="mix">Микс</option>
                <option value="released">Релиз</option>
              </select>
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

            <button type="submit" className="save-track-button">
              {editingTrackId ? 'Сохранить изменения' : 'Сохранить трек'}
            </button>
          </form>
        ) : null}

        <div className="tools-grid">
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
                placeholder="Ищи по названию трека, тексту песни или заметкам"
              />
            </div>
          </div>

          <div className="sort-panel">
            <div className="section-heading">
              <p className="section-label">Сортировка</p>
              <h2 className="section-title">Порядок списка</h2>
            </div>

            <div className="form-field">
              <select
                value={sortBy}
                onChange={function (event) {
                  setSortBy(event.target.value);
                }}
              >
                <option value="newest">Сначала новые</option>
                <option value="oldest">Сначала старые</option>
                <option value="bpm-asc">BPM: по возрастанию</option>
                <option value="bpm-desc">BPM: по убыванию</option>
                <option value="title-asc">Название: А-Я</option>
                <option value="title-desc">Название: Я-А</option>
              </select>
            </div>
          </div>
        </div>

        <div className="tools-actions">
          <button type="button" className="secondary-button" onClick={handleResetTools}>
            Сбросить фильтры
          </button>
        </div>

        <StatusFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        <TrackList
          tracks={visibleTracks}
          onDelete={handleDelete}
          onEdit={handleEdit}
          searchQuery={searchQuery}
        />
      </div>
    </main>
  );
}

export default App;


