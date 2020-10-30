const bent = require("bent");
const formurlencoded = require("form-urlencoded").default;

const { is31DaysOrMoreApart } = require("./helpers.js");

/**
 * A client for accessing the Phabricator API.
 */
class ConduitClient {
  constructor(apiToken, basePhabricatorUrl) {
    this.apiToken = apiToken;
    this.basePhabricatorUrl = basePhabricatorUrl;
  }

  async fetchUser(username) {
    const get = bent(this.basePhabricatorUrl, "GET", 200);
    const headers = {
      "api.token": this.apiToken,
      constraints: {
        usernames: [username],
      },
    };

    const response = await get("/api/user.search", formurlencoded(headers));
    const jsonResponse = await response.json();
    return jsonResponse.result.data;
  }

  async fetchDiffs(authorPHID) {
    const get = bent(this.basePhabricatorUrl, "GET", 200);
    const headers = {
      "api.token": this.apiToken,
      constraints: {
        authorPHIDs: [authorPHID],
      },
    };

    const response = await get(
      "/api/differential.revision.search",
      formurlencoded(headers)
    );
    const jsonResponse = await response.json();
    return jsonResponse.result.data;
  }

  async getMonthAgoDiff(username) {
    const userData = await this.fetchUser(username).catch((error) => {
      console.log(error);
    });
    const diffsData = await this.fetchDiffs(userData[0].phid).catch((error) => {
      console.log(error);
    });
    const today = Date.now();
    const approxMonthAgoDiff = diffsData.find((diff) =>
      is31DaysOrMoreApart(diff.fields.dateModified * 1000, today)
    );
    return {
      phabricatorUrl: approxMonthAgoDiff.fields.uri,
      title: approxMonthAgoDiff.fields.title,
      summary: approxMonthAgoDiff.fields.summary,
    };
  }

  async getMonthAgoDiffMessage(username, timePeriod) {
    const diff = await this.getMonthAgoDiff(username);
    return `🎱 🎱 🎱 Fom ${timePeriod} ago: \n\n🔮 See your memories  > ${diff.phabricatorUrl} 🔮\n\nTitle: ${diff.title} \nSummary: ${diff.summary} \n\nBon travail !`;
  }
}

module.exports = { ConduitClient };
