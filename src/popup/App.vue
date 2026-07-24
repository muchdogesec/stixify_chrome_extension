<template>
  <div class="container">
    <AppHeader @open-settings="openSettings" />

    <TabsNavigation v-if="showTabs" :active-tab="activeTab" :processing-jobs-count="processingJobsCount"
      @tab-change="switchTab" />

    <LoadingState v-if="currentState === 'loading'" />

    <NoApiKeyState v-if="currentState === 'noApiKey'" @open-settings="openSettings" />

    <QuotaExceededState v-if="currentState === 'quotaExceeded'" />

    <SubmitForm v-if="currentState === 'form' && activeTab === 'submit'" :user-plan="userPlan"
      :current-page-url="currentPageUrl" @submit-success="handleSubmitSuccess" @submit-error="handleSubmitError"
      @submitting-change="value => formSubmitting = value" />

    <SuccessState v-if="currentState === 'success' && activeTab === 'submit'" @submit-another="resetToForm" />

    <ErrorState v-if="currentState === 'error' && activeTab === 'submit'" :error-message="errorMessage"
      @retry="resetToForm" />

    <JobsTab v-if="activeTab === 'jobs'" :jobs="jobs" @refresh-jobs="handleManualRefresh" />

    <FloatingLoader :status="floatingStatus" :title="floatingTitle" />
  </div>
</template>

<script>
import AppHeader from './components/AppHeader.vue';
import TabsNavigation from './components/TabsNavigation.vue';
import LoadingState from './components/LoadingState.vue';
import NoApiKeyState from './components/NoApiKeyState.vue';
import QuotaExceededState from './components/QuotaExceededState.vue';
import SubmitForm from './components/SubmitForm.vue';
import SuccessState from './components/SuccessState.vue';
import ErrorState from './components/ErrorState.vue';
import JobsTab from './components/JobsTab.vue';
import FloatingLoader from './components/FloatingLoader.vue';

export default {
  name: 'App',
  components: {
    AppHeader,
    TabsNavigation,
    LoadingState,
    NoApiKeyState,
    QuotaExceededState,
    SubmitForm,
    SuccessState,
    ErrorState,
    JobsTab,
    FloatingLoader
  },
  data() {
    return {
      currentState: 'loading',
      activeTab: 'submit',
      showTabs: false,
      userPlan: null,
      currentPageUrl: '',
      errorMessage: '',
      jobs: [],
      jobsLoading: false,
      backgroundRefreshing: false,
      formSubmitting: false,
      hasRefreshError: false
    };
  },
  computed: {
    processingJobsCount() {
      return this.jobs.filter(job =>
        job.state !== 'completed' && job.state !== 'failed'
      ).length;
    },
    isBusy() {
      return this.currentState === 'loading' ||
        this.jobsLoading ||
        this.backgroundRefreshing ||
        this.formSubmitting;
    },
    floatingStatus() {
      if (this.isBusy) return 'loading';
      if (this.hasRefreshError) return 'error';
      return null;
    },
    floatingTitle() {
      if (this.isBusy) return 'Loading...';
      if (this.hasRefreshError) return 'Some jobs failed to refresh from Stixify';
      return '';
    }
  },
  mounted() {
    this.initialize();

    chrome.runtime.onMessage.addListener((request) => {
      if (request.action === 'jobsUpdated') {
        this.loadJobs();
      }
      if (request.action === 'jobsRefreshing') {
        this.backgroundRefreshing = request.isRefreshing;
      }
      if (request.action === 'jobsRefreshError') {
        this.hasRefreshError = request.hasError;
      }
    });
  },
  unmounted() {
    chrome.runtime.sendMessage({ action: 'stopJobRefresh' });
  },
  methods: {
    async initialize() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0]) {
        this.currentPageUrl = tabs[0].url;
      }

      const result = await chrome.storage.sync.get(['apiKey', 'apiEndpoint', 'teamId']);

      if (!result.apiKey) {
        this.currentState = 'noApiKey';
        return;
      }

      try {
        const response = await chrome.runtime.sendMessage({
          action: 'fetchUserPlan',
          apiKey: result.apiKey,
          apiEndpoint: result.apiEndpoint
        });

        if (response.error) {
          throw new Error(response.error);
        }

        this.userPlan = response;

        if (response.reportsLeft <= 0) {
          this.currentState = 'quotaExceeded';
        } else {
          this.currentState = 'form';
        }

        this.showTabs = true;
        await this.loadJobs();

        chrome.runtime.sendMessage({ action: 'startJobRefresh' });
      } catch (error) {
        this.errorMessage = 'Failed to connect to Stixify API: ' + error.message;
        this.currentState = 'error';
      }
    },

    async loadJobs() {
      this.jobsLoading = true;
      const { jobs = [] } = await chrome.storage.local.get(['jobs']);
      this.jobs = jobs;
      this.jobsLoading = false;
    },

    async handleManualRefresh() {
      this.jobsLoading = true;
      await chrome.runtime.sendMessage({ action: 'refreshJobsNow' }).catch(() => {});
      await this.loadJobs();
    },

    openSettings() {
      chrome.runtime.openOptionsPage();
    },

    switchTab(tabName) {
      this.activeTab = tabName;
      if (tabName === 'jobs') {
        this.loadJobs();
      }
    },

    handleSubmitSuccess() {
      this.currentState = 'success';
      this.loadJobs();
      setTimeout(() => {
        this.switchTab('jobs');
      }, 1500);
    },

    handleSubmitError(message) {
      this.errorMessage = message;
      this.currentState = 'error';
    },

    resetToForm() {
      this.currentState = 'form';
      this.activeTab = 'submit';
    }
  }
};
</script>
