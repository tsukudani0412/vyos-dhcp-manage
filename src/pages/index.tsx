import { useEffect, useState } from 'react';
import LeaseTable from '../components/LeaseTable';
import styles from '../styles/Home.module.css';

type Lease = {
  ipAddress: string;
  macAddress: string;
  hostname: string;
  pool: string;
  expiryTime: string;
};

export default function Home() {
  const [leases, setLeases] = useState<Lease[]>([]);
  const [mappings, setMappings] = useState<Lease[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchLeases = async () => {
    try {
      const lease_response = await fetch('/api/vyos/leases');
      const lease_data = await lease_response.json();
      const mapping_response = await fetch('/api/vyos/mapping');
      const mapping_data = await mapping_response.json();
      
      if (!lease_response.ok) {
        throw new Error(lease_data.error || 'Failed to fetch leases');
      }
      if(!mapping_response.ok) {
        throw new Error(mapping_data.error || 'Failed to fetch static-mapping');
      }

      // リースデータとマッピングデータを別々に保存
      setLeases(lease_data);
      setMappings(mapping_data);
      setError(null);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  const handleReserve = async (lease: Lease) => {
    try {
      const response = await fetch('/api/vyos/reserve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subnet: '10.0.0.0/16',
          hostname: lease.hostname || `host-${lease.ipAddress}`,
          pool: lease.pool,
          ipAddress: lease.ipAddress,
          macAddress: lease.macAddress,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reserve lease');
      }

      // Refresh the lease list
      await fetchLeases();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };


  const handleDelete = async (lease: Lease) => {
    try {
      const response = await fetch('/api/vyos/deleteMap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subnet: '10.0.0.0/16',
          hostname: lease.hostname || `host-${lease.ipAddress}`,
          pool: lease.pool
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete static-mapping');
      }

      await fetchLeases();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    }
  };

  useEffect(() => {
    fetchLeases();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchLeases, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.container}>
      <h1>VyOS DHCP Lease Management</h1>
      {error && <div className={styles.error}>{error}</div>}
      
      <h2>Static Mappings</h2>
      <LeaseTable leases={mappings} onReserve={handleDelete} />

      <h2>DHCP Leases</h2>
      <LeaseTable leases={leases} onReserve={handleReserve} />
      
    </div>
  );
}
