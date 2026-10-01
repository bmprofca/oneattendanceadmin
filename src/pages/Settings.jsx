import React, { useEffect, useMemo, useState } from 'react';
import { Eye, EyeOff, Save, Settings as SettingsIcon } from 'lucide-react';
import apiCall from '../utils/apiCall';
import { toast } from 'react-hot-toast';

const inputClass = 'w-full px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-gray-900 dark:text-white transition-colors';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState([]);
  const [visibleSecrets, setVisibleSecrets] = useState({});

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await apiCall('/settings');
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to load settings');
      }
      setSettings(result.data || []);
    } catch (error) {
      toast.error(error.message || 'Unable to load settings');
    } finally {
      setLoading(false);
    }
  };

  const groups = useMemo(() => {
    const grouped = new Map();
    settings.forEach((item) => {
      if (!grouped.has(item.group_name)) grouped.set(item.group_name, []);
      grouped.get(item.group_name).push(item);
    });
    return Array.from(grouped.entries());
  }, [settings]);

  const updateValue = (key, value) => {
    setSettings((current) => current.map((item) => (
      item.setting_key === key ? { ...item, setting_value: value } : item
    )));
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await apiCall('/settings', 'PUT', {
        settings: settings.map((item) => ({
          key: item.setting_key,
          value: item.setting_value ?? '',
        })),
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to save settings');
      }
      setSettings(result.data?.settings || settings);
      toast.success(result.message || 'Settings saved');
    } catch (error) {
      toast.error(error.message || 'Unable to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading settings...</div>
    );
  }

  return (
    <form onSubmit={save} className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-gray-900 dark:text-white">
            <SettingsIcon className="w-5 h-5 text-blue-600" />
            <h1 className="text-2xl font-semibold">Settings</h1>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Keys, tokens, and service settings are stored here. Database connection settings stay in the server env file.
          </p>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save settings'}
        </button>
      </div>

      {groups.map(([groupName, items]) => (
        <section key={groupName} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="border-b border-gray-100 dark:border-gray-800 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{groupName}</h2>
          </div>
          <div className="grid gap-4 p-5 md:grid-cols-2">
            {items.map((item) => {
              const isSecret = item.value_type === 'secret';
              const shown = visibleSecrets[item.setting_key];
              return (
                <label key={item.setting_key} className="block">
                  <span className="mb-1.5 flex items-center justify-between gap-2 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {item.label}
                    {item.requires_restart ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Restart</span>
                    ) : null}
                  </span>
                  <div className="relative">
                    <input
                      className={inputClass}
                      type={isSecret && !shown ? 'password' : item.value_type === 'number' ? 'number' : 'text'}
                      step={item.value_type === 'number' ? 'any' : undefined}
                      value={item.setting_value ?? ''}
                      onChange={(event) => updateValue(item.setting_key, event.target.value)}
                      autoComplete="off"
                    />
                    {isSecret ? (
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        onClick={() => setVisibleSecrets((current) => ({
                          ...current,
                          [item.setting_key]: !current[item.setting_key],
                        }))}
                        aria-label={shown ? 'Hide value' : 'Show value'}
                      >
                        {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    ) : null}
                  </div>
                  {item.description ? (
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">{item.description}</span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </section>
      ))}
    </form>
  );
};

export default SettingsPage;
