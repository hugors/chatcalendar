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

client.on('auth_failure', msg => {
  console.error('❌ Falha de autenticação:', msg);
});

client.on('disconnected', reason => {
  console.log('🚫 Cliente desconectado:', reason);
});

client.on('message', async (msg) => {
  const texto = msg.body.toLowerCase();

  if (['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'].some(saudacao => texto.includes(saudacao))) {
    await msg.reply('👋 Olá! Eu sou a *EVA*, sua assistente virtual.\nEstou aqui para te ajudar com *agendamentos de consultas* e visualizar seus *eventos no calendário*. 😊\n\nDigite:\n👉 *agendar consulta* para iniciar um agendamento\n👉 *meus eventos* para ver seus próximos compromissos');
    return;
  }

  if (texto.includes('agendar consulta')) {
    const authUrl = getAuthUrl();
    await msg.reply(`🔐 Para agendar uma consulta, por favor, autorize o acesso ao seu Google Calendar neste link:\n${authUrl}`);
    return;
  }

  if (texto.includes('meus eventos')) {
    const eventos = await listEvents();

    let mensagemEventos = '👋 Olá! Eu sou a *EVA*, sua assistente virtual.\nEstou aqui para te ajudar com *agendamentos de consultas*.\n\n';

    if (!eventos || eventos.length === 0) {
      mensagemEventos += '📅 Você não tem eventos agendados nos próximos dias.';
    } else {
      mensagemEventos += '📅 Aqui estão seus próximos eventos:\n\n';
      eventos.forEach((evento) => {
        mensagemEventos += `✅ *${evento.summary}* - ${evento.start.dateTime || evento.start.date}\n`;
      });
    }

    await msg.reply(mensagemEventos);
    return;
  }
});

client.initialize();
