import { useState } from 'react';
import { sendJSON } from '../utils/api';

interface Props {
  addToast: (toast: { type: 'success' | 'error'; message: string }) => void;
}

export const SettingsView: React.FC<Props> = ({ addToast }) => {
  const [settings, setSettings] = useState({ ...l4pApp.settings });
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(l4pApp.settings.logo_url || '');

  const notifications = settings.notifications_email || { enabled: false, events: {} };

  const handleChange = (key: string, value: unknown) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const updateNotificationSetting = (eventKey: string, field: 'enabled' | 'subject' | 'body', value: unknown) => {
    setSettings((prev) => {
      const current = prev.notifications_email || { enabled: false, events: {} };
      const eventSettings = current.events?.[eventKey] || { enabled: false, subject: '', body: '' };
      const nextEvents = {
        ...current.events,
        [eventKey]: {
          ...eventSettings,
          [field]: value
        }
      };

      return {
        ...prev,
        notifications_email: {
          ...current,
          events: nextEvents
        }
      };
    });
  };

  const openMedia = () => {
    const mediaFrame = (window as typeof window & { wp?: any }).wp?.media({
      title: 'Select logo',
      multiple: false,
      library: { type: ['image'] }
    });

    if (!mediaFrame) {
      return;
    }

    mediaFrame.on('select', () => {
      const attachment = mediaFrame.state().get('selection').first().toJSON();
      handleChange('logo_id', attachment.id);
      handleChange('logo_url', attachment.url);
      setLogoUrl(attachment.url);
    });

    mediaFrame.open();
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await sendJSON('settings', 'POST', settings);
      setSettings(updated as typeof settings);
      addToast({ type: 'success', message: 'Settings saved.' });
    } catch (error) {
      addToast({ type: 'error', message: 'Could not save settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="l4p-card">
      <h1>Settings</h1>
      <form onSubmit={handleSubmit} className="l4p-settings-grid">
        <label>
          Brand Name
          <input value={settings.brand_name} onChange={(event) => handleChange('brand_name', event.target.value)} />
        </label>
        <div className="l4p-settings-logo">
          <span>Logo</span>
          {logoUrl ? <img src={logoUrl} alt="" className="l4p-logo-image" /> : <p className="l4p-empty">No logo selected.</p>}
          <div className="l4p-toolbar-actions">
            <button type="button" className="l4p-button" onClick={openMedia}>
              Select Logo
            </button>
            {logoUrl && (
              <button
                type="button"
                className="l4p-link"
                onClick={() => {
                  handleChange('logo_id', 0);
                  handleChange('logo_url', '');
                  setLogoUrl('');
                }}
              >
                Remove
              </button>
            )}
          </div>
        </div>
        <label>
          Primary Color
          <input value={settings.primary_color} onChange={(event) => handleChange('primary_color', event.target.value)} />
        </label>
        <label>
          Accent Color
          <input value={settings.accent_color} onChange={(event) => handleChange('accent_color', event.target.value)} />
        </label>
        <label>
          Timezone
          <input value={settings.timezone} onChange={(event) => handleChange('timezone', event.target.value)} />
        </label>
        <label>
          Currency
          <input value={settings.currency} onChange={(event) => handleChange('currency', event.target.value)} />
        </label>
        <label>
          Allow post images
          <input
            type="checkbox"
            checked={Boolean(settings.allow_post_images)}
            onChange={(event) => handleChange('allow_post_images', event.target.checked)}
          />
        </label>
        <label>
          Volunteers can post in Community
          <input
            type="checkbox"
            checked={Boolean(settings.volunteer_community_post)}
            onChange={(event) => handleChange('volunteer_community_post', event.target.checked)}
          />
        </label>
        <label>
          Volunteers can create tasks
          <input
            type="checkbox"
            checked={Boolean(settings.volunteer_create_tasks)}
            onChange={(event) => handleChange('volunteer_create_tasks', event.target.checked)}
          />
        </label>
        <label>
          Enable funding CSV export
          <input
            type="checkbox"
            checked={Boolean(settings.funding_csv_export)}
            onChange={(event) => handleChange('funding_csv_export', event.target.checked)}
          />
        </label>
        <fieldset className="l4p-settings-notifications">
          <legend>Email Notifications</legend>
          <label>
            Enable Emails
            <input
              type="checkbox"
              checked={Boolean(notifications.enabled)}
              onChange={(event) =>
                setSettings((prev) => ({
                  ...prev,
                  notifications_email: {
                    ...notifications,
                    enabled: event.target.checked
                  }
                }))
              }
            />
          </label>
          <div className="l4p-settings-notification-grid">
            {[
              { key: 'task_assigned', label: 'Task assigned' },
              { key: 'funding_added', label: 'New funding entry' },
              { key: 'post_reply', label: 'New community reply' },
              { key: 'new_member', label: 'New member added' }
            ].map((event) => {
              const eventSettings = notifications.events?.[event.key] || { enabled: false, subject: '', body: '' };
              return (
                <div key={event.key} className="l4p-notification-card">
                  <h3>{event.label}</h3>
                  <label>
                    Enabled
                    <input
                      type="checkbox"
                      checked={Boolean(eventSettings.enabled)}
                      onChange={(e) => updateNotificationSetting(event.key, 'enabled', e.target.checked)}
                    />
                  </label>
                  <label>
                    Subject
                    <input
                      value={eventSettings.subject || ''}
                      onChange={(e) => updateNotificationSetting(event.key, 'subject', e.target.value)}
                    />
                  </label>
                  <label>
                    Body
                    <textarea
                      value={eventSettings.body || ''}
                      onChange={(e) => updateNotificationSetting(event.key, 'body', e.target.value)}
                    />
                  </label>
                </div>
              );
            })}
          </div>
        </fieldset>
        <footer>
          <button type="submit" className="l4p-button" disabled={saving}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </footer>
      </form>
    </section>
  );
};
