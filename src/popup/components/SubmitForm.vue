<template>
  <div class="state">
    <div class="account-info">
      <span>Plan: <strong>{{ userPlan?.planName || 'Free' }}</strong></span>
      <span>Reports left: <strong>{{ userPlan?.reportsLeft || '0' }}</strong></span>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="mode">Mode *</label>
        <select id="mode" v-model="formData.mode" @change="checkAIMode" required>
          <option value="standard">Basic</option>
          <option value="ai">AI</option>
        </select>
        <div v-if="showAIWarning" class="help-text" style="color: #ff9800;">
          AI mode requires a premium plan
        </div>
      </div>

      <div class="form-group">
        <label for="reportName">Report Name *</label>
        <input type="text" id="reportName" v-model="formData.reportName" placeholder="Enter report name" required>
      </div>

      <div class="form-group">
        <label for="labels">Labels</label>
        <input type="text" id="labels" v-model="formData.labels" placeholder="Comma-separated labels (optional)">
        <div class="help-text">e.g., malware, threat-intel, analysis</div>
      </div>

      <div class="form-group">
        <label for="confidence">Confidence</label>
        <input type="number" id="confidence" v-model.number="formData.confidence" min="0" max="100">
        <div class="help-text">0-100</div>
      </div>

      <div class="form-group">
        <label for="tlpLevel">TLP Level *</label>
        <select id="tlpLevel" v-model="formData.tlpLevel" required>
          <option value="clear">TLP:CLEAR</option>
          <option value="white">TLP:WHITE</option>
          <option value="green">TLP:GREEN</option>
          <option value="amber">TLP:AMBER</option>
          <option value="amber+strict">TLP:AMBER+STRICT</option>
          <option value="red">TLP:RED</option>
        </select>
      </div>

      <div class="form-group">
        <label>Sources</label>
        <div class="sources-list">
          <div v-for="(source, index) in formData.sources" :key="index" class="source-item">
            <input type="text" v-model="formData.sources[index]" placeholder="https://example.com" class="source-input">
            <button type="button" @click="removeSource(index)">✕</button>
          </div>
        </div>
        <button type="button" @click="addSource" class="btn btn-small">+ Add Source</button>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          <span v-if="!isSubmitting">Submit to Stixify</span>
          <span v-else class="btn-loader"></span>
        </button>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: 'SubmitForm',
  props: {
    userPlan: {
      type: Object,
      default: null
    },
    currentPageUrl: {
      type: String,
      default: ''
    }
  },
  emits: ['submit-success', 'submit-error'],
  data() {
    return {
      formData: {
        mode: 'standard',
        reportName: '',
        labels: '',
        confidence: 50,
        tlpLevel: 'clear',
        sources: []
      },
      isSubmitting: false,
      showAIWarning: false
    };
  },
  mounted() {
    this.initializeForm();
  },
  methods: {
    async initializeForm() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].title) {
        this.formData.reportName = tabs[0].title;
      }

      if (this.currentPageUrl) {
        this.formData.sources.push(this.currentPageUrl);
      }

      this.checkAIMode();
    },

    checkAIMode() {
      this.showAIWarning = this.formData.mode === 'ai' &&
        this.userPlan &&
        !this.userPlan.hasAIAccess;
    },

    addSource() {
      this.formData.sources.push('');
    },

    removeSource(index) {
      this.formData.sources.splice(index, 1);
    },

    async handleSubmit() {
      this.isSubmitting = true;

      try {
        const settings = await chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'teamId']);
        const mhtmlBlob = await this.capturePageAsMhtml();

        const submitData = {
          extraction_mode: this.formData.mode,
          reportName: this.formData.reportName,
          labels: this.formData.labels
            .split(',')
            .map(l => l.trim())
            .filter(l => l).join(','),
          confidence: this.formData.confidence,
          tlpLevel: this.formData.tlpLevel,
          sources: this.formData.sources.filter(url => url.trim())
        };

        const uploadTime = new Date().toISOString();
        const result = await this.submitToStixify(
          submitData,
          mhtmlBlob,
          settings.apiKey,
          settings.apiEndpoint
        );

        if (result.id) {
          // Build job URL
          const baseUrl = (settings.apiEndpoint).replace('api.', 'app.');
          const jobUrl = `${baseUrl}/${settings.teamId}/${result.report_id}/uploads/${result.id}`;

          await this.saveJob({
            id: result.id,
            report_id: result.report_id,
            name: submitData.reportName,
            state: result.state,
            upload_time: uploadTime,
            completion_time: null,
            job_url: jobUrl
          });

          this.$emit('submit-success');
        } else {
          throw new Error('Invalid response from Stixify API: Missing job ID');
        }
      } catch (error) {
        this.$emit('submit-error', error.message);
      } finally {
        this.isSubmitting = false;
      }
    },

    async capturePageAsMhtml() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs[0]) {
        throw new Error('No active tab found');
      }

      const mhtmlData = await chrome.pageCapture.saveAsMHTML({ tabId: tabs[0].id });
      return new Blob([mhtmlData], { type: 'application/x-mimearchive' });
    },

    slugify(text) {
      return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .substr(0, 50);
    },

    async submitToStixify(formData, mhtmlBlob, apiKey, apiEndpoint) {
      const endpoint = `${apiEndpoint}/v1/reports/`;

      const formDataPayload = new FormData();
      formDataPayload.append('file', mhtmlBlob, this.slugify(formData.reportName) + '.mhtml');
      formDataPayload.append('extraction_mode', formData.extraction_mode);
      formDataPayload.append('name', formData.reportName);
      formDataPayload.append('confidence', formData.confidence);
      formDataPayload.append('tlp_level', formData.tlpLevel);

      if (formData.labels.length > 0) {
        formDataPayload.append('labels', JSON.stringify(formData.labels));
      }

      if (formData.sources.length > 0) {
        formDataPayload.append('sources', JSON.stringify(formData.sources));
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'API-KEY': apiKey },
        body: formDataPayload
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Upload failed with status ${response.status}`);
      }

      return await response.json();
    },

    async saveJob(job) {
      const { jobs = [] } = await chrome.storage.local.get(['jobs']);
      jobs.unshift(job);
      const trimmedJobs = jobs.slice(0, 100);
      await chrome.storage.local.set({ jobs: trimmedJobs });
    }
  }
};
</script>
