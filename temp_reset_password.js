const bcrypt = require('bcrypt');

async function resetPassword() {
  try {
    const password = 'teamfleur123';
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log('Password:', password);
    console.log('Hash:', hash);
  } catch (error) {
    console.error('Error:', error);
  }
}

resetPassword();

