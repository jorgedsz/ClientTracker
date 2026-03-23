import { useState, useEffect } from 'react';
import { getSettings, getHealth } from '../../services/api';

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getSettings(), getHealth()])
      .then(([sRes, hRes]) => {
        setSettings(sRes.data);
        setHealth(hRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;

  const statusColor = (s) => s === 'connected' ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400';

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>

      {health && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">System Health</h3>
          <div className="space-y-2">
            <p className="text-sm">Database: <span className={`font-medium ${statusColor(health.database)}`}>{health.database}</span></p>
            <p className="text-sm">Gmail: <span className={`font-medium ${statusColor(health.gmail)}`}>{health.gmail}</span></p>
            <p className="text-sm">WhatsApp: <span className={`font-medium ${statusColor(health.whatsapp)}`}>{health.whatsapp}</span></p>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-3">App Settings</h3>
        {settings.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No settings configured.</p>
        ) : (
          <div className="space-y-2">
            {settings.map((s) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{s.key}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">{s.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
