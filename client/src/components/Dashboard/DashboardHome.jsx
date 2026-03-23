import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Calendar, BookOpen, MessageCircle, Mail, Wifi } from 'lucide-react';
import { getDashboardOverview, getRecentActivity } from '../../services/api';

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link to={to} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon size={20} className="text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </Link>
  );
}

export default function DashboardHome() {
  const [overview, setOverview] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getDashboardOverview(), getRecentActivity()])
      .then(([ovRes, actRes]) => {
        setOverview(ovRes.data);
        setActivity(actRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 dark:text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Active Clients" value={overview?.activeClients ?? 0} color="bg-blue-500" to="/dashboard/clients" />
        <StatCard icon={Calendar} label="Meetings This Month" value={overview?.meetingsThisMonth ?? 0} color="bg-green-500" to="/dashboard/meetings" />
        <StatCard icon={BookOpen} label="Total Lessons" value={overview?.totalLessons ?? 0} color="bg-purple-500" to="/dashboard/lessons" />
        <StatCard icon={MessageCircle} label="Pending Requests" value={overview?.pendingRequests ?? 0} color="bg-orange-500" to="/dashboard/whatsapp" />
      </div>

      <div className="flex gap-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${overview?.gmailConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
          <Mail size={14} /> Gmail {overview?.gmailConnected ? 'Connected' : 'Disconnected'}
        </span>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${overview?.whatsappConnected ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
          <Wifi size={14} /> WhatsApp {overview?.whatsappConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {activity.length === 0 && (
            <p className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
          )}
          {activity.slice(0, 10).map((item) => (
            <div key={`${item.type}-${item.id}`} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.type === 'lesson' ? item.title : `WhatsApp request from ${item.sender}`}
                </p>
                {item.client && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.client.name}</p>
                )}
              </div>
              <span className="text-xs text-gray-400">{new Date(item.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
