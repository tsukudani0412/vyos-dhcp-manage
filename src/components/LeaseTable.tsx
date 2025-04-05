import { useState } from 'react';
import styles from '../styles/LeaseTable.module.css';

type Lease = {
  ipAddress: string;
  macAddress: string;
  hostname: string;
  pool: string;
  expiryTime: string;
};

type Props = {
  leases: Lease[];
  onReserve: (lease: Lease) => Promise<void>;
};

export default function LeaseTable({ leases, onReserve }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const handleReserve = async (lease: Lease) => {
    setLoading(lease.ipAddress);
    await onReserve(lease);
    setLoading(null);
  };

  return (
    <div className={styles.container}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>IP Address</th>
            <th>MAC Address</th>
            <th>Hostname</th>
            <th>Pool</th>
            <th>Expiry Time</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {leases.map((lease) => (
            <tr key={lease.ipAddress}>
              <td>{lease.ipAddress}</td>
              <td>{lease.macAddress}</td>
              <td>{lease.hostname}</td>
              <td>{lease.pool}</td>
              <td>{lease.expiryTime}</td>
              <td>
                <button
                  onClick={() => handleReserve(lease)}
                  disabled={loading === lease.ipAddress}
                >
                  {loading === lease.ipAddress ? 'Reserving...' : 'Set/Del'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
