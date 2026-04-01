import { useEffect, useState } from 'react';
import './App.css';
import AuthForm from './components/AuthForm';
import CustomSelect from './components/CustomSelect';
import Header from './components/Header';
import ProfilePanel from './components/ProfilePanel';
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

function getDefaultDisplayName(email) {
  return (email || '').split('@')[0] || 'artist';
}

function getAvatarStoragePath(avatarUrl) {
  if (!avatarUrl) {
    return '';
  }

  const marker = '/storage/v1/object/public/avatars/';
  const markerIndex = avatarUrl.indexOf(marker);

  if (markerIndex === -1) {
    return '';
  }

  return decodeURIComponent(avatarUrl.slice(markerIndex + marker.length));
}

function App() {
  const [session, setSession] = useState(null);
  const [isSessionLoading, setIsSessionLoading] = useState(true);
  const [tracks, setTracks] = useState([]);
  const [commentsByTrack, setCommentsByTrack] = useState({});
  const [profile, setProfile] = useState({
    display_name: '',
    avatar_url: '',
  });
  const [profileName, setProfileName] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [isAvatarDeleting, setIsAvatarDeleting] = useState(false);
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

  async function loadProfileForUser(user) {
    const defaultDisplayName = getDefaultDisplayName(user.email);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Ошибка загрузки профиля:', error);
      setProfile({
        display_name: defaultDisplayName,
        avatar_url: '',
      });
      setProfileName(defaultDisplayName);
      return {
        display_name: defaultDisplayName,
        avatar_url: '',
      };
    }

    if (data) {
      const nextProfile = {
        display_name: data.display_name || defaultDisplayName,
        avatar_url: data.avatar_url || '',
      };

      setProfile(nextProfile);
      setProfileName(nextProfile.display_name);
      return nextProfile;
    }

    const { data: insertedProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        {
          id: user.id,
          display_name: defaultDisplayName,
        },
      ])
      .select('id, display_name, avatar_url')
      .single();

    if (insertError) {
      console.error('Ошибка создания профиля:', insertError);
      setProfile({
        display_name: defaultDisplayName,
        avatar_url: '',
      });
      setProfileName(defaultDisplayName);
      return {
        display_name: defaultDisplayName,
        avatar_url: '',
      };
    }

    const nextProfile = {
      display_name: insertedProfile.display_name || defaultDisplayName,
      avatar_url: insertedProfile.avatar_url || '',
    };

    setProfile(nextProfile);
    setProfileName(nextProfile.display_name);
    return nextProfile;
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

    const trackList = data || [];
    const uniqueUserIds = [...new Set(trackList.map(function (track) {
      return track.user_id;
    }))];

    let profilesById = {};

    if (uniqueUserIds.length > 0) {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', uniqueUserIds);

      if (profilesError) {
        console.error('Ошибка загрузки имён артистов:', profilesError);
      } else {
        profilesById = (profilesData || []).reduce(function (result, item) {
          result[item.id] = item;
          return result;
        }, {});
      }
    }

    const mappedTracks = trackList.map(function (track) {
      const artistProfile = profilesById[track.user_id];

      return {
        ...track,
        artist_name:
          artistProfile?.display_name ||
          (track.user_id === userId ? profile.display_name || getDefaultDisplayName(session?.user?.email) : 'Артист'),
      };
    });

    setTracks(mappedTracks);
    return mappedTracks;
  }

  async function loadCommentsForTracks(trackList, userId) {
    const trackIds = (trackList || []).map(function (track) {
      return track.id;
    });

    if (trackIds.length === 0) {
      setCommentsByTrack({});
      return {};
    }

    const { data, error } = await supabase
      .from('track_comments')
      .select('id, track_id, user_id, body, created_at')
      .in('track_id', trackIds)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Ошибка загрузки комментариев:', error);
      setCommentsByTrack({});
      return {};
    }

    const commentList = data || [];
    const uniqueUserIds = [...new Set(commentList.map(function (comment) {
      return comment.user_id;
    }))];

    let commentProfilesById = {};

    if (uniqueUserIds.length > 0) {
      const { data: commentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name')
        .in('id', uniqueUserIds);

      if (profilesError) {
        console.error('Ошибка загрузки авторов комментариев:', profilesError);
      } else {
        commentProfilesById = (commentProfiles || []).reduce(function (result, item) {
          result[item.id] = item;
          return result;
        }, {});
      }
    }

    const groupedComments = commentList.reduce(function (result, comment) {
      const authorProfile = commentProfilesById[comment.user_id];
      const nextComment = {
        ...comment,
        author_name:
          authorProfile?.display_name ||
          (comment.user_id === userId
            ? profile.display_name || getDefaultDisplayName(session?.user?.email)
            : 'Артист'),
      };

      if (!result[comment.track_id]) {
        result[comment.track_id] = [];
      }

      result[comment.track_id].push(nextComment);
      return result;
    }, {});

    setCommentsByTrack(groupedComments);
    return groupedComments;
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
    async function loadWorkspace() {
      if (!session?.user) {
        setTracks([]);
        setCommentsByTrack({});
        setProfile({
          display_name: '',
          avatar_url: '',
        });
        setProfileName('');
        return;
      }

      await loadProfileForUser(session.user);
      const nextTracks = await loadTracksForUser(session.user.id);
      await loadCommentsForTracks(nextTracks, session.user.id);
    }

    loadWorkspace();
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

  function handleProfileNameChange(event) {
    setProfileName(event.target.value);

    if (feedback.text) {
      setFeedback({
        type: '',
        text: '',
      });
    }
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

  async function handleProfileSubmit(event) {
    event.preventDefault();
    setFeedback({
      type: '',
      text: '',
    });

    if (!session?.user) {
      return;
    }

    setIsProfileSaving(true);

    const trimmedName = profileName.trim() || getDefaultDisplayName(session.user.email);

    const { data, error } = await supabase
      .from('profiles')
      .upsert([
        {
          id: session.user.id,
          display_name: trimmedName,
          avatar_url: profile.avatar_url || null,
        },
      ])
      .select('id, display_name, avatar_url')
      .single();

    if (error) {
      console.error('Ошибка сохранения профиля:', error);
      setFeedback({
        type: 'error',
        text: 'Не удалось сохранить имя артиста. Попробуй ещё раз.',
      });
      setIsProfileSaving(false);
      return;
    }

    const nextProfile = {
      display_name: data.display_name || trimmedName,
      avatar_url: data.avatar_url || '',
    };

    setProfile(nextProfile);
    setProfileName(nextProfile.display_name);
    setTracks(function (currentTracks) {
      return currentTracks.map(function (track) {
        if (track.user_id !== session.user.id) {
          return track;
        }

        return {
          ...track,
          artist_name: nextProfile.display_name,
        };
      });
    });

    setFeedback({
      type: 'info',
      text: 'Профиль обновлён. Теперь другие артисты увидят твоё имя именно так.',
    });
    setIsProfileSaving(false);
  }

  async function handleAvatarUpload(event) {
    const file = event.target.files && event.target.files[0];

    if (!file || !session?.user) {
      return;
    }

    setFeedback({
      type: '',
      text: '',
    });
    setIsAvatarUploading(true);

    const fileExt = (file.name.split('.').pop() || 'png').toLowerCase();
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt) ? fileExt : 'png';
    const filePath = session.user.id + '/avatar-' + Date.now() + '.' + safeExt;
    const previousAvatarPath = getAvatarStoragePath(profile.avatar_url);

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'image/' + safeExt,
      });

    if (uploadError) {
      console.error('Ошибка загрузки аватарки:', uploadError);
      setFeedback({
        type: 'error',
        text:
          uploadError.message ||
          'Не удалось загрузить аватарку. Проверь формат файла и попробуй ещё раз.',
      });
      setIsAvatarUploading(false);
      event.target.value = '';
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const nextAvatarUrl = publicUrlData?.publicUrl || '';

    const { data, error } = await supabase
      .from('profiles')
      .upsert([
        {
          id: session.user.id,
          display_name: profileName.trim() || getDefaultDisplayName(session.user.email),
          avatar_url: nextAvatarUrl,
        },
      ])
      .select('id, display_name, avatar_url')
      .single();

    if (error) {
      console.error('Ошибка сохранения аватарки:', error);
      setFeedback({
        type: 'error',
        text:
          error.message ||
          'Аватарка загрузилась, но ссылка не сохранилась в профиле. Попробуй ещё раз.',
      });
      setIsAvatarUploading(false);
      event.target.value = '';
      return;
    }

    const nextProfile = {
      display_name: data.display_name || profile.display_name,
      avatar_url: data.avatar_url || nextAvatarUrl,
    };

    setProfile(nextProfile);
    if (previousAvatarPath) {
      const { error: removePreviousError } = await supabase.storage
        .from('avatars')
        .remove([previousAvatarPath]);

      if (removePreviousError) {
        console.error('Ошибка удаления старой аватарки:', removePreviousError);
      }
    }

    setFeedback({
      type: 'info',
      text: 'Аватарка обновлена.',
    });
    setIsAvatarUploading(false);
    event.target.value = '';
  }

  async function handleAvatarDelete() {
    if (!session?.user || !profile.avatar_url) {
      return;
    }

    setFeedback({
      type: '',
      text: '',
    });
    setIsAvatarDeleting(true);

    const avatarPath = getAvatarStoragePath(profile.avatar_url);

    if (avatarPath) {
      const { error: removeError } = await supabase.storage
        .from('avatars')
        .remove([avatarPath]);

      if (removeError) {
        console.error('Ошибка удаления файла аватарки:', removeError);
        setFeedback({
          type: 'error',
          text: removeError.message || 'Не удалось удалить файл аватарки.',
        });
        setIsAvatarDeleting(false);
        return;
      }
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        avatar_url: null,
      })
      .eq('id', session.user.id)
      .select('id, display_name, avatar_url')
      .single();

    if (error) {
      console.error('Ошибка очистки avatar_url:', error);
      setFeedback({
        type: 'error',
        text: error.message || 'Не удалось удалить аватарку из профиля.',
      });
      setIsAvatarDeleting(false);
      return;
    }

    setProfile(function (currentProfile) {
      return {
        ...currentProfile,
        display_name: data.display_name || currentProfile.display_name,
        avatar_url: '',
      };
    });
    setFeedback({
      type: 'info',
      text: 'Аватарка удалена.',
    });
    setIsAvatarDeleting(false);
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
        const nextTracks = await loadTracksForUser(session.user.id);
        await loadCommentsForTracks(nextTracks, session.user.id);
      } else {
        setTracks(function (currentTracks) {
          return currentTracks.map(function (track) {
            return track.id === editingTrackId
              ? {
                  ...data,
                  artist_name: profile.display_name || getDefaultDisplayName(session.user.email),
                }
              : track;
          });
        });
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
        const nextTracks = await loadTracksForUser(session.user.id);
        await loadCommentsForTracks(nextTracks, session.user.id);
      } else {
        setTracks(function (currentTracks) {
          return [
            {
              ...data,
              artist_name: profile.display_name || getDefaultDisplayName(session.user.email),
            },
            ...currentTracks,
          ];
        });
        setCommentsByTrack(function (currentComments) {
          return {
            ...currentComments,
            [data.id]: [],
          };
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
    setCommentsByTrack(function (currentComments) {
      const nextComments = { ...currentComments };
      delete nextComments[id];
      return nextComments;
    });
  }

  async function handleAddComment(trackId, body) {
    if (!session?.user) {
      return false;
    }

    const trimmedBody = body.trim();

    if (!trimmedBody) {
      return false;
    }

    const { data, error } = await supabase
      .from('track_comments')
      .insert([
        {
          track_id: trackId,
          user_id: session.user.id,
          body: trimmedBody,
        },
      ])
      .select('id, track_id, user_id, body, created_at')
      .single();

    if (error) {
      console.error('Ошибка добавления комментария:', error);
      setFeedback({
        type: 'error',
        text: error.message || 'Не удалось оставить комментарий.',
      });
      return false;
    }

    const nextComment = {
      ...data,
      author_name: profile.display_name || getDefaultDisplayName(session.user.email),
    };

    setCommentsByTrack(function (currentComments) {
      const trackComments = currentComments[trackId] || [];
      return {
        ...currentComments,
        [trackId]: [...trackComments, nextComment],
      };
    });

    return true;
  }

  async function handleDeleteComment(trackId, commentId) {
    const { error } = await supabase
      .from('track_comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', session?.user?.id);

    if (error) {
      console.error('Ошибка удаления комментария:', error);
      setFeedback({
        type: 'error',
        text: error.message || 'Не удалось удалить комментарий.',
      });
      return;
    }

    setCommentsByTrack(function (currentComments) {
      const trackComments = currentComments[trackId] || [];
      return {
        ...currentComments,
        [trackId]: trackComments.filter(function (comment) {
          return comment.id !== commentId;
        }),
      };
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
    const artistName = (track.artist_name || '').toLowerCase();

    return (
      title.includes(searchValue) ||
      comment.includes(searchValue) ||
      artistName.includes(searchValue)
    );
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
            <p className="section-label">Разделы</p>
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
            <div className="library-subgroup">
              <button
                type="button"
                className={
                  activeLibrary === 'profile' ? 'library-button active' : 'library-button'
                }
                onClick={function () {
                  setActiveLibrary('profile');
                }}
              >
                Личный кабинет
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
            </div>
          </aside>

          <div className="workspace-main">
            <div className="app-topbar">
              <Header
                trackCount={libraryTracks.length}
                userEmail={session.user.email}
                displayName={profile.display_name || getDefaultDisplayName(session.user.email)}
                avatarUrl={profile.avatar_url}
                showTrackCount={activeLibrary !== 'community'}
              />
              <div className="topbar-actions">
                {activeLibrary !== 'profile' ? (
                  <button type="button" className="add-track-button" onClick={handleToggleForm}>
                    {isFormOpen ? 'Закрыть форму' : 'Добавить трек'}
                  </button>
                ) : null}
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

            {activeLibrary === 'profile' ? (
              <ProfilePanel
                displayName={profileName}
                email={session.user.email}
                avatarUrl={profile.avatar_url}
                onChange={handleProfileNameChange}
                onSubmit={handleProfileSubmit}
                onAvatarUpload={handleAvatarUpload}
                onAvatarDelete={handleAvatarDelete}
                isSaving={isProfileSaving}
                isAvatarUploading={isAvatarUploading}
                isAvatarDeleting={isAvatarDeleting}
              />
            ) : (
              <>
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
                      <h2 className="section-title">
                        {activeLibrary === 'community'
                          ? 'Название, заметки и имя артиста'
                          : 'Название и заметки'}
                      </h2>
                    </div>

                <div className="search-input-wrap">
                  {!searchQuery ? (
                    <span className="search-icon" aria-hidden="true">Поиск</span>
                  ) : null}
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
                  onReset={handleResetTools}
                />

                <TrackList
                  tracks={visibleTracks}
                  commentsByTrack={commentsByTrack}
                  onDelete={handleDelete}
                  onEdit={handleEdit}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  searchQuery={searchQuery}
                  currentUserId={session.user.id}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default App;

