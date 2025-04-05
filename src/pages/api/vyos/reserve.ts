import { NextApiRequest, NextApiResponse } from 'next';
import { VyosClient } from '../../../lib/vyosClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pool, subnet, hostname, ipAddress, macAddress } = req.body;

  if (!subnet || !hostname || !ipAddress || !macAddress) {
    return res.status(400).json({ error: 'Missing required parameters' });
  }

  const client = new VyosClient();
  const response = await client.setStaticMapping(pool, subnet, hostname, ipAddress, macAddress);

  if (!response.success) {
    return res.status(500).json({ error: response.error });
  }

  res.status(200).json(response.data);
}
