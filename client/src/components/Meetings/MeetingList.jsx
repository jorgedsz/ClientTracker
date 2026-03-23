import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getMeetings, getClients, createMeeting } from '../../services/api';

export default function MeetingList() {
  const [meetings, setMeetings] = useState([]);
  const [clients, setClients] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ clientId: '', title: '', date: '', transcriptionText: '' });
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([getMeetings(), getClients()])
      .then(([mRes, cRes]) => {
        setMeetings(mRes.data);
        setClients(cRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.clientId || !form.date) return;
    await createMeeting({ ...form, clientId: parseInt(form.clientId) });
    setForm({ clientId: '', title: '', date: '', transcriptionText: '' });
    setShowForm(false);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meetings</h2>
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
          <Plus size={16} /> New Meeting
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white">
            <option value="">Select Client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white" />
          <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white" />
          <textarea placeholder="Transcription text" rows={3} value={form.transcriptionText} onChange={(e) => setForm({ ...form, transcriptionText: e.target.value })} className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white" />
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700">Create</button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : meetings.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No meetings yet.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {meetings.map((m) => (
            <Link key={m.id} to={`/dashboard/meetings/${m.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{m.title || 'Untitled Meeting'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{m.client?.name} - {new Date(m.date).toLocaleDateString()}</p>
              </div>
              {m.lesson && <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">Has Lesson</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
