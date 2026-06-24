/**
 * Script para crear el usuario demo en Supabase
 * Usuario: demo@inventario-pymes.com
 * Contraseña: Demo2024!
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ggblmxgopmilcujktsww.supabase.co';
const supabaseAnonKey = 'sb_publishable_sUjuGC_FlAlyjh9bC6vFcA_RXKgqSA4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createDemoUser() {
  console.log('Creando usuario demo...');
  
  // Primero intentar login para ver si ya existe
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'demo@inventario-pymes.com',
    password: 'Demo2024!'
  });

  if (loginData?.user) {
    console.log('✅ El usuario demo ya existe:', loginData.user.email);
    console.log('   ID:', loginData.user.id);
    return;
  }

  console.log('Usuario no existe, creando...');

  // Crear usuario nuevo
  const { data, error } = await supabase.auth.signUp({
    email: 'demo@inventario-pymes.com',
    password: 'Demo2024!',
    options: {
      data: {
        nombre: 'Usuario Demo',
        role: 'admin'
      }
    }
  });

  if (error) {
    console.error('❌ Error al crear usuario:', error.message);
    return;
  }

  if (data.user) {
    console.log('✅ Usuario demo creado exitosamente!');
    console.log('   Email:', data.user.email);
    console.log('   ID:', data.user.id);
    console.log('');
    console.log('Credenciales:');
    console.log('   Email: demo@inventario-pymes.com');
    console.log('   Contraseña: Demo2024!');
  }
}

createDemoUser().catch(console.error);
