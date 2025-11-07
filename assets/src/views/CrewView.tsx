import { useEffect, useState } from 'react';
import { fetchJSON, sendJSON } from '../utils/api';

interface CrewMember {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
  role_label: string;
  skills?: string[];
  avatar?: string;
  disabled?: boolean;
  avatar_url?: string;
}

interface Props {
  addToast: (toast: { type: 'success' | 'error'; message: string }) => void;
}

const emptyMember: Partial<CrewMember> = {
  name: '',
  email: '',
  role: 'l4p_volunteer',
  role_label: 'Volunteer',
  skills: [],
  avatar: ''
};

export const CrewView: React.FC<Props> = ({ addToast }) => {
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [member, setMember] = useState<Partial<CrewMember>>(emptyMember);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [uploading, setUploading] = useState(false);
  const isCoordinator = l4pApp.currentUser.roles.includes('l4p_coordinator');

  const loadCrew = () => {
    fetchJSON<CrewMember[]>('crew')
      .then((items) => setMembers(items))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCrew();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const open = (item?: CrewMember) => {
    if (!isCoordinator) {
      return;
    }
    setMember(item ? { ...item } : emptyMember);
    setAvatarPreview(item?.avatar || '');
    setIsEditing(true);
  };

  const close = () => {
    setIsEditing(false);
    setMember(emptyMember);
    setAvatarPreview('');
  };

  const save = async () => {
    try {
      const payload: Partial<CrewMember> & { avatar_url?: string } = { ...member };
      if (typeof avatarPreview === 'string') {
        payload.avatar_url = avatarPreview;
      }
      delete (payload as any).avatar;

      if (member.id) {
        await sendJSON<CrewMember>(`crew/${member.id}`, 'POST', payload as CrewMember);
      } else {
        await sendJSON<CrewMember>('crew', 'POST', payload as CrewMember);
      }
      addToast({ type: 'success', message: 'Crew updated.' });
      close();
      loadCrew();
    } catch (error) {
      addToast({ type: 'error', message: 'Could not save crew member.' });
    }
  };

  const uploadAvatar = async (file: File) => {
    if (file.size > 1024 * 1024) {
      addToast({ type: 'error', message: 'Avatar must be smaller than 1MB.' });
      return;
    }

    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      addToast({ type: 'error', message: 'Avatar must be a JPG or PNG.' });
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);
    setUploading(true);
    try {
      const response = await fetch(`${l4pApp.root}crew/upload`, {
        method: 'POST',
        headers: {
          'X-WP-Nonce': l4pApp.nonce
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data: { url: string } = await response.json();
      setAvatarPreview(data.url);
      setMember((prev) => ({ ...prev, avatar_url: data.url, avatar: data.url }));
      addToast({ type: 'success', message: 'Avatar uploaded.' });
    } catch (error) {
      addToast({ type: 'error', message: 'Could not upload avatar.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="l4p-stack">
      <header className="l4p-toolbar">
        <h1>Crew</h1>
        {isCoordinator && (
          <button className="l4p-button" onClick={() => open()}>
            Add Member
          </button>
        )}
      </header>

      {loading ? (
        <div className="l4p-skeleton" aria-busy="true" />
      ) : (
        <div className="l4p-crew-grid">
          {members.map((item) => (
            <article key={item.id} className="l4p-crew-card">
              <img src={item.avatar} alt="" role="presentation" />
              {item.disabled && <span className="l4p-badge is-warning">Disabled</span>}
              <h2>{item.name}</h2>
              <p>{item.role_label}</p>
              <p>{item.email}</p>
              {item.phone && <p>{item.phone}</p>}
              <div className="l4p-skill-tags">
                {(item.skills || []).map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
              {isCoordinator && (
                <button className="l4p-link" onClick={() => open(item)}>
                  Manage
                </button>
              )}
            </article>
          ))}
        </div>
      )}

      {isCoordinator && isEditing && (
        <div className="l4p-drawer" role="dialog" aria-modal="true">
          <div className="l4p-drawer-content">
            <header>
              <h2>{member.id ? 'Edit Member' : 'Add Member'}</h2>
              <button aria-label="Close" onClick={close}>
                ×
              </button>
            </header>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                save();
              }}
            >
              <label>
                Name
                <input
                  value={member.name || ''}
                  onChange={(event) => setMember((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={member.email || ''}
                  onChange={(event) => setMember((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </label>
              <label>
                Phone
                <input value={member.phone || ''} onChange={(event) => setMember((prev) => ({ ...prev, phone: event.target.value }))} />
              </label>
              <label className="l4p-avatar-upload">
                Avatar
                {avatarPreview ? <img src={avatarPreview} alt="" className="l4p-avatar-preview" /> : <span className="l4p-empty">No avatar selected.</span>}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      uploadAvatar(file);
                    }
                  }}
                  disabled={uploading}
                />
                {avatarPreview && (
                  <button
                    type="button"
                    className="l4p-link"
                    onClick={() => {
                      setAvatarPreview('');
                      setMember((prev) => ({ ...prev, avatar_url: '', avatar: '' }));
                    }}
                  >
                    Remove Avatar
                  </button>
                )}
              </label>
              <label>
                Role
                <select value={member.role} onChange={(event) => setMember((prev) => ({ ...prev, role: event.target.value }))}>
                  <option value="l4p_volunteer">Volunteer</option>
                  <option value="l4p_coordinator">Coordinator</option>
                </select>
              </label>
              <label>
                Skills (comma separated)
                <input
                  value={(member.skills || []).join(', ')}
                  onChange={(event) => setMember((prev) => ({ ...prev, skills: event.target.value.split(',').map((skill) => skill.trim()).filter(Boolean) }))}
                />
              </label>
              <label>
                Disabled
                <input
                  type="checkbox"
                  checked={Boolean(member.disabled)}
                  onChange={(event) => setMember((prev) => ({ ...prev, disabled: event.target.checked }))}
                />
              </label>
              <footer>
                <button type="submit" className="l4p-button">
                  Save
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
