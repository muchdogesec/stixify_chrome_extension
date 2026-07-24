<template>
  <div class="tab-content">
    <div class="jobs-header">
      <h2>Processing Jobs</h2>
      <button @click="$emit('refresh-jobs')" class="icon-btn" title="Refresh">
        <Icon name="refresh" :size="18" />
      </button>
    </div>

    <div v-if="jobs.length === 0" class="empty-state">
      <p>No jobs yet</p>
      <p class="help-text">Submit a report to see jobs here</p>
    </div>

    <div v-else class="jobs-list">
      <table class="jobs-table">
        <thead>
          <tr>
            <th>Report Name</th>
            <th>State</th>
            <th>Uploaded</th>
            <th>Completed</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in sortedJobs" :key="job.id" :job_id="job.id" class="job-row" @click="openJobReport(job)"
            style="cursor: pointer;">
            <td>
              <div class="job-name" :title="job.name">{{ job.name }}</div>
            </td>
            <td>
              <span class="job-state" :class="job.state">{{ job.state }}</span>
            </td>
            <td>
              <span class="job-time">{{ formatDate(job.upload_time) }}</span>
            </td>
            <td>
              <span v-if="job.completion_time" class="job-time">
                {{ formatDate(job.completion_time) }}
              </span>
              <span v-else class="job-time pending">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <button @click="openAllUploads" class="view-all-uploads">View all uploads</button>
  </div>
</template>

<script>
import Icon from '@/components/Icon.vue';

export default {
  name: 'JobsTab',
  components: { Icon },
  props: {
    jobs: {
      type: Array,
      required: true
    }
  },
  emits: ['refresh-jobs'],
  computed: {
    sortedJobs() {
      return [...this.jobs].sort((a, b) =>
        new Date(b.upload_time) - new Date(a.upload_time)
      );
    }
  },
  methods: {
    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    },

    openJobReport(job) {
      // Use stored job_url if available, otherwise construct it
      if (job.job_url) {
        chrome.tabs.create({ url: job.job_url });
      } else {
        // Fallback for old jobs without job_url
        this.constructAndOpenJobUrl(job);
      }
    },

    async constructAndOpenJobUrl(job) {
      const { apiEndpoint, teamId } = await chrome.storage.sync.get(['apiEndpoint', 'teamId']);
      const baseUrl = (apiEndpoint).replace('api.', 'app.');
      const jobUrl = `${baseUrl}/${teamId}/${job.report_id}/uploads/${job.id}`;
      chrome.tabs.create({ url: jobUrl });
    },

    async openAllUploads() {
      const { apiEndpoint, teamId } = await chrome.storage.sync.get(['apiEndpoint', 'teamId']);
      const baseUrl = (apiEndpoint).replace('api.', 'app.');
      chrome.tabs.create({ url: `${baseUrl}/${teamId}/uploads` });
    }
  }
};
</script>
