const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { getAuthUrl, getAccessToken, listEvents } = require('./googleCalendar');
require('dotenv').config();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  console.log('QR Code gerado. Escaneie para continuar...');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('🤖 Bot pronto!');
});

client.on('message', async (msg) => {
  const texto = msg.body.toLowerCase();

  if (texto.includes('agendar consulta')) {
    // Aqui você pode integrar a parte de Google Calendar
    const authUrl = getAuthUrl();
    await msg.reply(`Por favor, acesse este link para autorizar o acesso ao seu Google Calendar: ${authUrl}`);
  }

  if (texto.includes('meus eventos')) {
    // Depois que o usuário autorizar o Google Calendar, você pode listar os eventos
    const eventos = await listEvents();
    let mensagemEventos = 'Aqui estão seus próximos eventos:\n';
    eventos.forEach((evento) => {
      mensagemEventos += `${evento.summary} - ${evento.start.dateTime || evento.start.date} \n`;
    });
    await msg.reply(mensagemEventos);
  }
});

client.initialize();
