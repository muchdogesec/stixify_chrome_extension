<template>
  <div class="state">
    <div class="account-info">
      <span>Plan: <strong>{{ userPlan?.planName || 'Free' }}</strong></span>
      <span>Reports left: <strong>{{ userPlan?.reportsLeft || '0' }}</strong></span>
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="reportName">Report Name *</label>
        <input type="text" id="reportName" v-model="formData.reportName" placeholder="Enter report name" required>
      </div>

      <div class="form-group">
        <label for="dossierSearch">Dossiers</label>
        <div class="dossier-selector" @click.self="closeDossierDropdown">
          <div v-if="formData.dossierIds.length > 0" class="dossier-selected-list">
            <div
              v-for="dossierId in formData.dossierIds"
              :key="dossierId"
              class="dossier-chip"
            >
              <span>{{ dossiers.find(d => d.id === dossierId)?.name || dossierId }}</span>
              <button type="button" @click="removeDossier(dossierId)" class="remove-chip">×</button>
            </div>
          </div>
          <input
            type="text"
            id="dossierSearch"
            v-model="dossierSearchInput"
            placeholder="Search dossiers..."
            class="dossier-input"
            @focus="showDossierDropdown = true"
            @mousedown="showDossierDropdown = !showDossierDropdown"
            @input="showDossierDropdown = true"
            @keydown.escape="closeDossierDropdown"
            @blur="closeDossierDropdown"
          >
          <div v-if="showDossierDropdown" class="dossier-dropdown" @mousedown.prevent>
            <div v-if="filteredDossiers.length === 0" class="dossier-item empty">
              No dossiers found
            </div>
            <div
              v-for="dossier in filteredDossiers"
              :key="dossier.id"
              class="dossier-item"
              @mousedown="selectDossier(dossier)"
            >
              <div class="dossier-name">{{ dossier.name }}</div>
              <div class="dossier-meta">{{ dossier.id }}</div>
            </div>
          </div>
        </div>
        <div class="help-text">Optional — associate this report with dossiers</div>
      </div>

      <div class="form-group">
        <label>Labels</label>
        <div class="labels-list">
          <div v-for="(label, index) in formData.labels" :key="index" class="label-item" :class="{ 'has-error': errors.labels[index] }">
            <div>
              <input
                type="text"
                v-model="formData.labels[index]"
                placeholder="e.g., malware"
                class="label-input"
                @keyup="validateLabel(index)"
                @blur="validateLabel(index)"
                :class="{ 'input-error': errors.labels[index] }"
              >
              <button type="button" @click="removeLabel(index)" title="Remove label">
                <Icon name="x" :size="12" :stroke-width="2.5" />
              </button>
            </div>
            <div v-if="errors.labels[index]" class="error-message">
              {{ errors.labels[index] }}
              <button type="button" @click="convertToSlug(index)" class="convert-btn">convert</button>
            </div>
          </div>
        </div>
        <button type="button" @click="addLabel" class="btn btn-small">+ Add Label</button>
        <div class="help-text">lowercase alphanumeric and hyphens only</div>
      </div>

      <div class="form-group">
        <label for="publishedDate">Published Date</label>
        <input
          type="date"
          id="publishedDate"
          v-model="formData.publishedDate"
          @blur="validatePublishedDate"
          :class="{ 'input-error': errors.publishedDate }"
        >
        <div v-if="errors.publishedDate" class="error-message">{{ errors.publishedDate }}</div>
        <div class="help-text">Optional — when this report was published (today or earlier)</div>
      </div>

      <div class="confidence-section">
        <h3 class="section-title">Confidence</h3>

        <div class="form-group">
          <div class="checkbox-row">
            <input type="checkbox" id="aiDefinesConfidence" v-model="formData.aiDefinesConfidence" >
            <label for="aiDefinesConfidence" class="checkbox-label">Let AI define confidence</label>
          </div>
          <input v-if="!formData.aiDefinesConfidence" type="number" id="confidence" v-model.number="formData.confidence" @blur="saveFormData" min="0" max="100" required>
          <div v-if="!formData.aiDefinesConfidence" class="help-text">0-100</div>
        </div>
      </div>

      <div class="admiralty-section">
        <h3 class="section-title">
          Admiralty Code
          <a href="https://en.wikipedia.org/wiki/Admiralty_code" target="_blank" rel="noopener" class="help-link" title="Learn more about Admiralty Code">?</a>
        </h3>

        <div class="form-group">
          <label for="admiraltySourceReliability">Source Reliability</label>
          <select id="admiraltySourceReliability" v-model="formData.admiraltySourceReliability" >
            <option value="">None</option>
            <option value="A">A - Completely reliable</option>
            <option value="B">B - Usually reliable</option>
            <option value="C">C - Fairly reliable</option>
            <option value="D">D - Not usually reliable</option>
            <option value="E">E - Unreliable</option>
            <option value="F">F - Reliability cannot be judged</option>
          </select>
        </div>

        <div class="form-group">
          <label for="admiraltyInformationCredibility">Information Credibility</label>
          <select id="admiraltyInformationCredibility" v-model="formData.admiraltyInformationCredibility" >
            <option value="">None</option>
            <option value="1">1 - Confirmed by other sources</option>
            <option value="2">2 - Probably true</option>
            <option value="3">3 - Possibly true</option>
            <option value="4">4 - Doubtful</option>
            <option value="5">5 - Improbable</option>
            <option value="6">6 - Truth cannot be judged</option>
          </select>
        </div>
      </div>

      <div class="pap-section">
        <h3 class="section-title">
          PAP Level
          <a href="https://www.misp-project.org/taxonomies.html#_pap" target="_blank" rel="noopener" class="help-link" title="Learn more about PAP">?</a>
        </h3>

        <div class="form-group">
          <label for="papLevel">Permissible Actions Protocol</label>
          <select id="papLevel" v-model="formData.papLevel" >
            <option value="">None</option>
            <option value="red">PAP:RED</option>
            <option value="amber">PAP:AMBER</option>
            <option value="green">PAP:GREEN</option>
            <option value="clear">PAP:CLEAR</option>
          </select>
        </div>
      </div>

      <div class="form-group">
        <label for="tlpLevel">
          TLP Level *
          <a href="https://en.wikipedia.org/wiki/Traffic_light_protocol" target="_blank" rel="noopener" class="help-link" title="Learn more about TLP">?</a>
        </label>
        <select id="tlpLevel" v-model="formData.tlpLevel"  required>
          <option value="red">TLP:RED</option>
          <option value="amber+strict">TLP:AMBER+STRICT</option>
          <option value="amber">TLP:AMBER</option>
          <option value="green">TLP:GREEN</option>
          <option value="clear">TLP:CLEAR</option>
        </select>
      </div>

      <div class="form-group">
        <label>Sources</label>
        <div class="sources-list">
          <div v-for="(source, index) in formData.sources" :key="index" class="source-item" :class="{ 'has-error': errors.sources[index] }">
            <div>
              <input
                type="text"
                v-model="formData.sources[index]"
                placeholder="https://example.com"
                class="source-input"
                @keyup="validateSource(index)"
                @blur="validateSource(index)"
                :class="{ 'input-error': errors.sources[index] }"
              >
              <button type="button" @click="removeSource(index)" title="Remove source">
                <Icon name="x" :size="12" :stroke-width="2.5" />
              </button>
            </div>
            <div v-if="errors.sources[index]" class="error-message">
              {{ errors.sources[index] }}
            </div>
          </div>
        </div>
        <button type="button" @click="addSource" class="btn btn-small">+ Add Source</button>
      </div>

      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="isSubmitting || hasValidationErrors"
        >
          <span v-if="!isSubmitting">Submit to Stixify</span>
          <span v-else class="btn-loader"></span>
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import Icon from '@/components/Icon.vue';

