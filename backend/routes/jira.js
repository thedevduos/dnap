const express = require('express');
const router = express.Router();
const axios = require('axios');

// Utility: Build Authorization header
function getAuthHeader() {
  return (
    "Basic " +
    Buffer.from(
      process.env.JIRA_EMAIL + ":" + process.env.JIRA_API_TOKEN
    ).toString("base64")
  );
}

// Debug endpoint to check environment variables (remove in production)
router.get('/debug-config', (req, res) => {
  res.json({
    hasBaseUrl: !!process.env.JIRA_BASE_URL,
    hasEmail: !!process.env.JIRA_EMAIL,
    hasApiToken: !!process.env.JIRA_API_TOKEN,
    hasAccountId: !!process.env.JIRA_ACCOUNT_ID,
    baseUrl: process.env.JIRA_BASE_URL,
    email: process.env.JIRA_EMAIL,
    tokenLength: process.env.JIRA_API_TOKEN?.length || 0,
    accountId: process.env.JIRA_ACCOUNT_ID,
  });
});

// Test Jira API connectivity (remove in production)
router.get('/test-connection', async (req, res) => {
  try {
    const response = await axios.get(
      `${process.env.JIRA_BASE_URL}/rest/api/3/myself`,
      {
        headers: {
          Authorization: getAuthHeader(),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      message: "Jira API connection successful",
      user: {
        accountId: response.data.accountId,
        displayName: response.data.displayName,
        emailAddress: response.data.emailAddress,
      },
    });
  } catch (error) {
    console.error(
      "Jira API test error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Jira API connection failed",
      error: error.response?.data || error.message,
    });
  }
});

// Create Jira project
router.post('/create-project', async (req, res) => {
  try {
    const { projectKey, projectName } = req.body;

    if (!projectKey || !projectName) {
      return res.status(400).json({
        success: false,
        message: "Project key and name are required",
      });
    }

    if (
      !process.env.JIRA_BASE_URL ||
      !process.env.JIRA_EMAIL ||
      !process.env.JIRA_API_TOKEN ||
      !process.env.JIRA_ACCOUNT_ID
    ) {
      return res.status(500).json({
        success: false,
        message: "Jira configuration is incomplete",
      });
    }

    const response = await axios.post(
      `${process.env.JIRA_BASE_URL}/rest/api/3/project`,
      {
        key: projectKey, // Must be uppercase & unique (e.g., "TEST1")
        name: projectName,
        projectTypeKey: "software",
        projectTemplateKey:
          "com.pyxis.greenhopper.jira:gh-simplified-agility-kanban",
        leadAccountId: process.env.JIRA_ACCOUNT_ID,
      },
      {
        headers: {
          Authorization: getAuthHeader(),
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );

    res.json({
      success: true,
      message: "Project created successfully",
      data: response.data,
    });
  } catch (error) {
    console.error(
      "Jira project creation error:",
      error.response?.data || error.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to create Jira project",
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;
