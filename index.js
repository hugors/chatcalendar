const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { createEvent, listUserEvents, deleteEventBySummary, updateEvent } = require('./googleCalendar');
require('dotenv').config();

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] }
});

client.on('qr', qr => {
  console.log('📲 Escaneie o QR Code:');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('🤖 EVA está online!');
});

client.on('message', async msg => {
  const texto = msg.body.toLowerCase();
  const userId = msg.from.replace(/[@:\s]/g, '');

  // Apresentação
  if (["oi", "olá", "bom dia", "boa tarde", "boa noite"].some(t => texto.includes(t))) {
    return msg.reply('Olá! Eu sou a EVA 🤖, sua assistente virtual. Posso te ajudar com agendamentos, reagendamentos ou cancelamentos.');
  }

  // Agendamento
  if (texto.startsWith('agendar')) {
    const [, titulo, data, hora] = texto.split('|').map(t => t.trim());
    const start = new Date(`${data}T${hora}:00`);
    const end = new Date(start.getTime() + 30 * 60000); // 30 minutos
    try {
      await createEvent(userId, titulo, start.toISOString(), end.toISOString());
      return msg.reply(`✅ Consulta "${titulo}" agendada para ${data} às ${hora}.`);
    } catch (e) {
      return msg.reply('❌ Ocorreu um erro ao agendar. Verifique os dados.');
    }
  }

  // Reagendamento
  if (texto.startsWith('reagendar')) {
    const [, titulo, novaData, novaHora] = texto.split('|').map(t => t.trim());
    const newStart = new Date(`${novaData}T${novaHora}:00`);
    const newEnd = new Date(newStart.getTime() + 30 * 60000);
    const sucesso = await updateEvent(userId, titulo, newStart.toISOString(), newEnd.toISOString());
    return msg.reply(sucesso ? `🔄 Consulta "${titulo}" reagendada com sucesso.` : '❌ Evento não encontrado.');
  }

  // Cancelamento
  if (texto.startsWith('cancelar')) {
    const [, titulo] = texto.split('|').map(t => t.trim());
    const sucesso = await deleteEventBySummary(userId, titulo);
    return msg.reply(sucesso ? `🗑️ Consulta "${titulo}" cancelada.` : '❌ Evento não encontrado.');
  }

  // Listar eventos
  if (texto.includes('meus eventos')) {
    const eventos = await listUserEvents(userId);
    if (eventos.length === 0) return msg.reply('📭 Nenhum evento encontrado.');
    let resposta = '📅 Seus próximos eventos:\n\n';
    eventos.forEach(e => {
      resposta += `• ${e.summary.replace(`[${userId}] `, '')} - ${e.start.dateTime?.replace('T', ' ').slice(0, 16)}\n`;
    });
    return msg.reply(resposta);
  }
});

client.on('auth_failure', msg => {
  console.error('❌ Falha de autenticação:', msg);
});

client.on('disconnected', reason => {
  console.log('🚫 Cliente desconectado:', reason);
});

client.initialize();
