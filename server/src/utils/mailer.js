const nodemailer = require('nodemailer');

let transporterPromise = null;

const buildTransporter = async () => {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  const account = await nodemailer.createTestAccount();
  // eslint-disable-next-line no-console
  console.log('[mailer] Ethereal test account ready');
  // eslint-disable-next-line no-console
  console.log(`[mailer] Inbox: https://ethereal.email/login (user: ${account.user})`);
  return nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
};

const getTransporter = () => {
  if (!transporterPromise) {
    transporterPromise = buildTransporter();
  }
  return transporterPromise;
};

const sendVerificationEmail = async ({ to, name, verifyUrl }) => {
  const transporter = await getTransporter();
  const from = process.env.MAIL_FROM || '"PataPlan" <no-reply@pataplan.local>';

  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Confirma tu correo en PataPlan',
    text: `Hola ${name},\n\nConfirma tu correo haciendo clic en el siguiente enlace:\n${verifyUrl}\n\nEl enlace caduca en 24 horas.\n\nSi no has creado esta cuenta, ignora este mensaje.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1e1e1d; padding: 1rem;">
        <h2 style="color: #1a7a5c;">¡Bienvenido a PataPlan, ${name}!</h2>
        <p>Para empezar a usar tu cuenta, confirma tu correo electrónico:</p>
        <p>
          <a href="${verifyUrl}"
             style="display:inline-block;background:#1a7a5c;color:#fff;padding:0.6rem 1.1rem;border-radius:6px;text-decoration:none;">
            Verificar mi correo
          </a>
        </p>
        <p style="font-size:0.85rem;color:#6b6a65;">
          O copia este enlace en tu navegador:<br>
          <span style="word-break:break-all;">${verifyUrl}</span>
        </p>
        <p style="font-size:0.8rem;color:#6b6a65;">El enlace caduca en 24 horas. Si no has creado esta cuenta, ignora este correo.</p>
      </div>
    `,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    // eslint-disable-next-line no-console
    console.log(`[mailer] Preview URL: ${preview}`);
  }
  return { messageId: info.messageId, previewUrl: preview || null };
};

const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  const transporter = await getTransporter();
  const from = process.env.MAIL_FROM || '"PataPlan" <no-reply@pataplan.local>';

  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Restablecer tu contraseña en PataPlan',
    text: `Hola ${name},\n\nHemos recibido una solicitud para restablecer tu contraseña. Abre este enlace para crear una nueva:\n${resetUrl}\n\nEl enlace caduca en 1 hora. Si no has sido tú, ignora este mensaje.`,
    html: `
      <div style="font-family: Arial, sans-serif; color: #1e1e1d; padding: 1rem;">
        <h2 style="color: #1a7a5c;">Restablecer contraseña</h2>
        <p>Hola ${name}, hemos recibido una solicitud para restablecer tu contraseña.</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#1a7a5c;color:#fff;padding:0.6rem 1.1rem;border-radius:6px;text-decoration:none;">
            Restablecer contraseña
          </a>
        </p>
        <p style="font-size:0.85rem;color:#6b6a65;">
          O copia este enlace en tu navegador:<br>
          <span style="word-break:break-all;">${resetUrl}</span>
        </p>
        <p style="font-size:0.8rem;color:#6b6a65;">El enlace caduca en 1 hora. Si no has sido tú quien lo ha pedido, ignora este correo.</p>
      </div>
    `,
  });

  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    // eslint-disable-next-line no-console
    console.log(`[mailer] Preview URL: ${preview}`);
  }
  return { messageId: info.messageId, previewUrl: preview || null };
};

const formatEsDate = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const escapeHtml = (str) =>
  String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const buildEventRow = (e, extraCol) => {
  const animal = escapeHtml(e.animal?.name || '—');
  const type = escapeHtml(e.eventType?.name || '—');
  const date = formatEsDate(e.scheduledDate);
  return `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #E2E0D8;">${animal}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E2E0D8;">${type}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #E2E0D8;">${date}</td>
      ${extraCol ? `<td style="padding:8px 10px;border-bottom:1px solid #E2E0D8;">${extraCol(e)}</td>` : ''}
    </tr>
  `;
};

