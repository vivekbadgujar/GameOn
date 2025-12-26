import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../../../contexts/AuthContext';
import { useNotification } from '../../../contexts/NotificationContext';
import LoadingSpinner from '../../../components/UI/LoadingSpinner';

const TournamentResultPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { token, loading: authLoading } = useAuth();
  const { showError } = useNotification();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);

  const apiBaseUrl = useMemo(() => {
    return process.env.NEXT_PUBLIC_API_BASE_URL || process.env.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_URL || 'https://api.gameonesport.xyz/api';
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchResults = async () => {
      if (!id || typeof id !== 'string' || id.trim() === '') {
        showError('Invalid tournament');
        setLoading(false);
        setResults(null);
        setError('Invalid tournament.');
        return;
      }

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

          const errorPayload = await response.json().catch(() => null);
          const serverMessage = errorPayload?.message || errorPayload?.error || '';

          if (response.status === 400 && typeof serverMessage === 'string' && serverMessage.toLowerCase().includes('not available yet')) {
            if (!cancelled) {
              setResults(null);
              setError('Results will be announced soon.');
            }
            return;
          }

          if (response.status === 404) {
            if (!cancelled) {
              setResults(null);
              setError('Results will be announced soon.');
            }
            return;
          }

          if (!cancelled) {
            showError('Unable to load results right now. Please try again.');
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
          showError('Unable to load results right now. Please try again.');
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

  const winners = Array.isArray(results?.winners) ? results.winners : [];
  const tournamentTitle = results?.tournament?.title || 'Tournament';
  const matchSummary = results?.matchSummary || null;
  const hasPublishedResults = winners.length > 0;

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
              Results will be announced soon.
            </div>
          ) : null}

          {!error && results ? (
            <div className="mt-4">
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 text-white">
                <div className="text-white/70">{tournamentTitle}</div>
                {matchSummary ? (
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-black/20 border border-white/10">
                      <div className="text-white/60">Total Kills</div>
                      <div className="text-white font-semibold">{matchSummary.totalKills ?? 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/20 border border-white/10">
                      <div className="text-white/60">Teams</div>
                      <div className="text-white font-semibold">{matchSummary.totalTeams ?? 0}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-black/20 border border-white/10">
                      <div className="text-white/60">Prize Distributed</div>
                      <div className="text-white font-semibold">₹{matchSummary.totalPrizeDistributed ?? 0}</div>
                    </div>
                  </div>
                ) : null}
              </div>

              {!hasPublishedResults ? (
                <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 text-white/80">
                  Results will be announced soon.
                </div>
              ) : (
                <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                  <h2 className="text-lg font-semibold text-white">Winners</h2>
                  <div className="mt-3 space-y-2">
                    {winners.map((w, idx) => (
                      <div key={w?._id || w?.user?._id || idx} className="flex items-center justify-between rounded-lg bg-black/20 border border-white/10 px-3 py-2">
                        <div className="text-white">
                          <span className="text-white/60">#{idx + 1}</span>
                          <span className="ml-2 font-medium">{w?.user?.displayName || w?.user?.username || 'Player'}</span>
                        </div>
                        <div className="text-white/80">₹{w?.prize ?? 0}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default TournamentResultPage;
