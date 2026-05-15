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

module.exports = { sendVerificationEmail, sendPasswordResetEmail };
