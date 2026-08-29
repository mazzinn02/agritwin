export const sendEmail = async (subject: string, body: string) => {
  console.log(`[EMAIL NOTIFICATION] Subject: ${subject}`);
  return true;
};
