import * as React from 'react';

const GPU_CHECK_TIMEOUT = 20 * 1000;

export const useWatchGPUs = (): { freeGpus: number; totalGpus: number; loaded: boolean } => {
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [freeGpus, setFreeGpus] = React.useState<number>(0);
  const [totalGpus, setTotalGpus] = React.useState<number>(0);

  React.useEffect(() => {
    const fetchGpus = async () => {
      try {
        const res = await fetch('/api/fine-tune/gpu-free');
        if (!res.ok) {
          console.error('Failed to fetch free GPUs:', res.status, res.statusText);
          setFreeGpus(0);
          setTotalGpus(0);
          return;
        }
        const data = await res.json();
        setFreeGpus(data.free_gpus || 0);
        setTotalGpus(data.total_gpus || 0);
      } catch (err) {
        console.error('Error fetching free GPUs:', err);
        setFreeGpus(0);
        setTotalGpus(0);
      } finally {
        setLoaded(true);
      }
    };

    fetchGpus();

    const intervalId = setInterval(fetchGpus, GPU_CHECK_TIMEOUT);

    return () => clearInterval(intervalId);
  }, []);

  return { freeGpus, totalGpus, loaded };
};
