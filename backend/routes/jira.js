const express = require('express');
const router = express.Router();
const axios = require('axios');

// Create Jira project
router.post('/create-project', async (req, res) => {
  try {
    const { projectKey, projectName } = req.body;

    // Validate required fields
    if (!projectKey || !projectName) {
      return res.status(400).json({
        success: false,
        message: 'Project key and name are required'
      });
    }

    // Validate environment variables
    if (!process.env.JIRA_BASE_URL || !process.env.JIRA_EMAIL || !process.env.JIRA_API_TOKEN || !process.env.JIRA_ACCOUNT_ID) {
      return res.status(500).json({
        success: false,
        message: 'Jira configuration is incomplete'
      });
    }

    const response = await axios.post(
      `${process.env.JIRA_BASE_URL}/rest/api/3/project`,
      {
        key: projectKey, // Must be unique & uppercase (e.g., "TEST1")
        name: projectName,
        projectTypeKey: "software",
        projectTemplateKey: "com.pyxis.greenhopper.jira:gh-simplified-agility-kanban",
        leadAccountId: process.env.JIRA_ACCOUNT_ID,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
        auth: {
          username: process.env.JIRA_EMAIL,
          password: process.env.JIRA_API_TOKEN,
        },
      }
    );

    res.json({
      success: true,
      message: "Project created successfully",
      data: response.data,
    });
  } catch (error) {
    console.error('Jira project creation error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to create Jira project',
      error: error.response?.data || error.message,
    });
  }
});

module.exports = router;