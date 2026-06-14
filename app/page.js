'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [userId, setUserId] = useState(null);
  const [status, setStatus] = useState('LOADING');
  const [data, setData] = useState(null);
  const [file, setFile] = useState(null);

  useEffect(() => {
    let id = localStorage.getItem('indexUserId');
    if (!id) {
      id = `Proselyte-${Math.floor(Math.random() * 10000)}`;
      localStorage.setItem('indexUserId', id);
    }
    setUserId(id);

    const fetchStatus = async () => {
      const res = await fetch(`/api/status?userId=${id}`);
      if(res.ok) {
        const json = await res.json();
        setData(json);
        setStatus(json.status);
      }
    };
    
    fetchStatus();
    // Poll the Loom every 5 seconds to check if a Proxy has judged the proof
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const getPrescript = async () => {
    setStatus('LOADING');
    const res = await fetch('/api/prescript', {
      method: 'POST', body: JSON.stringify({ userId })
    });
    const json = await res.json();
    setData(json);
    setStatus(json.status);
  };

  const submitProof = async (e) => {
    e.preventDefault();
    if (!file) return alert('Upload proof first.');
    setStatus('LOADING');
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const res = await fetch('/api/submit', {
      method: 'POST', body: formData
    });
    
    if(res.ok) {
      const json = await res.json();
      setData(json);
      setStatus(json.status);
    }
  };

  if (status === 'LOADING') return <div className="min-h-screen bg-black text-white p-10 text-center font-mono flex items-center justify-center">Reading the Loom...</div>;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 font-mono">
      <div className="border border-white p-8 max-w-md w-full">
        <h1 className="text-3xl font-bold mb-4 border-b border-white pb-2 tracking-widest">THE INDEX</h1>
        <p className="mb-2 text-gray-400">Identification: <span className="text-white">{userId}</span></p>
        <p className="mb-6 text-gray-400">Reputation: <span className="text-white">{data?.rep}</span></p>

        {status === 'LOCKED' && (
          <div className="text-red-500 border border-red-500 p-4">
            <p>You failed to execute the Prescript.</p>
            <p className="mt-2 text-sm">Locked until: {new Date(data?.lockedUntil).toLocaleString()}</p>
          </div>
        )}

        {status === 'IDLE' && (
          <button onClick={getPrescript} className="bg-white text-black px-4 py-3 hover:bg-gray-300 w-full font-bold transition-colors">
            Receive Prescript
          </button>
        )}

        {status === 'ACTIVE' && (
          <div className="space-y-4">
            <p className="p-4 border border-white italic">"{data?.prescript}"</p>
            <form onSubmit={submitProof} className="flex flex-col gap-4">
              <input type="file" onChange={e => setFile(e.target.files[0])} className="border border-gray-600 p-2 text-sm cursor-pointer" accept="image/*,video/*" />
              <button type="submit" className="bg-white text-black px-4 py-2 hover:bg-gray-300 font-bold transition-colors">
                Submit Proof
              </button>
            </form>
          </div>
        )}

        {status === 'PENDING' && (
          <div className="animate-pulse text-gray-400 border border-gray-600 p-4">
            Your proof has been delivered. Awaiting the judgment of the Proxies...
          </div>
        )}
      </div>
    </div>
  );
}
