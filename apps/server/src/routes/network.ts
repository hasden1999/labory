import { FastifyInstance } from 'fastify';
import QRCode from 'qrcode';
import { getLocalIPAddress } from '../utils/mdns';

export async function networkRoutes(fastify: FastifyInstance) {
  fastify.get('/network/qr', { onRequest: [fastify.authenticate] }, async (request, reply) => {
    const ip = getLocalIPAddress();
    const webPort = 8080;
    const lanUrl = `http://${ip}:${webPort}`;
    const mdnsUrl = `http://labmanager.local:${webPort}`;

    const qrDataUrl = await QRCode.toDataURL(lanUrl);

    return reply.send({
      lanUrl,
      mdnsUrl,
      ip,
      port: webPort,
      qrDataUrl,
    });
  });
}
