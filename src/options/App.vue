<template>
  <div class="container">
    <h1>Stixify Extension Settings</h1>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="apiKey">Stixify API Key *</label>
        <input type="password" id="apiKey" v-model="formData.apiKey" placeholder="Enter your Stixify API key" required>
        <div class="help-text">You can find your API key in your Stixify account settings</div>
      </div>

      <div class="form-group">
        <label for="apiEndpoint">Stixify API Endpoint</label>
        <div class="input-with-button">
          <input type="url" id="apiEndpoint" v-model="formData.apiEndpoint" placeholder="https://api.stixify.com"
            :disabled="!endpointUnlocked">
          <button type="button" class="icon-btn" :title="endpointUnlocked ? 'Lock endpoint' : 'Edit endpoint'"
            @click="toggleEndpoint">
            {{ endpointUnlocked ? '🔓' : '🔒' }}
          </button>
        </div>
        <div class="help-text">Default endpoint should work for most users</div>
      </div>

      <button type="submit" class="btn-primary" :disabled="isSaving">
        {{ isSaving ? 'Validating...' : 'Save Settings' }}
      </button>
    </form>

    <div v-if="status.message" :class="['status', status.type]">
      {{ status.message }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'OptionsApp',
  data() {
    return {
      formData: {
        apiKey: '',
        apiEndpoint: 'https://api.stixify.com'
      },
      endpointUnlocked: false,
      isSaving: false,
      status: {
        message: '',
        type: ''
      }
    };
  },
  mounted() {
    this.loadSettings();
  },
  methods: {
    async loadSettings() {
      const result = await chrome.storage.sync.get(['apiKey', 'apiEndpoint']);
      if (result.apiKey) {
        this.formData.apiKey = result.apiKey;
      }
      if (result.apiEndpoint) {
        this.formData.apiEndpoint = result.apiEndpoint;
      }
    },

    toggleEndpoint() {
      this.endpointUnlocked = !this.endpointUnlocked;
      if (this.endpointUnlocked) {
        this.$nextTick(() => {
          document.getElementById('apiEndpoint').focus();
        });
      }
    },

    async handleSubmit() {
      const apiKey = this.formData.apiKey.trim();
      const apiEndpoint = this.formData.apiEndpoint.trim().replace(/\/+$/, '');

      if (!apiKey) {
        this.showStatus('Please enter an API key', 'error');
        return;
      }

      this.isSaving = true;

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'fetchUserPlan',
          apiKey: apiKey,
          apiEndpoint: apiEndpoint || 'https://api.stixify.com'
        });

        if (response.error) {
          throw new Error(response.error);
        }

        await chrome.storage.sync.set({
          apiKey: apiKey,
          apiEndpoint: apiEndpoint || 'https://api.stixify.com',
          teamId: response.teamId,
          teamName: response.teamName
        });

        this.showStatus('Settings saved successfully! Authenticated as: ' + response.teamName, 'success');

        // Lock the endpoint after saving
        this.endpointUnlocked = false;

        // Clear status after 3 seconds
        setTimeout(() => {
          this.status.message = '';
        }, 3000);
      } catch (error) {
        this.showStatus('Authentication failed: ' + error.message, 'error');
      } finally {
        this.isSaving = false;
      }
    },

    showStatus(message, type) {
      this.status.message = message;
      this.status.type = type;
    }
  }
};
</script>

<style scoped>
.container {
  max-width: 600px;
  margin: 50px auto;
  padding: 30px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  color: #333;
  margin-top: 0;
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #555;
}

input[type="text"],
input[type="password"],
input[type="url"] {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
  font-family: inherit;
}

input:focus {
  outline: none;
  border-color: #4CAF50;
}

input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.input-with-button {
  display: flex;
  gap: 8px;
  align-items: center;
}

.input-with-button input {
  flex: 1;
}

.icon-btn {
  background: none;
  border: 1px solid #ddd;
  padding: 10px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
  min-width: 44px;
}

.icon-btn:hover {
  background-color: #f5f5f5;
  border-color: #4CAF50;
}

.icon-btn:active {
  background-color: #e8e8e8;
}

.btn-primary {
  background-color: #4CAF50;
  color: white;
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s;
  font-family: inherit;
  width: 100%;
}

.btn-primary:hover {
  background-color: #45a049;
}

.btn-primary:active {
  background-color: #3d8b40;
}

.btn-primary:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.status {
  margin-top: 15px;
  padding: 10px;
  border-radius: 4px;
}

.status.success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status.error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.help-text {
  font-size: 12px;
  color: #777;
  margin-top: 5px;
}
</style>
