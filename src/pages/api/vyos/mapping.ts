import { NextApiRequest, NextApiResponse } from 'next';
import { VyosClient } from '../../../lib/vyosClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const client = new VyosClient();
  const response = await client.getDhcpLeases('static-mapping');

  if (!response.success) {
    return res.status(500).json({ error: response.error });
  }

  res.status(200).json(response.data);
}
