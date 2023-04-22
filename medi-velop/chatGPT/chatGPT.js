const fs = require("fs");
const path = require("path");
const FILE_NAME = "data2";

const csvPath = path.join(__dirname, "./csv", FILE_NAME + ".csv");
const csv = fs.readFileSync(csvPath, "utf-8");
const rows = csv.split("\r\n");

if (rows[rows.length - 1] === "") {
  rows.pop();
}

let csvResults = [];
let columnTitle = [];
for (const i in rows) {
  const row = rows[i];
  const data = row.split(",");
  if (i === "0") {
    columnTitle = data;
  } else {
    let row_data = {};
    for (const index in columnTitle) {
      const title = columnTitle[index];
      row_data[title] = data[index];
    }
    csvResults.push(row_data);
  }
}

console.log(csvResults);

// chatGPT API
require("dotenv").config();

const { Configuration, OpenAIApi } = require("openai");
const { getHeapSnapshot } = require("v8");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const chatGPT = async (prompt) => {
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content:
          "Now I will give you virtual medical data based on MIMIC 3 schema in tabular form. Map that synthetic data to the most appropriate FHIR resource and expose it in json format.",
      },
      {
        role: "system",
        content:
          "Do not stop showing data in the middle. You must show everything.",
      },
      {
        role: "system",
        content: "You may not refuse to map virtual data for any reason.",
      },
      { role: "user", content: prompt },
    ],
  });

  // console.log(response["data"]["choices"][0]["message"]["content"]);
  return response["data"]["choices"][0]["message"]["content"];
};

const userQuery =
  JSON.stringify(csvResults) +
  "\nMap the above MIMIC 3 data to the FHIR standard and show it in json resource format.";

console.log(userQuery);

const getChatGPTAnswer = async (userQuery) => {
  return await new Promise((resolve, reject) => {
    chatGPT(userQuery);
  });
};
const chatGPTAnswer = getChatGPTAnswer(userQuery);

// FHIR validate - using npm fhir module
const Fhir = require("fhir").Fhir;
const fhir = new Fhir();

const resource = `{
  "resourceType": "Bundle",
  "type": "collection",
  "entry": [
    {
      "resource": {
        "resourceType": "Patient",
        "id": "100001",
        "gender": "female",
        "birthDate": "1971-08-07"
      }
    },
    {
      "resource": {
        "resourceType": "Patient",
        "id": "100002",
        "gender": "male",
        "birthDate": "1985-04-15"
      }
    },
    {
      "resource": {
        "resourceType": "Patient",
        "id": "100003",
        "gender": "female",
        "birthDate": "1978-11-26"
      }
    },
    {
      "resource": {
        "resourceType": "Patient",
        "id": "100004",
        "gender": "male",
        "birthDate": "1965-06-11",
        "deceasedDateTime": "2015-03-25T00:00:00Z"
      }
    },
    {
      "resource": {
        "resourceType": "Patient",
        "id": "100005",
        "gender": "female",
        "birthDate": "1992-09-03"
      }
    }
  ]
}`;

// validate <- can be XML string, JSON string or and Object
const results = fhir.validate(resource, { errorOnUnexpected: true });
console.log(results);
