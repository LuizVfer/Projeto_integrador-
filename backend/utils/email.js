const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationCode = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Código de Verificação para Recuperação de Senha',
    text: `Seu código de verificação é: ${code}. Ele expira em 10 minutos.`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationCode };