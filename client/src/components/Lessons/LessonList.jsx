import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getLessons } from '../../services/api';

export default function LessonList() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLessons()
      .then((res) => setLessons(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Lessons</h2>

      {loading ? (
        <p className="text-gray-500 dark:text-gray-400">Loading...</p>
      ) : lessons.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">No lessons yet. Generate one from a meeting.</p>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {lessons.map((lesson) => (
            <Link key={lesson.id} to={`/dashboard/lessons/${lesson.id}`} className="block px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <p className="font-medium text-gray-900 dark:text-white">{lesson.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{lesson.client?.name} - {new Date(lesson.createdAt).toLocaleDateString()}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">{lesson.summary}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
