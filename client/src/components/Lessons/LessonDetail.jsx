import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { getLesson, regenerateLesson } from '../../services/api';

export default function LessonDetail() {
  const { id } = useParams();
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = () => {
    getLesson(id)
      .then((res) => setLesson(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      await regenerateLesson(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to regenerate');
    }
    setRegenerating(false);
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  if (!lesson) return <p className="text-gray-500">Lesson not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/lessons" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">{lesson.title}</h2>
        <button onClick={handleRegenerate} disabled={regenerating} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50">
          <RefreshCw size={16} className={regenerating ? 'animate-spin' : ''} /> Regenerate
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-2">
        <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Client:</span> <Link to={`/dashboard/clients/${lesson.client?.id}`} className="text-blue-600 hover:underline">{lesson.client?.name}</Link></p>
        <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Meeting:</span> <Link to={`/dashboard/meetings/${lesson.meeting?.id}`} className="text-blue-600 hover:underline">{lesson.meeting?.title || 'View meeting'}</Link></p>
        <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Created:</span> <span className="text-gray-900 dark:text-white">{new Date(lesson.createdAt).toLocaleString()}</span></p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Summary</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lesson.summary}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Key Takeaways</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lesson.keyTakeaways}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Action Items</h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{lesson.actionItems}</p>
      </div>
    </div>
  );
}
