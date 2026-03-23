import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2, Sparkles } from 'lucide-react';
import { getMeeting, deleteMeeting, generateLesson } from '../../services/api';

export default function MeetingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const load = () => {
    getMeeting(id)
      .then((res) => setMeeting(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [id]);

  const handleDelete = async () => {
    if (!confirm('Delete this meeting?')) return;
    await deleteMeeting(id);
    navigate('/dashboard/meetings');
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateLesson(id);
      load();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to generate lesson');
    }
    setGenerating(false);
  };

  if (loading) return <p className="text-gray-500 dark:text-gray-400">Loading...</p>;
  if (!meeting) return <p className="text-gray-500">Meeting not found.</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/dashboard/meetings" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
          <ArrowLeft size={18} className="text-gray-500" />
        </Link>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex-1">{meeting.title || 'Untitled Meeting'}</h2>
        <button onClick={handleDelete} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
          <Trash2 size={18} className="text-red-500" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Client:</span> <Link to={`/dashboard/clients/${meeting.client?.id}`} className="text-blue-600 hover:underline">{meeting.client?.name}</Link></p>
        <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Date:</span> <span className="text-gray-900 dark:text-white">{new Date(meeting.date).toLocaleString()}</span></p>
        {meeting.recordingUrl && <p className="text-sm"><span className="text-gray-500 dark:text-gray-400">Recording:</span> <a href={meeting.recordingUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Open</a></p>}
      </div>

      {meeting.transcriptionText && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Transcription</h3>
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{meeting.transcriptionText}</p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        {meeting.lesson ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">Lesson: {meeting.lesson.title}</h3>
              <Link to={`/dashboard/lessons/${meeting.lesson.id}`} className="text-sm text-blue-600 hover:underline">View full</Link>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">{meeting.lesson.summary}</p>
          </div>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">No lesson generated yet</p>
            <button onClick={handleGenerate} disabled={generating || !meeting.transcriptionText} className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50">
              <Sparkles size={16} /> {generating ? 'Generating...' : 'Generate Lesson'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