export default {
  name: 'SubmitForm',
  components: { Icon },
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
  emits: ['submit-success', 'submit-error', 'submitting-change'],
  data() {
    return {
      formData: {
        reportName: '',
        dossierIds: [],
        labels: [],
        publishedDate: '',
        aiDefinesConfidence: true,
        confidence: 50,
        tlpLevel: 'clear',
        papLevel: '',
        admiraltySourceReliability: '',
        admiraltyInformationCredibility: '',
        sources: []
      },
      dossiers: [],
      dossierSearchInput: '',
      showDossierDropdown: false,
      errors: {
        labels: {},
        sources: {},
        publishedDate: ''
      },
      isSubmitting: false,
      saveTimeout: null
    };
  },
  computed: {
    hasValidationErrors() {
      const hasLabelErrors = Object.keys(this.errors.labels).length > 0;
      const hasSourceErrors = Object.keys(this.errors.sources).length > 0;
      const hasDateError = this.errors.publishedDate !== '';
      return hasLabelErrors || hasSourceErrors || hasDateError;
    },
    filteredDossiers() {
      const unselected = this.dossiers.filter(d => !this.formData.dossierIds.includes(d.id));

      if (!this.dossierSearchInput.trim()) {
        return unselected;
      }

      const search = this.dossierSearchInput.toLowerCase();
      return unselected.filter(d => {
        const searchIn = [d.id.toLowerCase(), d.name.toLowerCase(), d.label || ''].join(' ');
        return this.fuzzyMatch(search, searchIn);
      });
    }
  },
  watch: {
    formData: {
      handler() {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => this.saveFormData(), 500);
      },
      deep: true
    }
  },
  mounted() {
    this.initializeForm();
  },
  methods: {
    async saveFormData() {
      const dataToSave = {
        pageUrl: this.currentPageUrl,
        reportName: this.formData.reportName,
        dossierIds: this.formData.dossierIds.join(','),
        labels: this.formData.labels.join(','),
        publishedDate: this.formData.publishedDate,
        aiDefinesConfidence: this.formData.aiDefinesConfidence,
        confidence: this.formData.confidence,
        tlpLevel: this.formData.tlpLevel,
        papLevel: this.formData.papLevel,
        admiraltySourceReliability: this.formData.admiraltySourceReliability,
        admiraltyInformationCredibility: this.formData.admiraltyInformationCredibility,
        sources: this.formData.sources.join(',')
      };
      await chrome.storage.session.set({ submitFormData: dataToSave });
    },

    async loadFormData() {
      const result = await chrome.storage.session.get(['submitFormData']);
      if (result.submitFormData) {
        const saved = result.submitFormData;
        if (saved.pageUrl !== this.currentPageUrl) {
          await chrome.storage.session.remove(['submitFormData']);
          return;
        }
        this.formData.reportName = saved.reportName || '';
        this.formData.dossierIds = saved.dossierIds ? saved.dossierIds.split(',').filter(d => d.trim()) : [];
        this.formData.labels = saved.labels ? saved.labels.split(',').filter(l => l.trim()) : [];
        this.formData.publishedDate = saved.publishedDate || '';
        this.formData.aiDefinesConfidence = saved.aiDefinesConfidence !== undefined ? saved.aiDefinesConfidence : true;
        this.formData.confidence = saved.confidence || 50;
        this.formData.tlpLevel = saved.tlpLevel || 'clear';
        this.formData.papLevel = saved.papLevel || '';
        this.formData.admiraltySourceReliability = saved.admiraltySourceReliability || '';
        this.formData.admiraltyInformationCredibility = saved.admiraltyInformationCredibility || '';
        this.formData.sources = saved.sources ? saved.sources.split(',').filter(s => s.trim()) : [];

        await this.$nextTick();
        this.validateAllFields();
      }
    },
    async initializeForm() {
      await this.loadFormData();
      await this.refreshDossiers();

      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].title && !this.formData.reportName) {
        this.formData.reportName = tabs[0].title;
      }

      if (this.currentPageUrl && !this.formData.sources.includes(this.currentPageUrl)) {
        this.formData.sources.push(this.currentPageUrl);
      }
    },

    async refreshDossiers() {
      try {
        const settings = await chrome.storage.sync.get(['apiKey', 'apiEndpoint']);

        if (!settings.apiKey) {
          console.error('No API key configured');
          return;
        }

        const response = await chrome.runtime.sendMessage({
          action: 'fetchDossiers',
          apiKey: settings.apiKey,
          apiEndpoint: settings.apiEndpoint
        });

        if (!response || response.error) {
          console.error('Failed to fetch dossiers:', response?.error || 'Unknown error');
          return;
        }

        this.dossiers = response.dossiers || [];

        await chrome.storage.local.set({
          dossierCache: {
            dossiers: this.dossiers,
            latestCreatedAt: response.latestCreatedAt,
            lastUpdated: new Date().toISOString()
          }
        });
      } catch (error) {
        console.error('Failed to refresh dossiers:', error);
      }
    },

    selectDossier(dossier) {
      if (!this.formData.dossierIds.includes(dossier.id)) {
        this.formData.dossierIds.push(dossier.id);
      }
      this.dossierSearchInput = '';
      this.saveFormData();
      this.showDossierDropdown = false;
    },

    removeDossier(dossierId) {
      const index = this.formData.dossierIds.indexOf(dossierId);
      if (index > -1) {
        this.formData.dossierIds.splice(index, 1);
      }
      this.saveFormData();
    },

    closeDossierDropdown() {
      this.showDossierDropdown = false;
    },

    fuzzyMatch(search, text) {
      let searchIdx = 0;
      for (let i = 0; i < text.length && searchIdx < search.length; i++) {
        if (text[i] === search[searchIdx]) {
          searchIdx++;
        }
      }
      return searchIdx === search.length;
    },

    addLabel() {
      this.formData.labels.push('');
    },

    removeLabel(index) {
      this.formData.labels.splice(index, 1);
      delete this.errors.labels[index];
      this.saveFormData();
    },

    addSource() {
      this.formData.sources.push('');
    },

    removeSource(index) {
      this.formData.sources.splice(index, 1);
      delete this.errors.sources[index];
      this.saveFormData();
    },

    isValidSlug(text) {
      if (!text) return false;
      return /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(text);
    },

    isValidUrl(url) {
      if (!url) return true;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },

    validateLabel(index) {
      const label = this.formData.labels[index];
      if (!label || label.trim() === '') {
        delete this.errors.labels[index];
      } else if (!this.isValidSlug(label)) {
        this.errors.labels[index] = 'Must be lowercase alphanumeric with hyphens';
      } else {
        delete this.errors.labels[index];
      }
      this.saveFormData();
    },

    validateSource(index) {
      const source = this.formData.sources[index];
      if (!source) {
        delete this.errors.sources[index];
      } else if (!this.isValidUrl(source)) {
        this.errors.sources[index] = 'Must be a valid URL';
      } else {
        delete this.errors.sources[index];
      }
      this.saveFormData();
    },

    convertToSlug(index) {
      const label = this.formData.labels[index];
      this.formData.labels[index] = label
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      this.validateLabel(index);
    },

    validatePublishedDate() {
      if (!this.formData.publishedDate) {
        this.errors.publishedDate = '';
        return;
      }

      const selectedDate = new Date(this.formData.publishedDate + 'T00:00:00Z');
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      if (selectedDate > today) {
        this.errors.publishedDate = 'Date cannot be in the future';
      } else {
        this.errors.publishedDate = '';
      }
      this.saveFormData();
    },

    validateAllFields() {
      const errors = {};
      let hasErrors = false;

      this.formData.labels.forEach((label, index) => {
        if (label && label.trim() && !this.isValidSlug(label)) {
          errors[index] = 'Must be lowercase alphanumeric with hyphens';
          hasErrors = true;
        }
      });
      this.errors.labels = errors;

      const sourceErrors = {};
      this.formData.sources.forEach((source, index) => {
        if (source && source.trim() && !this.isValidUrl(source)) {
          sourceErrors[index] = 'Must be a valid URL';
          hasErrors = true;
        }
      });
      this.errors.sources = sourceErrors;

      if (this.formData.publishedDate) {
        this.validatePublishedDate();
        if (this.errors.publishedDate) hasErrors = true;
      }

      return !hasErrors;
    },

    async handleSubmit() {
      if (!this.validateAllFields()) {
        this.$emit('submit-error', 'Please fix validation errors before submitting');
        return;
      }

      this.isSubmitting = true;
      this.$emit('submitting-change', true);

      try {
        const settings = await chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'teamId']);
        const mhtmlBlob = await this.capturePageAsMhtml();

        const submitData = {
          reportName: this.formData.reportName,
          dossierIds: this.formData.dossierIds.length > 0 ? this.formData.dossierIds : null,
          labels: this.formData.labels.filter(l => l.trim()).join(','),
          publishedDate: this.formData.publishedDate ? new Date(this.formData.publishedDate + 'T00:00:00Z').toISOString() : null,
          confidence: this.formData.aiDefinesConfidence ? null : this.formData.confidence,
          tlpLevel: this.formData.tlpLevel,
          papLevel: this.formData.papLevel || null,
          admiraltySourceReliability: this.formData.admiraltySourceReliability || null,
          admiraltyInformationCredibility: this.formData.admiraltyInformationCredibility || null,
          sources: this.formData.sources.filter(url => url.trim()).join(',')
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

          await chrome.storage.session.remove(['submitFormData']);
          this.$emit('submit-success');
        } else {
          throw new Error('Invalid response from Stixify API: Missing job ID');
        }
      } catch (error) {
        await this.saveFormData();
        this.$emit('submit-error', error.message);
      } finally {
        this.isSubmitting = false;
        this.$emit('submitting-change', false);
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
      formDataPayload.append('extraction_mode', 'standard');
      formDataPayload.append('name', formData.reportName);
      if (formData.dossierIds && formData.dossierIds.length > 0) {
        formData.dossierIds.forEach((dossierId, index) => {
          formDataPayload.append('dossier_ids', dossierId);
        });
      }
      if (formData.confidence !== null) {
        formDataPayload.append('confidence', formData.confidence);
      }
      formDataPayload.append('tlp_level', formData.tlpLevel);
      if (formData.papLevel) {
        formDataPayload.append('pap_level', formData.papLevel);
      }
      if (formData.publishedDate) {
        formDataPayload.append('created', formData.publishedDate);
      }
      if (formData.admiraltySourceReliability) {
        formDataPayload.append('admiralty_source_reliability', formData.admiraltySourceReliability);
      }
      if (formData.admiraltyInformationCredibility) {
        formDataPayload.append('admiralty_information_credibility', formData.admiraltyInformationCredibility);
      }

      if (formData.labels.length > 0) {
        formDataPayload.append('labels', formData.labels);
      }

      if (formData.sources.length > 0) {
        formDataPayload.append('sources', formData.sources);
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
      const trimmedJobs = jobs.slice(0, 10);
      await chrome.storage.local.set({ jobs: trimmedJobs });
    }
  }
};
</script>
