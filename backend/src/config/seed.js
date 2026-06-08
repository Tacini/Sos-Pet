const pool = require('./database');

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Nenhum dado de seed configurado. Banco pronto para uso.');
    console.log('   Use a API ou o frontend para cadastrar usuários e anúncios.');
  } catch (error) {
    console.error('❌ Erro no seed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
