import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';

const TournamentResultPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { token, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'https://api.gameonesport.xyz/api';
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchResults = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError('');

        const authToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);

        const response = await fetch(`${apiBaseUrl}/tournaments/${id}/results`, {
          headers: {
            ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            if (!cancelled) {
              router.push('/login');
            }
            return;
          }

          if (response.status === 404) {
            if (!cancelled) {
              setResults(null);
              setError('Results not found yet for this tournament. Please check again later.');
            }
            return;
          }

          if (!cancelled) {
            setError('Unable to load results right now. Please try again.');
          }
          return;
        }

        const data = await response.json().catch(() => null);
        const payload = data?.data || data;

        if (!cancelled) {
          setResults(payload || null);
        }
      } catch (e) {
        console.error('TournamentResultPage fetch error:', e);
        if (!cancelled) {
          setError('Unable to load results right now. Please try again.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (!authLoading) {
      fetchResults();
    }

    return () => {
      cancelled = true;
    };
  }, [id, apiBaseUrl, token, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-10">
      <div className="container-custom">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <h1 className="text-2xl font-bold text-white">Tournament Results</h1>
            <button
              className="btn-secondary"
              onClick={() => {
                if (id) router.push(`/tournaments/${id}`);
                else router.push('/tournaments');
              }}
            >
              Back
            </button>
          </div>

          {error ? (
            <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-white/80">
              {error}
            </div>
          ) : null}

          {!error && !results ? (
            <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 text-white/80">
              No results available yet.
            </div>
          ) : null}

          {results ? (
            <pre className="mt-4 p-4 rounded-lg bg-black/40 border border-white/10 text-white/80 overflow-auto text-xs">
              {JSON.stringify(results, null, 2)}
            </pre>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TournamentResultPage;
