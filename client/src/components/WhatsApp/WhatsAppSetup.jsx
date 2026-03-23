import { useState, useEffect } from 'react';
import { MessageCircle, Wifi, WifiOff } from 'lucide-react';
import { getWhatsAppStatus, connectWhatsApp, disconnectWhatsApp, getWhatsAppQr, getWhatsAppMessages } from '../../services/api';

export default function WhatsAppSetup() {
  const [status, setStatus] = useState({ connected: false });
  const [qr, setQr] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  const loadStatus = () => {
    getWhatsAppStatus()
      .then((res) => setStatus(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatus();
    getWhatsAppMessages()
      .then((res) => setMessages(res.data))
      .catch(() => {});
  }, []);

  const handleConnect = async () => {
    setConnecting(true);
    try {
      await connectWhatsApp();
      const qrRes = await getWhatsAppQr();
      setQr(qrRes.data.qr);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to connect');
    }
    setConnecting(false);
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect WhatsApp?')) return;
    await disconnectWhatsApp();
    setQr(null);
    loadStatus();
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Integration</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        {status.connected ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <Wifi size={20} className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">WhatsApp Connected</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Listening for messages</p>
              </div>
            </div>
            <button onClick={handleDisconnect} className="px-4 py-2 border border-red-300 text-red-600 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
              Disconnect
            </button>
          </div>
        ) : (
          <div className="text-center py-6">
            {qr ? (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">Scan this QR code with WhatsApp</p>
                <img src={qr} alt="WhatsApp QR" className="mx-auto max-w-xs" />
                <button onClick={loadStatus} className="text-sm text-blue-600 hover:underline">Check status</button>
              </div>
            ) : (
              <>
                <WifiOff size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-4">Connect WhatsApp to track group messages</p>
                <button onClick={handleConnect} disabled={connecting} className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-50">
                  <MessageCircle size={16} /> {connecting ? 'Connecting...' : 'Connect WhatsApp'}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {messages.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Messages</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-96 overflow-auto">
            {messages.slice(0, 50).map((msg) => (
              <div key={msg.id} className={`px-5 py-3 ${msg.isRequest ? 'bg-orange-50 dark:bg-orange-900/10' : ''}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{msg.sender}</p>
                  <span className="text-xs text-gray-400">{new Date(msg.timestamp).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{msg.message}</p>
                {msg.groupName && <p className="text-xs text-gray-400 mt-1">{msg.groupName}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
