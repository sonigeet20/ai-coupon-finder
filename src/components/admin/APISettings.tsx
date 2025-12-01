import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface Setting {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
}

export const APISettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('*')
      .order('setting_key', { ascending: true });

    if (data) {
      setSettings(data);
      const values: Record<string, string> = {};
      data.forEach(s => {
        values[s.setting_key] = s.setting_value || '';
      });
      setEditValues(values);
    }
  };

  const handleSave = async (settingKey: string) => {
    setLoading(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          setting_value: editValues[settingKey],
          updated_by: user?.id,
          updated_at: new Date().toISOString(),
        })
        .eq('setting_key', settingKey);

      if (error) throw error;
      setMessage(`${settingKey} updated successfully!`);
      fetchSettings();
    } catch (error: any) {
      setMessage(error.message || 'Failed to update setting');
    } finally {
      setLoading(false);
    }
  };

  const maskValue = (value: string, key: string) => {
    if (!value) return '';
    if (key.includes('key') || key.includes('secret')) {
      return value.substring(0, 10) + '••••••••••••••••';
    }
    return value;
  };

  const settingGroups = [
    {
      title: 'AI Services',
      icon: '🤖',
      keys: ['openai_api_key', 'anthropic_api_key'],
    },
    {
      title: 'Cloud Services',
      icon: '☁️',
      keys: ['aws_access_key', 'aws_secret_key', 'aws_region'],
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">API Keys & Settings</h2>

      {message && (
        <div
          className={`mb-6 px-4 py-3 rounded-xl ${
            message.includes('success')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {message}
        </div>
      )}

      <div className="space-y-6">
        {settingGroups.map((group) => {
          const groupSettings = settings.filter(s => group.keys.includes(s.setting_key));
          if (groupSettings.length === 0) return null;

          return (
            <div key={group.title} className="bg-gray-50 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">{group.icon}</span>
                {group.title}
              </h3>
              <div className="space-y-4">
                {groupSettings.map((setting) => (
                  <div key={setting.id} className="bg-white rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <label className="block text-sm font-semibold text-gray-900 mb-1">
                          {setting.setting_key.replace(/_/g, ' ').toUpperCase()}
                        </label>
                        <p className="text-sm text-gray-600 mb-3">{setting.description}</p>
                        <div className="flex gap-3">
                          <input
                            type="password"
                            value={editValues[setting.setting_key] || ''}
                            onChange={(e) =>
                              setEditValues({ ...editValues, [setting.setting_key]: e.target.value })
                            }
                            placeholder={`Enter ${setting.setting_key.replace(/_/g, ' ')}`}
                            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                          <button
                            onClick={() => handleSave(setting.setting_key)}
                            disabled={loading}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all disabled:opacity-50"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                    {setting.setting_value && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <span className="text-xs font-semibold text-gray-500">Current Value:</span>
                        <p className="text-sm text-gray-700 font-mono mt-1">
                          {maskValue(setting.setting_value, setting.setting_key)}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-2xl">
        <h3 className="text-lg font-bold text-blue-900 mb-2">Security Notice</h3>
        <p className="text-sm text-blue-800">
          API keys and secrets are sensitive information. Never share them publicly or commit them to version control.
          All values are securely stored in the database and only visible to administrators.
        </p>
      </div>
    </div>
  );
};
