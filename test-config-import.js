// Simple test to verify ConfigManager can be imported in Node environment
const { ConfigManager } = require('./src/config');

console.log('✓ ConfigManager imported successfully');
console.log('Available methods:', Object.keys(ConfigManager));

// Test basic functionality with mock env
const mockEnv = {
  API_CONFIG: JSON.stringify({
    providers: {
      test: {
        type: 'openai',
        endpoint: 'https://test.com/v1',
        key: 'TestKey',
        models: ['test-model']
      }
    },
    default_provider: 'test'
  })
};

try {
  const config = ConfigManager.getConfig(mockEnv);
  console.log('✓ getConfig() works:', config.default_provider);

  const resolved = ConfigManager.resolveProvider(config, 'test-model', 'openai');
  console.log('✓ resolveProvider() works:', resolved.name);

  console.log('\n🎉 All ConfigManager tests passed!');
} catch (error) {
  console.error('❌ Test failed:', error.message);
  process.exit(1);
}