import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, ExternalLink, RefreshCw, X } from 'lucide-react';
import { getGmailStatus, getGmailAuthUrl, disconnectGmail, pollGmailNow } from '../../services/api';

export default function GmailSetup() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState({ gmail_connected: false, gmail_email: null });
  const [loading, setLoading] = useState(true);
  const [polling, setPolling] = useState(false);

  const loadStatus = () => {
    getGmailStatus()
      .then((res) => setStatus(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadStatus, []);

  const handleConnect = async () => {
    try {
      const res = await getGmailAuthUrl();
      if (res.data.url) {
        window.location.href = res.data.url;
      } else {
        alert('Failed to get auth URL. Check that Google credentials are configured in environment variables.');
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to connect Gmail. Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Gmail?')) return;
    await disconnectGmail();
    loadStatus();
  };

  const handlePoll = async () => {
    setPolling(true);
    try {
      await pollGmailNow();
    } catch (err) {
      alert(err.response?.data?.error || 'Poll failed');
    }
    setPolling(false);
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Gmail Integration</h2>

      {searchParams.get('connected') === 'true' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-sm text-green-700 dark:text-green-300">
          Gmail connected successfully!
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        {status.gmail_connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Mail size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Gmail Connected</p>
                {status.gmail_email && <p className="text-sm text-gray-500 dark:text-gray-400">{status.gmail_email}</p>}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handlePoll} disabled={polling} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50">
                <RefreshCw size={16} className={polling ? 'animate-spin' : ''} /> {polling ? 'Polling...' : 'Poll Now'}
              </button>
              <button onClick={handleDisconnect} className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                <X size={16} /> Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-6">
            <Mail size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-4">Connect your Gmail to automatically import meeting transcriptions</p>
            <button onClick={handleConnect} className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
              <ExternalLink size={16} /> Connect Gmail
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
