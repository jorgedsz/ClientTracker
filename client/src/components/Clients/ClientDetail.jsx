import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { getClient, deleteClient, getMeetings } from '../../services/api';

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getClient(id), getMeetings({ clientId: id })])
      .then(([cRes, mRes]) => {
        setClient(cRes.data);
        setMeetings(mRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    await deleteClient(id);
    navigate('/dashboard/clients');
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  if (!client) return <p className="text-gray-500">Client not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/clients" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">{client.name}</h2>
        <Link to={`/dashboard/clients/${id}/edit`} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <Edit size={18} className="text-gray-500" />
        </Link>
        <button onClick={handleDelete} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        {client.email && <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Email:</span> <span className="text-gray-900 dark:text-white">{client.email}</span></p>}
        {client.phone && <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Phone:</span> <span className="text-gray-900 dark:text-white">{client.phone}</span></p>}
        {client.company && <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Company:</span> <span className="text-gray-900 dark:text-white">{client.company}</span></p>}
        {client.notes && <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Notes:</span> <span className="text-gray-900 dark:text-white">{client.notes}</span></p>}
        <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Status:</span> <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${client.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{client.status}</span></p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Meetings ({meetings.length})</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {meetings.length === 0 ? (
            <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No meetings yet.</p>
          ) : meetings.map((m) => (
            <Link key={m.id} to={`/dashboard/meetings/${m.id}`} className="block px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{m.title || 'Untitled Meeting'}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(m.date).toLocaleDateString()}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
