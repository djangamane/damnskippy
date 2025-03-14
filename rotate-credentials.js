/**
 * Credential Rotation Helper Script
 * 
 * This script helps identify and rotate exposed credentials.
 * IMPORTANT: This is just a helper - you must manually rotate your credentials!
 */

console.log('SECURITY ALERT: Credentials Exposure');
console.log('=====================================');
console.log('');
console.log('The following credentials have been exposed in your Git repository:');
console.log('');
console.log('1. MongoDB Connection String');
console.log('   - Exposed in: .env and .env.server files');
console.log('   - Action Required: Change your MongoDB Atlas password immediately');
console.log('');
console.log('2. OpenAI API Keys');
console.log('   - Exposed in: .env and .env.server files');
console.log('   - Action Required: Revoke and regenerate these API keys in the OpenAI dashboard');
console.log('');
console.log('3. JWT Secret');
console.log('   - Exposed in: .env and .env.server files');
console.log('   - Action Required: Generate a new secure random string');
console.log('');
console.log('Steps to take immediately:');
console.log('');
console.log('1. MongoDB:');
console.log('   - Log in to MongoDB Atlas: https://cloud.mongodb.com');
console.log('   - Navigate to Database Access');
console.log('   - Edit the user "jangabussaja"');
console.log('   - Set a new secure password');
console.log('   - Update your local .env files with the new connection string');
console.log('');
console.log('2. OpenAI:');
console.log('   - Log in to OpenAI: https://platform.openai.com/api-keys');
console.log('   - Revoke the exposed API keys');
console.log('   - Create new API keys');
console.log('   - Update your local .env files with the new API keys');
console.log('');
console.log('3. JWT Secret:');
console.log('   - Generate a new secure random string (e.g., using a password generator)');
console.log('   - Update your local .env files with the new JWT secret');
console.log('');
console.log('4. Git History:');
console.log('   - Consider using tools like BFG Repo-Cleaner or git-filter-repo to remove sensitive data from Git history');
console.log('   - Example: https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository');
console.log('');
console.log('5. Deployment:');
console.log('   - Update credentials in all deployment environments (development, staging, production)');
console.log('');
console.log('REMEMBER: Never commit .env files with real credentials to version control!');
console.log('Use .env.example files with placeholder values instead.'); 