const buildEventTable = (events, headers, extraCol) => {
  const headRow = headers
    .map(
      (h) =>
        `<th style="text-align:left;padding:8px 10px;background:#F3F1EC;color:#1E1E1D;font-size:0.8rem;">${escapeHtml(h)}</th>`
    )
    .join('');
  const rows = events.map((e) => buildEventRow(e, extraCol)).join('');
  return `
    <table style="width:100%;border-collapse:collapse;font-family:Arial,sans-serif;font-size:0.9rem;">
      <thead><tr>${headRow}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
};

const sendDigest = async ({ to, subject, html, text }) => {
  const transporter = await getTransporter();
  const from = process.env.MAIL_FROM || '"PataPlan" <no-reply@pataplan.local>';
  const info = await transporter.sendMail({ from, to, subject, html, text });
  const preview = nodemailer.getTestMessageUrl(info);
  if (preview) {
    // eslint-disable-next-line no-console
    console.log(`[mailer] Preview URL: ${preview}`);
  }
  return { messageId: info.messageId, previewUrl: preview || null };
};

const sendUpcomingEventEmail = async ({ to, name, events }) => {
  if (!events.length) return null;
  const intro = `Tienes ${events.length} evento${events.length > 1 ? 's' : ''} programado${events.length > 1 ? 's' : ''} para dentro de 3 días.`;
  const text =
    `Hola ${name},\n\n${intro}\n\n` +
    events
      .map((e) => `- ${e.animal?.name}: ${e.eventType?.name} (${formatEsDate(e.scheduledDate)})`)
      .join('\n') +
    `\n\nPuedes consultarlos en tu calendario de PataPlan.`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1E1E1D;padding:1rem;max-width:560px;">
      <h2 style="color:#1A7A5C;margin-top:0;">Próximos eventos sanitarios</h2>
      <p>Hola ${escapeHtml(name)}, ${intro}</p>
      ${buildEventTable(events, ['Animal', 'Evento', 'Fecha'])}
      <p style="font-size:0.85rem;color:#6B6A65;margin-top:1.25rem;">
        Consulta el detalle en tu calendario de PataPlan.
      </p>
    </div>
  `;
  return sendDigest({
    to,
    subject: `PataPlan · ${events.length} evento${events.length > 1 ? 's' : ''} en 3 días`,
    text,
    html,
  });
};

const sendDueTodayEmail = async ({ to, name, events }) => {
  if (!events.length) return null;
  const intro = `Hoy te toca atender ${events.length} evento${events.length > 1 ? 's' : ''} sanitario${events.length > 1 ? 's' : ''}.`;
  const text =
    `Hola ${name},\n\n${intro}\n\n` +
    events
      .map((e) => `- ${e.animal?.name}: ${e.eventType?.name}`)
      .join('\n') +
    `\n\nEntra en PataPlan para marcarlos como realizados cuando los hagas.`;
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1E1E1D;padding:1rem;max-width:560px;">
      <h2 style="color:#B07210;margin-top:0;">Hoy toca</h2>
      <p>Hola ${escapeHtml(name)}, ${intro}</p>
      ${buildEventTable(events, ['Animal', 'Evento', 'Fecha'])}
      <p style="font-size:0.85rem;color:#6B6A65;margin-top:1.25rem;">
        Cuando los hagas, márcalos como realizados en PataPlan para que el calendario quede al día.
      </p>
    </div>
  `;
  return sendDigest({
    to,
    subject: `PataPlan · Hoy toca (${events.length} evento${events.length > 1 ? 's' : ''})`,
    text,
    html,
  });
};

const daysOverdue = (event, now) => {
  const ms = now.getTime() - new Date(event.scheduledDate).getTime();
  return Math.max(0, Math.floor(ms / 86400000));
};

const sendOverdueEventEmail = async ({ to, name, events }) => {
  if (!events.length) return null;
  const now = new Date();
  const intro = `Tienes ${events.length} evento${events.length > 1 ? 's' : ''} sanitario${events.length > 1 ? ' vencidos' : ' vencido'} pendiente${events.length > 1 ? 's' : ''} de atender.`;
  const text =
    `Hola ${name},\n\n${intro}\n\n` +
    events
      .map(
        (e) =>
          `- ${e.animal?.name}: ${e.eventType?.name} (vencido el ${formatEsDate(e.scheduledDate)}, ${daysOverdue(e, now)} día${daysOverdue(e, now) === 1 ? '' : 's'} de retraso)`
      )
      .join('\n');
  const html = `
    <div style="font-family:Arial,sans-serif;color:#1E1E1D;padding:1rem;max-width:560px;">
      <h2 style="color:#DC3545;margin-top:0;">Eventos vencidos</h2>
      <p>Hola ${escapeHtml(name)}, ${intro}</p>
      ${buildEventTable(events, ['Animal', 'Evento', 'Fecha programada', 'Retraso'], (e) => `${daysOverdue(e, now)} día${daysOverdue(e, now) === 1 ? '' : 's'}`)}
      <p style="font-size:0.85rem;color:#6B6A65;margin-top:1.25rem;">
        Mientras sigan vencidos recibirás un recordatorio diario. Márcalos como realizados o reprográmalos para dejar de recibirlo.
      </p>
    </div>
  `;
  return sendDigest({
    to,
    subject: `PataPlan · ${events.length} evento${events.length > 1 ? 's' : ''} vencido${events.length > 1 ? 's' : ''}`,
    text,
    html,
  });
};

module.exports = {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendUpcomingEventEmail,
  sendDueTodayEmail,
  sendOverdueEventEmail,
};
