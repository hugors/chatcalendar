// index.js
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { google } = require('googleapis');
const fs = require('fs');
require('dotenv').config();

const SESSIONS = new Map();

const calendar = google.calendar('v3');
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  null,
  process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/calendar']
);

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
});

client.on('qr', (qr) => {
  console.log('QR Code gerado. Escaneie para continuar...');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('🤖 EVA pronta para agendar!');
});

client.on('auth_failure', msg => {
  console.error('❌ Falha de autenticação:', msg);
});

client.on('disconnected', reason => {
  console.log('🚫 Cliente desconectado:', reason);
});

client.on('message', async (msg) => {
  const chatId = msg.from;
  const texto = msg.body.toLowerCase();

  if (!SESSIONS.has(chatId)) {
    SESSIONS.set(chatId, { etapa: 0 });
  }
  const sessao = SESSIONS.get(chatId);

  if (['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite'].some(t => texto.includes(t))) {
    await msg.reply('Olá! Eu sou a EVA 🤖, sua assistente virtual. Posso te ajudar a *agendar*, *reagendar* ou *cancelar* uma consulta. O que deseja fazer?');
    sessao.etapa = 0;
    return;
  }

  // Etapas de agendamento
  if (texto.includes('agendar')) {
    sessao.acao = 'agendar';
    sessao.etapa = 1;
    await msg.reply('Perfeito! Qual a data da consulta? (Ex: 2025-05-01)');
    return;
  }

  if (sessao.acao === 'agendar') {
    if (sessao.etapa === 1) {
      sessao.data = texto;
      sessao.etapa = 2;
      await msg.reply('E o horário da consulta? (Ex: 15:30)');
      return;
    }

    if (sessao.etapa === 2) {
      sessao.hora = texto;
      const dateTime = new Date(`${sessao.data}T${sessao.hora}:00`);
      const phone = msg.from.replace('@c.us', '');
      try {
        await auth.authorize();
        await calendar.events.insert({
          auth,
          calendarId: process.env.CALENDAR_ID,
          requestBody: {
            summary: 'Consulta Terapia',
            description: `Agendado via WhatsApp pelo número ${phone}`,
            start: { dateTime: dateTime.toISOString(), timeZone: 'America/Sao_Paulo' },
            end: { dateTime: new Date(dateTime.getTime() + 60 * 60 * 1000).toISOString(), timeZone: 'America/Sao_Paulo' },
          },
        });
        await msg.reply(`Consulta agendada com sucesso para ${sessao.data} às ${sessao.hora} ✅`);
      } catch (err) {
        console.error(err);
        await msg.reply('❌ Ocorreu um erro ao tentar agendar. Tente novamente.');
      }
      SESSIONS.delete(chatId);
      return;
    }
  }
});

client.initialize();
