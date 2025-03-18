import { useEffect, useState } from 'react';
import { DashboardData } from '@/models/InternalHCDData';
import { getDashboardData } from '@/services/dataIntegration';

/**
 * Custom hook to load dashboard data
 */
export function useDataLoader() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setLoading(false);
      }
    }
    
    loadData();
  }, []);
  
  return { data, loading, error, reloadData: () => setLoading(true) };
}

/**
 * Data loader component that wraps the dashboard
 */
interface DataLoaderProps {
  children: (data: DashboardData) => React.ReactNode;
}

export default function DataLoader({ children }: DataLoaderProps) {
  const { data, loading, error } = useDataLoader();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading San Mateo County Housing Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Data</h2>
        <p>{error.message}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="error-container">
        <h2>No Data Available</h2>
        <p>Unable to retrieve housing data at this time.</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return <>{children(data)}</>;
} 