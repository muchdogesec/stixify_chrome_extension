// Background service worker for Stixify extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(function (details) {
  if (details.reason === 'install') {
    console.log('Stixify extension installed')
    // Open options page on first install
    chrome.runtime.openOptionsPage()
  } else if (details.reason === 'update') {
    console.log(
      'Stixify extension updated to version',
      chrome.runtime.getManifest().version
    )
  }
})

// Handle messages from popup or content scripts
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === 'captureTab') {
    handleCaptureTab(request.tabId)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }))
    return true // Keep channel open for async response
  }

  if (request.action === 'checkApiKey') {
    chrome.storage.sync.get(['apiKey'], function (result) {
      sendResponse({ hasApiKey: !!result.apiKey })
    })
    return true
  }

  if (request.action === 'fetchUserPlan') {
    fetchUserPlan(request.apiKey, request.apiEndpoint)
      .then(sendResponse)
      .catch(error => sendResponse({ error: error.message }))
    return true
  }

  if (request.action === 'startJobRefresh') {
    startJobRefresh()
    sendResponse({ success: true })
    return true
  }

  if (request.action === 'stopJobRefresh') {
    stopJobRefresh()
    sendResponse({ success: true })
    return true
  }

  if (request.action === 'refreshJobsNow') {
    refreshIncompleteJobs().then(() => {
      sendResponse({ success: true })
    })
    return true
  }
})

// Handle tab capture
async function handleCaptureTab (tabId) {
  try {
    // Get the tab
    const tab = await chrome.tabs.get(tabId)

    // Save page as MHTML
    const mhtmlData = await chrome.pageCapture.saveAsMHTML({ tabId: tabId })

    return {
      success: true,
      data: mhtmlData,
      url: tab.url,
      title: tab.title
    }
  } catch (error) {
    console.error('Failed to capture tab:', error)
    throw error
  }
}

// Fetch user plan from Stixify API
async function fetchUserPlan (apiKey, apiEndpoint) {
  const endpoint = `${apiEndpoint || 'https://api.stixify.com'}/v1/team/`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'API-KEY': apiKey,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`API returned ${response.status}: ${response.statusText}`)
  }

  const data = await response.json()
  const teamDetails = data.details
  const subscription = data.subscription

  const reportsLeft =
    teamDetails.allowed_reports_per_month - teamDetails.month_upload_count

  let planName = 'Free'
  if (subscription && subscription.status === 'active') {
    planName = subscription.items[0]?.price?.product_name || 'Full access'
  }

  return {
    planName,
    reportsLeft,
    hasAIAccess: teamDetails.allowed_ai_mode || false,
    hasActiveSubscription: teamDetails.has_active_subscription || false,
    teamId: teamDetails.id,
    teamName: teamDetails.name
  }
}

// Monitor API requests (optional - for debugging)
// Note: Requires webRequest permission in manifest.json if you want to enable this
// chrome.webRequest?.onBeforeRequest.addListener(
//   function(details) {
//     console.log('Stixify API request:', details.url);
//   },
//   { urls: ["*://api.stixify.com/*", "*://stixify.com/*"] }
// );

// Background job refresh functionality
let jobRefreshInterval = null

// Start background job refresh
function startJobRefresh () {
  if (jobRefreshInterval) {
    clearInterval(jobRefreshInterval)
  }

  // Refresh immediately on start
  refreshIncompleteJobs()

  // Then refresh every 10 seconds
  jobRefreshInterval = setInterval(async () => {
    await refreshIncompleteJobs()
  }, 10000)
}

// Stop background refresh
function stopJobRefresh () {
  if (jobRefreshInterval) {
    clearInterval(jobRefreshInterval)
    jobRefreshInterval = null
  }
}

// Refresh incomplete jobs from API
async function refreshIncompleteJobs () {
  try {
    const settings = await chrome.storage.sync.get(['apiKey', 'apiEndpoint'])
    if (!settings.apiKey) return

    const { jobs = [] } = await chrome.storage.local.get(['jobs'])
    const incompleteJobs = jobs.filter(
      job => job.state !== 'completed' && job.state !== 'failed'
    )

    if (incompleteJobs.length === 0) {
      stopJobRefresh() // Stop refreshing if no incomplete jobs
      return
    }

    let hasUpdates = false

    for (const job of incompleteJobs) {
      try {
        const updatedJob = await fetchJobStatus(
          job.id,
          settings.apiKey,
          settings.apiEndpoint
        )
        await updateJob(job.id, updatedJob)
        hasUpdates = true
      } catch (error) {
        console.error('Failed to refresh job:', job.id, error)
      }
    }

    // Notify popup if there are updates
    if (hasUpdates) {
      notifyPopupOfJobUpdates()
    }
  } catch (error) {
    console.error('Error in refreshIncompleteJobs:', error)
  }
}

// Fetch job status from API
async function fetchJobStatus (jobId, apiKey, apiEndpoint) {
  const endpoint = `${
    apiEndpoint || 'https://api.stixify.com'
  }/v1/jobs/${jobId}/`

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      'API-KEY': apiKey,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    throw new Error(`Failed to fetch job status: ${response.status}`)
  }

  const job = await response.json()
  return {
    id: job.id,
    state: job.state,
    completion_time: job.metadata.completion_time,
    profile: job.profile
  }
}

// Update a job in storage
async function updateJob (jobId, updates) {
  const { jobs = [] } = await chrome.storage.local.get(['jobs'])
  const jobIndex = jobs.findIndex(j => j.id === jobId)

  if (jobIndex !== -1) {
    jobs[jobIndex] = { ...jobs[jobIndex], ...updates }
    await chrome.storage.local.set({ jobs })
  }
}

// Notify popup of job updates
function notifyPopupOfJobUpdates () {
  chrome.runtime.sendMessage({ action: 'jobsUpdated' }).catch(() => {
    // Popup might not be open, ignore error
  })
}

console.log('Stixify background service worker loaded')
