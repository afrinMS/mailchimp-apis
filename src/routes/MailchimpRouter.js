require("dotenv").config();
const express = require("express");
const router = express.Router();
const { default: axios } = require("axios");
const crypto = require("crypto");

// MailChimp All Lists
router.get("/api/mailchimp/list/:apiKey", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    if (!apiKey) {
      return res
        .status(400)
        .json({ error: "Missing Mailchimp API key or list ID" });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return res.status(200).json({ data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// MailChimp List Info
router.get("/api/mailchimp/list-info/:apiKey/:listId", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const listId = req.params.listId;

    if (!apiKey || !listId) {
      return res
        .status(400)
        .json({ error: "Missing Mailchimp API key or list ID" });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return res.status(200).json({ data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// MailChimp Create List
router.post("/api/mailchimp/create-list/:apiKey", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const listId = req.params.listId;
    const {
      listName,
      companyName,
      companyAddress,
      companyCity,
      companyState,
      companyZip,
      companyCountry,
      campaignFromName,
      campaignFromEmail,
      campaignSubject,
    } = req.body;

    if (!apiKey || !listId) {
      return res
        .status(400)
        .json({ error: "Missing Mailchimp API key or list ID" });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const response = await axios.post(
      url,
      {
        name: listName,
        permission_reminder: "permission_reminder",
        email_type_option: true,
        contact: {
          company: companyName,
          address1: companyAddress,
          city: companyCity,
          state: companyState, // add state if required
          zip: companyZip, // add zip code if required
          country: companyCountry, // IN
        },
        campaign_defaults: {
          from_name: campaignFromName,
          from_email: campaignFromEmail,
          subject: campaignSubject,
          language: "en",
        },
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    return res.status(200).json({ data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// Fetch all members from Mailchimp list
router.get("/api/mailchimp/member-list/:apiKey/:listId", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const listId = req.params.listId;

    if (!apiKey || !listId) {
      return res
        .status(400)
        .json({ error: "Missing Mailchimp API key or list ID" });
    }

    const dataCenter = apiKey.split("-")[1];
    const baseUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");
    let members = [];
    let memberData = [];
    let offset = 0;
    const count = 100; // Number of records to fetch per request, maximum is 100

    while (true) {
      const response = await axios.get(baseUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        params: {
          offset: offset,
          count: count,
        },
      });

      members = members.concat(response.data.members);

      // Break the loop if there are no more members to fetch
      if (response.data.members.length < count) {
        memberData = {
          ...response.data,
          members,
        };
        break;
      }

      offset += count;
    }

    return res.status(200).json({ data: memberData });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// MailChimp Member Info
router.get(
  "/api/mailchimp/member-info/:apiKey/:listId/:email",
  async (req, res) => {
    try {
      const { email } = req.params;
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;

      if (!apiKey || !listId || !email) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key, list ID, or email" });
      }

      const dataCenter = apiKey.split("-")[1];
      const subscriberHash = crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex");
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({ data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Add Member
router.post("/api/mailchimp/add-member/:apiKey/:listId", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const listId = req.params.listId;
    const { email, firstName, lastName, status, tags } = req.body;

    if (!apiKey || !listId || !email) {
      return res
        .status(400)
        .json({ error: "Missing Mailchimp API key, list ID, or email" });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const response = await axios.post(
      url,
      {
        email_address: email,
        status: status, // or "pending" if you want to send a confirmation email
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
        tags: tags,
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    res
      .status(200)
      .json({ message: "Contact Added Successfully", data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      const newDataString = errorDetail.replace(
        " Use PUT to insert or update list members.",
        ""
      );
      return res.status(400).json({ error: newDataString });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// MailChimp Update Member Info
router.put("/api/mailchimp/edit-member/:apiKey/:listId", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const listId = req.params.listId;
    const { email, firstName, lastName, status } = req.body;
    if (!apiKey || !listId || !email) {
      return res
        .status(400)
        .json({ error: "Missing Mailchimp API key, list ID, or email" });
    }

    const dataCenter = apiKey.split("-")[1];
    const subscriberHash = crypto
      .createHash("md5")
      .update(email.toLowerCase())
      .digest("hex");
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const response = await axios.put(
      url,
      {
        email_address: email,
        status: status || "subscribed", // update subscription status if provided
        merge_fields: {
          FNAME: firstName,
          LNAME: lastName,
        },
      },
      {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      }
    );

    res
      .status(200)
      .json({ message: "Contact Updated Successfully", data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// MailChimp Archive Member
router.delete(
  "/api/mailchimp/archive-member/:apiKey/:listId/:email",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const { email, listId } = req.params;

      if (!apiKey || !listId || !email) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key, list ID, or email" });
      }

      const dataCenter = apiKey.split("-")[1];
      const subscriberHash = crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex");

      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      await axios.delete(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({
        message: "Archived Successfully",
      });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Specific Member's Tag
router.get(
  "/api/mailchimp/member-tags/:apiKey/:listId/:email",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const { email } = req.params;

      if (!apiKey || !listId || !email) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key, list ID, or email" });
      }

      const dataCenter = apiKey.split("-")[1];
      const subscriberHash = crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex");
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}/tags`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({ data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp All segments
router.get("/api/mailchimp/segment-list/:apiKey/:listId", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const listId = req.params.listId;

    if (!apiKey || !listId) {
      return res
        .status(400)
        .json({ error: "Missing Mailchimp API key or list ID" });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({ data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// MailChimp Segment Info
router.get(
  "/api/mailchimp/segment-info/:apiKey/:listId/:segmentId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const segmentId = req.params.segmentId;

      if (!apiKey || !listId || !segmentId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments/${segmentId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({ data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Create Segment
router.post(
  "/api/mailchimp/create-segment/:apiKey/:listId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const { segmentName, conditions } = req.body;

      if (!apiKey || !listId || !segmentName || !conditions) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      let segmentData = {
        name: segmentName,
        static_segment: [],
      };

      if (conditions.length > 0) {
        segmentData.options = {
          match: "any", // or 'all', based on how you want to match conditions
          conditions: conditions,
        };
      }

      const response = await axios.post(url, segmentData, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({
        message: "Segment Created Successfully",
        segment: response.data,
      });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Update Segment
router.patch(
  "/api/mailchimp/update-segment/:apiKey/:listId/:segmentId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const segmentId = req.params.segmentId;
      const { segmentName, conditions } = req.body;

      if (!apiKey || !listId || !segmentId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const dataCenter = apiKey.split("-")[1];
      const baseUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments/${segmentId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      // Fetch current segment details
      const currentSegmentResponse = await axios.get(baseUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      const currentSegment = currentSegmentResponse.data;
      let updatedStaticSegment = currentSegment.static_segment;

      // Merge the new conditions with the existing static segment
      if (conditions && conditions.length > 0) {
        updatedStaticSegment = updatedStaticSegment.concat(conditions);
      }

      let segmentData = {
        name: segmentName || currentSegment.name,
        static_segment: updatedStaticSegment,
      };

      const response = await axios.patch(baseUrl, segmentData, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      res
        .status(200)
        .json({ message: "Segment Updated Successfully", data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Delete Segment
router.delete(
  "/api/mailchimp/delete-segment/:apiKey/:listId/:segmentId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const segmentId = req.params.segmentId;

      if (!apiKey || !listId || !segmentId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments/${segmentId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      await axios.delete(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({ message: "Segment deleted successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Batch add or remove members from segment
router.post(
  "/api/mailchimp/batch-add-remove-member-segment/:apiKey/:listId/:segmentId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const segmentId = req.params.segmentId;
      const { members_to_add, members_to_remove } = req.body;

      if (!apiKey || !listId || !segmentId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments/${segmentId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const data = {};

      if (members_to_add && members_to_add.length > 0) {
        data.members_to_add = members_to_add;
      }

      if (members_to_remove && members_to_remove.length > 0) {
        data.members_to_remove = members_to_remove;
      }

      if (Object.keys(data).length === 0) {
        return res.status(400).json({ error: "No members to add or remove" });
      }

      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({ data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.errors || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp All Tags
router.get(
  "/api/mailchimp/tag-list/:apiKey/:listId/:tagCount",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const tagCount = req.params.tagCount;

      if (!apiKey || !listId) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key or list ID" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      // Filter segments to include only those of type 'static'
      const staticSegments = response.data.segments.filter(
        (segment) => segment.type === "static"
      );

      // Extract tags from the response
      const tags = staticSegments || [];

      let topTags = staticSegments;
      if (tagCount !== 9999) {
        // Slice to get only the top 3 tags
        topTags = { tags: tags.slice(0, tagCount) };
      }

      return res.status(200).json({ data: topTags });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Create Member Tag
router.post(
  "/api/mailchimp/add-member-tag/:apiKey/:listId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const { email, tag } = req.body;

      if (!apiKey || !listId || !email || !tag) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key, list ID, email, or tag" });
      }

      const dataCenter = apiKey.split("-")[1];
      const subscriberHash = crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex");
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}/tags`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        {
          tags: [{ name: tag, status: "active" }],
        },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({ data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Add Remove Member Tag
router.post(
  "/api/mailchimp/update-member-tags/:apiKey/:listId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const { email, tags } = req.body;

      if (!apiKey || !listId || !email || !tags) {
        return res.status(400).json({
          error: "Missing Mailchimp API key, list ID, email, or tags",
        });
      }

      const dataCenter = apiKey.split("-")[1];
      const subscriberHash = crypto
        .createHash("md5")
        .update(email.toLowerCase())
        .digest("hex");
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members/${subscriberHash}/tags`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        { tags },
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        message: "Member tag Updated Successfully",
        data: response.data,
      });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Tag Info
router.get(
  "/api/mailchimp/tag-info/:apiKey/:listId/:tagId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const tagId = req.params.tagId;

      if (!apiKey || !listId || !tagId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments/${tagId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({ data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Create Tag
router.post("/api/mailchimp/create-tag/:apiKey/:listId", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const listId = req.params.listId;
    const { tagName, conditions } = req.body;

    if (!apiKey || !listId || !tagName || !conditions) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    let tagData = {
      name: tagName,
      static_segment: [],
    };

    if (conditions.length > 0) {
      tagData.options = {
        match: "any", // or 'all', based on how you want to match conditions
        conditions: conditions,
      };
    }

    const response = await axios.post(url, tagData, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({
      message: "Tag Created Successfully",
      tag: response.data,
    });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// MailChimp Update Tag
router.patch(
  "/api/mailchimp/update-tag/:apiKey/:listId/:tagId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const tagId = req.params.tagId;
      const { tagName, conditions } = req.body;

      if (!apiKey || !listId || !tagId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const dataCenter = apiKey.split("-")[1];
      const baseUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments/${tagId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      // Fetch current tag details
      const currentTagResponse = await axios.get(baseUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      const currentTag = currentTagResponse.data;
      let updatedStaticTag = currentTag.static_segment;

      // Merge the new conditions with the existing static segment
      if (conditions && conditions.length > 0) {
        updatedStaticTag = updatedStaticTag.concat(conditions);
      }

      let tagData = {
        name: tagName || currentTag.name,
        static_segment: updatedStaticTag,
      };

      const response = await axios.patch(baseUrl, tagData, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      res
        .status(200)
        .json({ message: "Tag Updated Successfully", data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Delete Tag
router.delete(
  "/api/mailchimp/delete-tag/:apiKey/:listId/:tagId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const tagId = req.params.tagId;

      if (!apiKey || !listId || !tagId) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/segments/${tagId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      await axios.delete(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({ message: "Tag deleted successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Get members by tag name
router.get(
  "/api/mailchimp/members-by-tag/:apiKey/:listId/:tagId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const tagId = req.params.tagId;

      if (!apiKey || !listId || !tagId) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key, list ID, or tag name" });
      }

      const dataCenter = apiKey.split("-")[1];
      const tagSearchUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/tag-search`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      // Step 1: Get Tag ID by Tag Name
      const tagResponse = await axios.get(tagSearchUrl, {
        headers: {
          Authorization: `Basic ${auth}`,
        },
        params: {
          id: tagId, // Searching for the tag by its name
        },
      });

      // Check if we found any tags
      if (!tagResponse.data.tags || tagResponse.data.tags.length === 0) {
        return res.status(404).json({ error: "Tag not found" });
      }

      // Extract the tag ID from the response
      const tag_id = tagResponse.data.tags[0].id;

      // Step 2: Get Members associated with the Tag ID
      const membersUrl = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/members?fields=members.id,members.email_address,members.full_name,members.status,members.merge_fields,members.source,members.tags`;
      let members = [];
      let membersWithTag = [];
      let offset = 0;
      const count = 500; // Number of records to fetch per request, maximum is 100

      while (true) {
        const response = await axios.get(membersUrl, {
          headers: {
            Authorization: `Basic ${auth}`,
          },
          params: {
            offset: offset,
            count: count,
          },
        });

        members = members.concat(response.data.members);
        // Break the loop if there are no more members to fetch
        if (response.data.members.length < count) {
          // Filter members that have the specific tag
          membersWithTag = members.filter((member) =>
            member.tags.some((tag) => tag.id == tagId)
          );
          break;
        }

        offset += count;
      }

      // Return the filtered members
      const mems = { members: membersWithTag };
      return res.status(200).json({ data: mems });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp All Signup forms
router.get("/api/mailchimp/signup-forms/:apiKey/:listId", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const listId = req.params.listId;

    if (!apiKey || !listId) {
      return res
        .status(400)
        .json({ error: "Missing Mailchimp API key or list ID" });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/signup-forms`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    return res.status(200).json({ data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// MailChimp Customize the signup form
router.post(
  "/api/mailchimp/customize-signup-form/:apiKey/:listId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const {
        title,
        header_text,
        header_image_url,
        footer,
        from_name,
        from_email,
        subject,
      } = req.body;

      if (!apiKey || !listId) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key or list ID" });
      }

      if (
        !title &&
        !header_text &&
        !header_image_url &&
        !footer &&
        !from_name &&
        !from_email &&
        !subject
      ) {
        return res
          .status(400)
          .json({ error: "No customization parameters provided" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/signup-forms`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const data = {};
      if (title) data.title = title;
      if (header_text || header_image_url) {
        data.header = {};
        if (header_text) data.header.text = header_text;
        if (header_image_url) data.header.image_url = header_image_url;
      }
      if (footer) data.footer = footer;
      if (from_name) data.from_name = from_name;
      if (from_email) data.from_email = from_email;
      if (subject) data.subject = subject;

      const response = await axios.post(url, data, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({ data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp All surveys
router.get("/api/mailchimp/survey-list/:apiKey/:listId", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const listId = req.params.listId;

    if (!apiKey || !listId) {
      return res
        .status(400)
        .json({ error: "Missing Mailchimp API key or list ID" });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/surveys`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({ data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// MailChimp Survey info
router.get(
  "/api/mailchimp/survey-info/:apiKey/:listId/:survey_id",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const surveyId = req.params.survey_id;

      if (!apiKey || !listId || !surveyId) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key, list ID, or survey ID" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/surveys/${surveyId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(url, {
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/json",
        },
      });

      return res.status(200).json({ data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Publish Survey
router.post(
  "/api/mailchimp/publish-survey/:apiKey/:listId/:survey_id",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const surveyId = req.params.survey_id;

      if (!apiKey || !listId || !surveyId) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key, list ID, or survey ID" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/surveys/${surveyId}/actions/publish`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        message: "Survey Published Successfully",
        data: response.data,
      });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp Unpublish Survey
router.post(
  "/api/mailchimp/unpublish-survey/:apiKey/:listId/:survey_id",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const listId = req.params.listId;
      const surveyId = req.params.survey_id;

      if (!apiKey || !listId || !surveyId) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key, list ID, or survey ID" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/lists/${listId}/surveys/${surveyId}/actions/unpublish`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            Authorization: `Basic ${auth}`,
            "Content-Type": "application/json",
          },
        }
      );

      return res.status(200).json({
        message: "Survey Unpublished Successfully",
        data: response.data,
      });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp All Campaigns
router.get("/api/mailchimp/campaigns/:apiKey", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);

    if (!apiKey) {
      return res.status(400).json({ error: "Missing Mailchimp API key" });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    const response = await axios.get(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
    });

    return res.status(200).json({ data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// Mailchimp campaign info
router.get(
  "/api/mailchimp/campaign-info/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey || !campaignId) {
        return res
          .status(400)
          .json({ error: "Missing Mailchimp API key or campaign Id" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json({ data: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp create campaign
router.post("/api/mailchimp/create-campaign/:apiKey", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);
    const {
      type,
      list_id,
      saved_segment_id,
      subject_line,
      title,
      from_name,
      reply_to,
      template_id,
    } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: "Missing Mailchimp API key",
      });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    let campaignData = {
      type: type,
      recipients: {
        list_id: list_id,
      },
      settings: {
        subject_line: subject_line,
        title: title,
        from_name: from_name,
        reply_to: reply_to,
        template_id: template_id,
      },
    };

    if (saved_segment_id > 1) {
      campaignData.recipients.segment_opts = {
        saved_segment_id: saved_segment_id,
      };
    }

    // if (type === "rss") {
    //   const type1 = {
    //     rss_opts: {
    //       feed_url: rss_opts.feed_url,
    //       frequency: rss_opts.frequency,
    //       schedule: {
    //         hour: rss_opts.schedule_hour,
    //         daily_send: rss_opts.schedule_daily_send, // only required if frequency is 'daily'
    //         weekly_send_day: rss_opts.schedule_weekly_send_day, // only required if frequency is 'weekly'
    //         monthly_send_date: rss_opts.schedule_monthly_send_date, // only required if frequency is 'monthly'
    //       },
    //     },
    //   };
    //   campaignData = {
    //     ...campaignData,
    //     ...type1,
    //   };
    // }

    const response = await axios.post(url, campaignData, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
    });

    res
      .status(200)
      .json({ message: "Campaign Created Successfully", data: response.data });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// Mailchimp update campaign
router.patch(
  "/api/mailchimp/update-campaign/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;
      const {
        type,
        list_id,
        subject_line,
        title,
        from_name,
        reply_to,
        saved_segment_id,
        template_id,
      } = req.body;

      let campaignSettings = {
        recipients: {
          list_id: list_id,
        },
        settings: {
          subject_line: subject_line,
          title: title,
          from_name: from_name,
          reply_to: reply_to,
          template_id: template_id,
        },
      };

      if (saved_segment_id > 1) {
        campaignSettings.recipients.segment_opts = {
          saved_segment_id: saved_segment_id,
        };
      }

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      if (!campaignSettings || typeof campaignSettings !== "object") {
        return res.status(400).json({ error: "Invalid campaign settings" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.patch(url, campaignSettings, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      res.status(200).json({
        message: "Campaign Updated Successfully",
        data: response.data,
      });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp Delete campaign
router.delete(
  "/api/mailchimp/delete-campaign/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.delete(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json({ message: "Campaign deleted successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp Send Campaign
router.post(
  "/api/mailchimp/send-campaign/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/send`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return res.status(200).json({ message: "Campaign sent successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp Schedule Campaign
router.post(
  "/api/mailchimp/schedule-campaign/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;
      const { schedule_time } = req.body; // Expecting a JSON body with schedule_time

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      if (!schedule_time) {
        return res.status(400).json({ error: "Missing schedule time" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/schedule`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        { schedule_time },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return res
        .status(200)
        .json({ message: "Campaign scheduled successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp Unschedule Campaign
router.post(
  "/api/mailchimp/unschedule-campaign/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/unschedule`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return res
        .status(200)
        .json({ message: "Campaign unscheduled successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp replicate campaign
router.post(
  "/api/mailchimp/replicate-campaign/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/replicate`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return res.status(200).json({
        message: "Campaign replicated successfully",
        campaign: response.data,
      });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp Resend the campaign
router.post(
  "/api/mailchimp/resend-to-non-openers/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const createResendUrl = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/create-resend`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      // Create a resend to non-openers campaign
      const createResendResponse = await axios.post(
        createResendUrl,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      const newCampaignId = createResendResponse.data.id;

      // Send the new campaign
      const sendUrl = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${newCampaignId}/actions/send`;
      await axios.post(
        sendUrl,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return res.status(200).json({
        message: "Resend to non-openers campaign created and sent successfully",
      });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp pause rss campaign
router.post(
  "/api/mailchimp/pause-rss-campaign/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/pause`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      res
        .status(200)
        .json({ message: "RSS-driven campaign paused successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp resume rss campaign
router.post(
  "/api/mailchimp/resume-rss-campaign/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/resume`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        {},
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      res
        .status(200)
        .json({ message: "RSS-driven campaign resumed successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp send test mail
router.post(
  "/api/mailchimp/send-test-email/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;
      const { test_emails, send_type } = req.body;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      if (!test_emails || !send_type) {
        return res
          .status(400)
          .json({ error: "Missing required fields: test_emails, send_type" });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/actions/test`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.post(
        url,
        { test_emails, send_type },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${auth}`,
          },
        }
      );

      return res.status(200).json({ message: "Test email sent successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp get campaign content
router.get(
  "/api/mailchimp/campaign-content/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const contentUrl = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(contentUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json(response.data);
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp set campaign content
router.put(
  "/api/mailchimp/set-campaign-content/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const { html, plain_text, url, archive_html } = req.body;

      if (!html && !plain_text && !url && !archive_html) {
        return res.status(400).json({
          error:
            "At least one content field is required: html, plain_text, url, archive_html",
        });
      }

      const dataCenter = apiKey.split("-")[1];
      const setContentUrl = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/content`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const contentData = {
        ...(html && { html }),
        ...(plain_text && { plain_text }),
        ...(url && { url }),
        ...(archive_html && { archive_html }),
      };

      const response = await axios.put(setContentUrl, contentData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json(response.data);
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp get campaign feedbacks
router.get(
  "/api/mailchimp/get-campaign-comments/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const getCommentsUrl = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/feedback`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(getCommentsUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json(response.data);
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// MailChimp add campaign feedback
router.post(
  "/api/mailchimp/add-campaign-feedback/:apiKey/:campaignId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const { message, email } = req.body;

      if (!message || !email) {
        return res
          .status(400)
          .json({ error: "Missing required fields: message, email" });
      }

      const dataCenter = apiKey.split("-")[1];
      const postFeedbackUrl = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/feedback`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const feedbackData = {
        message,
        email,
      };

      const response = await axios.post(postFeedbackUrl, feedbackData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json(response.data);
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp get feedback info
router.get(
  "/api/mailchimp/get-campaign-feedback/:apiKey/:campaignId/:feedbackId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;
      const feedbackId = req.params.feedbackId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const getFeedbackUrl = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/feedback/${feedbackId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(getFeedbackUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json(response.data);
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp update campaign feedback
router.patch(
  "/api/mailchimp/update-campaign-feedback/:apiKey/:campaignId/:feedbackId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;
      const feedbackId = req.params.feedbackId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const { message } = req.body;

      if (!message) {
        return res
          .status(400)
          .json({ error: "Missing required field: message" });
      }

      const dataCenter = apiKey.split("-")[1];
      const updateFeedbackUrl = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/feedback/${feedbackId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const feedbackData = {
        message,
      };

      const response = await axios.patch(updateFeedbackUrl, feedbackData, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json(response.data);
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp Delete campaign feedback
router.delete(
  "/api/mailchimp/delete-campaign-feedback/:apiKey/:campaignId/:feedbackId",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const campaignId = req.params.campaignId;
      const feedbackId = req.params.feedbackId;

      if (!apiKey) {
        return res.status(400).json({ error: "Missing Mailchimp API key" });
      }

      const dataCenter = apiKey.split("-")[1];
      const deleteFeedbackUrl = `https://${dataCenter}.api.mailchimp.com/3.0/campaigns/${campaignId}/feedback/${feedbackId}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.delete(deleteFeedbackUrl, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json({ message: "Feedback deleted successfully" });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

// Mailchimp List templates
router.get("/api/mailchimp/list-templates/:apiKey", async (req, res) => {
  try {
    const apiKey = atob(req.params.apiKey);

    if (!apiKey) {
      return res.status(400).json({
        error: "Missing Mailchimp API key",
      });
    }

    const dataCenter = apiKey.split("-")[1];
    const url = `https://${dataCenter}.api.mailchimp.com/3.0/templates`;
    const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

    let templates = [];
    let offset = 0;
    const count = 300; // You can adjust this to a value that Mailchimp allows

    while (true) {
      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
        params: {
          count: count,
          offset: offset,
        },
      });

      templates = templates.concat(response.data.templates);

      if (response.data.templates.length < count) {
        break;
      }

      offset += count;
    }

    return res.status(200).json({ templates: templates });
  } catch (error) {
    if (error.response) {
      // Extract the error detail from Mailchimp's response
      const errorDetail = error.response.data?.detail || "Unknown error";
      return res.status(400).json({ error: errorDetail });
    } else if (error.request) {
      return res.status(500).json({
        error: "No response received from Mailchimp API",
        details: error.message,
      });
    } else {
      return res.status(500).json({
        error: "Error setting up request to Mailchimp API",
        details: error.message,
      });
    }
  }
});

// Mailchimp Template info
router.get(
  "/api/mailchimp/template-info/:apiKey/:template_id",
  async (req, res) => {
    try {
      const apiKey = atob(req.params.apiKey);
      const { template_id } = req.params;

      if (!apiKey) {
        return res.status(400).json({
          error: "Missing Mailchimp API key",
        });
      }

      const dataCenter = apiKey.split("-")[1];
      const url = `https://${dataCenter}.api.mailchimp.com/3.0/templates/${template_id}`;
      const auth = Buffer.from(`anystring:${apiKey}`).toString("base64");

      const response = await axios.get(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Basic ${auth}`,
        },
      });

      return res.status(200).json({ template: response.data });
    } catch (error) {
      if (error.response) {
        // Extract the error detail from Mailchimp's response
        const errorDetail = error.response.data?.detail || "Unknown error";
        return res.status(400).json({ error: errorDetail });
      } else if (error.request) {
        return res.status(500).json({
          error: "No response received from Mailchimp API",
          details: error.message,
        });
      } else {
        return res.status(500).json({
          error: "Error setting up request to Mailchimp API",
          details: error.message,
        });
      }
    }
  }
);

module.exports = router;
