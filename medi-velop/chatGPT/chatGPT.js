const fs = require("fs");
const path = require("path");
const FILE_NAME = "data";

const csvPath = path.join(__dirname, "../uploads", FILE_NAME + ".csv");
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

// console.log(csvResults);

// chatGPT API
require("dotenv").config();

const { Configuration, OpenAIApi } = require("openai");

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
        content: `Now I will give you virtual medical data based on 
          MIMIC 3 schema in tabular form. 
          Map that synthetic data to the most appropriate 
          FHIR resource and expose it 
          in json format.`,
      },
      { role: "user", content: prompt },
    ],
  });

  return response["data"]["choices"][0]["message"]["content"];
};

// CSV to JSON의 EMR JSON
const emrJSON = JSON.stringify(csvResults);

// get FHIR from chatGPT
const getResponse = async (emr) => {
  return await chatGPT(emr);
};

// FHIR만 추출하기
getResponse(emrJSON).then((response) => {
  const regex = /```([^`]+)```/g;
  const result = response.match(regex);
  // console.log(result[0]);
  const lines = result[0].split(/[\n\r]+/);
  const jsonArray = lines.slice(1, lines.length - 1);
  // 배열의 각 원소를 JavaScript 객체로 변환
  const jsonObjects = jsonArray.map((jsonString) => jsonString.trim()).join("");
  const jsonString = JSON.stringify("[" + jsonObjects + "]");
  const fhir = JSON.parse(JSON.parse(jsonString));

  console.log("type : ", typeof fhir);
  console.log("fhir : ", fhir);
  console.log("fhir resourceType : ", fhir[0].resourceType);

  // // 객체들을 하나로 합치기
  // const jsonObject = Object.assign({}, ...jsonObjects);

  // console.log(jsonObject, typeof jsonObject, jsonObject.length);

  // const lines = result.split(/[\n\r]+/);
  // const convertFhir = lines.slice(1, lines.length - 1);

  // console.log("FHIR result", convertFhir);
});

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
