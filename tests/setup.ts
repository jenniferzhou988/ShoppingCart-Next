import dotenv from 'dotenv';
import path from 'path';

// Load env so validateStartup passes
dotenv.config({ path: path.resolve(__dirname, '../.env') });
