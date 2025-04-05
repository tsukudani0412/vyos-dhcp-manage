import https from 'https';

const fetch = require('node-fetch');

interface DhcpLease {
  ipAddress: string;
  macAddress: string;
  state: string;
  leaseStart: string;
  leaseExpiration: string;
  remaining: string;
  pool: string;
  hostname: string;
  origin: string;
}

interface SimplifiedLease {
  ipAddress: string;
  macAddress: string;
  hostname: string;
  pool: string;
  expiryTime: string;
}

type VyosResponse = {
  success: boolean;
  data?: string | DhcpLease[] | SimplifiedLease[] | boolean;
  error?: string;
};

export class VyosClient {
  private apiUrl: string;
  private apiKey: string;
  private agent: https.Agent;

  constructor() {
    const apiUrl = process.env.VYOS_API_URL;
    const apiKey = process.env.VYOS_API_KEY;

    if (!apiUrl || !apiKey) {
      throw new Error('VYOS_API_URL and VYOS_API_KEY must be set in .env.local');
    }

    // Remove trailing slash from URL if present
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
    this.agent = new https.Agent({
      rejectUnauthorized: false
    });
  }

  private async sendRequest(endpoint: string, data: any): Promise<VyosResponse> {
    try {
      if (!this.apiUrl || !this.apiKey) {
        throw new Error('VyOS API configuration is missing');
      }

      // Create form data with proper encoding
      const params = new URLSearchParams();
      params.append('key', this.apiKey);
      params.append('data', JSON.stringify(data));

      const url = `${this.apiUrl}${endpoint}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
        agent: this.agent
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
      }

      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`Failed to parse response as JSON: ${responseText}`);
      }

      return result;
    } catch (error: unknown) {
      console.error('API request failed:', error);
      if (error instanceof Error) {
        return { success: false, error: error.message };
      }
      return { success: false, error: 'An unknown error occurred' };
    }
  }

  async getDhcpLeases(type: string): Promise<VyosResponse> {
    const response = await this.sendRequest('/show', {
      op: 'show',
      path: ['dhcp', 'server', type]
    });

    if (!response.success || !response.data || typeof response.data !== 'string') {
      return response;
    }

    // Parse the table-formatted string into structured data
    const lines = response.data.split('\n');
    if (lines.length < 3) {
      return { success: false, error: 'Invalid response format' };
    }

    // Skip header and separator lines (first two lines)
    const leases: SimplifiedLease[] = lines.slice(2)
      .filter(line => line.trim().length > 0)
      .map(line => {
        // Split by tabs or multiple spaces
        const parts = line.split(/[\t\s]+/).filter(Boolean);

        if (type == 'static-mapping') {
          return {
            ipAddress: parts[3]?.trim() || '',
            macAddress: parts[4]?.trim() || '',
            hostname: parts[2]?.trim() || '',
            pool: parts[0]?.trim(),
            expiryTime: 'N/A'
          };
        }
        if (parts.length >= 4) {
          return {
            ipAddress: parts[0]?.trim() || '',
            macAddress: parts[1]?.trim() || '',
            hostname: parts[9]?.trim() || '',
            pool: parts[8]?.trim(),
            expiryTime: parts[5]+'_'+parts[6]?.trim() || '' // LeaseStartを使用
          };
        }

        // フォールバック：空のオブジェクトを返す
        return {
          ipAddress: '',
          macAddress: '',
          hostname: '',
          pool: '',
          expiryTime: ''
        };
      })
      .filter(lease => lease.ipAddress && lease.macAddress); // 有効なエントリのみを保持

    return { success: true, data: leases };
  }

  async setStaticMapping(pool: string, subnet: string, hostname: string, ipAddress: string, macAddress: string): Promise<VyosResponse> {
    return this.sendRequest('/configure', [
      {
        op: 'set',
        path: [
          'service',
          'dhcp-server',
          'shared-network-name',
          pool,
          'subnet',
          subnet,
          'static-mapping',
          hostname,
          'mac',
          macAddress
        ]
      },
      {
        op: 'set',
        path: [
          'service',
          'dhcp-server',
          'shared-network-name',
          pool,
          'subnet',
          subnet,
          'static-mapping',
          hostname,
          'ip-address',
          ipAddress
        ]
      }
    ]);
  }

  async deleteStaticMapping(pool: string, subnet: string, hostname: string): Promise<VyosResponse> {
    return this.sendRequest('/configure', {
      op: 'delete',
      path: [
        'service',
        'dhcp-server',
        'shared-network-name',
        pool,
        'subnet',
        subnet,
        'static-mapping',
        hostname,
      ]
    });
  }
}
