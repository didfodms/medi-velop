const express = require("express");
const multer = require("multer");
const router = express.Router();

// set disk upload location
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    // cb(null, "emr" + "-" + uniqueSuffix);
    cb(null, "data" + ".csv");
  },
});

const upload = multer({ storage: storage });

// for csvToJson()
const fs = require("fs");
const path = require("path");
// const FILE_NAME = "data";

// for chatGPT(), getResponse()
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

// FHIR validate - using npm fhir module
const Fhir = require("fhir").Fhir;
const fhir = new Fhir();

// csv read -> convert json type // return json(stringified) csv contents
const csvToJson = (file_path, file_name) => {
  const csvPath = path.join(__dirname, file_path, file_name + ".csv");
  const csv = fs.readFileSync(csvPath, "utf-8");
  const rows = csv.split("\r\n");

  // if (rows[rows.length - 1] === "") {
  //   rows.pop();
  // }

  // let csvResults = [];
  // let columnTitle = [];
  // for (const i in rows) {
  //   const row = rows[i];
  //   const data = row.split(",");
  //   if (i === "0") {
  //     columnTitle = data;
  //   } else {
  //     let row_data = {};
  //     for (const index in columnTitle) {
  //       const title = columnTitle[index];
  //       row_data[title] = data[index];
  //     }
  //     csvResults.push(row_data);
  //   }
  // }

  let csvResults = [];
  let columnTitle = [];

  for (const i in rows) {
    const row = rows[i];
    const data = row.split(",");

    if (data[0].trim() === "") {
      break; // 비어있는 행이면 그만 읽기
    }

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

  return JSON.stringify(csvResults);
};

// chatGPT 학습 부분***
const appendChatGPTMsg = (MsgObj, roles, contents) => {
  MsgObj.push({ role: roles, content: contents });
  return MsgObj;
};

// ChatGPT study messages*** (ChatGPT가 학습할 message 객체 배열)
const studyMsg = [
  {
    role: "system",
    content: `You will act as a FHIR Resource database that converts and stores MIMIC 3 data to FHIR.
    Now, we will present hypothetical medical data based on MIMIC 3 schema in tabular format.
    Determine which table the MIMIC 3 data extracted from the MIMIC 3 database table is from, convert it into the most appropriate FHIR resource, and provide it json format.
    (please returns the converted results as an array)`,
  },
];
// call ChatGPT API and get ChatGPT response
const chatGPT = async (roles, prompt) => {
  const openai = new OpenAIApi(configuration);
  // roles : system, user, assistant
  appendChatGPTMsg(studyMsg, roles, prompt);
  const response = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: studyMsg,
  });

  return response["data"]["choices"][0]["message"]["content"];
};

// for using return value : getResponse().then()
const getResponse = async (emr) => {
  return await chatGPT("user", emr);
};

// save chatGPT response to chatGPT API
const saveResponse = async (response) => {
  appendChatGPTMsg(studyMsg, "assistant", response);
};

// extract only fhir resource from ChatGPT response
const extractFhirResource = (response) => {
  console.log(
    "\n############## chatGPT Response ##############\n",
    response,
    "\n##############################################\n"
  );

  const regex = /```([^`]+)```/g;
  const result = response.match(regex);

  const lines = result[0].split(/[\n\r]+/);
  const jsonArray = lines.slice(1, lines.length - 1);

  const jsonObjects = jsonArray.map((jsonString) => jsonString.trim()).join("");

  const jsonString = JSON.stringify(jsonObjects);
  let fhir = JSON.parse(JSON.parse(jsonString));
  if (!Array.isArray(fhir)) {
    fhir = [fhir];
  }

  return fhir;
};

// fhir validation function // return object true or false (included error message)
const validateFhir = (fhirJson) => {
  return fhir.validate(fhirJson, { errorOnUnexpected: true });
};

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});

// csv 파일 업로드와 동시에 csvJson에 json형식으로 변환한 csv 파일 내용 저장
let csvJson = "";
router.post("/file/post", upload.single("file"), (req, res, next) => {
  if (!req.file.mimetype.startsWith("text/csv")) {
    return res.status(422).json({
      error: "csv 형식만 업로드 가능합니다",
    });
  }

  csvJson = csvToJson("../uploads", "data");
  console.log("\n################## CSV to JSON !! ##################\n");
  console.log(csvJson);
  console.log("\n####################################################\n");
  return res.status(200).send(req.file);
});

// chatGPT API를 호출하고 fhir convert 및 extract 시작
router.post("/file/convert-fhir", async (req, res, next) => {
  let fhirResource = {};
  console.log("\n################## fhir convert start!! ##################\n");

  // 오류를 고칠 기회는 다섯 번!!
  // 오류가 발생했을 경우 true. 오류가 없을 경우 false.
  let error_flag = true;
  let prompt = csvJson;
  for (let i = 0; i < 5 && error_flag; i++) {
    // prompt 내용이 비어있지 않다면
    if (prompt !== "") {
      const result = await getResponse(prompt);

      // chatGPT의 응답을 문맥에 저장
      await saveResponse(result);
      console.log("after save chatGPT response", studyMsg);
      // ChatGPT 응답에서 FHIR만을 추출
      fhirResource = await extractFhirResource(result);

      console.log(
        "\n############## converted fhirJson ##############\n",
        await fhirResource,
        "\n################################################\n"
      );

      console.log("변환된 FHIR 리소스의 수 : ", fhirResource.length, " 개");
      // 변환된 fhir Resource 배열을 순차적으로 검증
      // 검증 과정에서 하나라도 오류가 나타날시, 새로
      fhirResource.forEach((resource, index) => {
        const validObj = validateFhir(resource);
        console.log(`validate fhir result ${index + 1} : `, validObj);

        const valid = validObj.valid;
        console.log(valid, typeof valid);
        // fhir validate에서 false가 반환되었을 경우
        let errMsg = "";
        if (!valid) {
          validObj.messages.forEach((row, index) => {
            errMsg += row.message;

            if (index !== validObj.messages.length - 1) {
              errMsg += "\n";
            }
          });

          const errPrompt = `"${errMsg}"
      The following error appears. Please refer to the error above and recreate the verified FHIR resource in the same format.`;
          prompt = errPrompt;
          console.log("after save errorMsg prompt", studyMsg);
          error_flag = true;
          return false;
        } // fhir validate가 true인 경우
        else {
          console.log(`valid 성공!!`);
          error_flag = false;
        }
      });
    } else {
      // csv 파일이 비어있을 경우..
      console.log("csv 파일을 업로드 해주세요.");

      break;
    }
  }

  if (!error_flag) {
    console.log("**********************************************");
    console.log("** fhir 리소스가 성공적으로 변환되었습니다! **");
    console.log("**********************************************");

    // 변환 성공시 반환되는 객체
    res.json({
      error: error_flag,
      messages: "fhir convert success",
      contents: fhirResource,
    });
  } else {
    console.log("*** fhir 변환 실패 ***");

    // 변환 실패시 반환되는 객체
    res.json({
      error: error_flag,
      messages: "fhir convert failed",
    });
  }
});

module.exports = router;
