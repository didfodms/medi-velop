## 📊EMR? 🔥FHIR?
EMR과 FHIR라는 용어가 익숙하지 않으신 분들이 있을텐데요.

- *EMR*(Electronic Medical Record) : 전자의무기록으로, 병원에 내방한 환자에 대한 진료기록을 기존 종이에 기록하던 것을 컴퓨터를 이용해 전자적 형태로 기록한 것입니다.
- *FHIR*(Fast Healthcare Interoperability Resource) : 의료정보 기술표준을 목적으로 하는 국제기구 HL7에서 개발한 차세대 의료정보 표준 프레임워크입니다.

단순하게 말하자면, EMR은 컴퓨터에 저장 가능한 전자적 형태의 의료정보이고 FHIR는 국제적인 의료정보 표준 프레임워크라고 보시면 됩니다. 

## 🗨️ 의료정보 표준화, 왜 필요한가?
현재 한국의 병원에서는 각 병원·기관별 다른 EMR 서비스로 의료데이터를 저장하고 있습니다. 의료정보를 하나의 표준으로 통일하고 있지 않아 관리가 어렵고 데이터 분석에 있어서도 제한적이죠😭
이렇게 국제적으로 표준화되어 있지 않은 의료정보는 국가간의 교류도 제한되어 코로나19와 같은 전염병이 다시 발생할 경우, 신속한 정보 교류가 힘들어 의료기술의 발전을 저해할 가능성이 있습니다.
실제로 이를 표준화하기 위해 국가의 표준화 연구사업이 진행 중에 있고 각기 다른 회사들은 여러 복잡한 단계들을 바탕으로 데이터 표준화에 몰두하고 있습니다!🔥🔥

## 😓 어려운 표준화 현실..
하지만 사실 의료정보 표준화는 쉬운 것이 아닙니다. 현재 진행 중인 의료정보 표준화 연구들이 쉽게 성과를 내지 못하고 있는 이유이기도 하죠. 그러한 이유는 크게 두 가지로 나눌 수 있습니다.

- *🙅전문인력 부족 문제🙅* : 컴퓨터에 저장되어 있는 방대한 양의 EMR을 모두 표준화 한다는 것은 기술적인 능력이 요구됩니다. 동시에 의료기술에 관련한 지식 역시 요구되죠. 이러한 능력을 겸비한 인재를 찾기란 정말 어려운 일입니다.
- *💲비용 문제💲* : 표준화 연구를 진행하고 있는 연구원들조차 대부분은 위와 같은 능력을 동시에 겸비하고 있지 않습니다. 이에 인건비 외에도 교육적인 비용이 들어가고, 시간적인 비용 역시 만만치 않겠죠. 

## 💡 그래서 사용합니다. ChatGPT!
대형 언어 모델인 ChatGPT를 사용하여 표준화 작업을 자동화한다면 위와 같은 문제들을 해결할 수 있습니다. 메디벨롭팀은 테스트를 통해 ChatGPT가 EMR을 유효성이 검증된 FHIR로 적절하게 변환시켜 주는 것을 확인했습니다.

보여드릴 웹 서비스는 다음과 같습니다.

## 1. 사용자 로그인 & 회원가입 기능
사용자는 로그인 & 회원가입을 통해 자신의 병원·기관 계정으로 접속이 가능합니다.
<img width="1892" height="920" alt="image" src="https://raw.githubusercontent.com/didfodms/medi-velop/main/gif/login_register.gif" />
실제로 구현될 서비스에는 회원가입 페이지의 입력 필드에는 자신이 속한 병원·기관을 등록할 수 있는 필드가 추가될 것입니다.

## 2. EMR 파일 업로드 기능
사용자는 FHIR 표준으로 자동 변환할 의료정보 EMR을 CSV형태의 파일로 업로드할 수 있습니다.
<img width="1900" height="926" alt="image" src="https://raw.githubusercontent.com/didfodms/medi-velop/main/gif/upload_csv.gif" />
사용한 더미 EMR 데이터 data.csv는 MIMIC-III 데이터베이스의 patient 테이블의 스키마로부터 생성한 가상의 데이터로 내용은 다음과 같습니다.

- *MIMIC-III 데이터베이스* : 미국의 the Beth Israel Deaconess Medical Center 중환자실에 내원한 성인 및 신생아 환자의 데이터를 전 세계 연구자들에게 무료로 공개한 데이터베이스

|SUBJECT_ID|GENDER|DOB|DOD|HADM_ID|
|---|---|---|---|---|
|100001|F|1971-08-07|NULL|100001|
|100002|M|1985-04-15|NULL|100002|
|100003|F|1978-11-26|NULL|100003|
|100004|M|1965-06-11|2015-03-25|100004|
|100005|F|1992-09-03|NULL|100005|

## 3. ChatGPT API를 활용한 FHIR 표준 자동변환 기능
위에서 업로드된 CSV형태의 EMR은 `root/uploads`에 저장됩니다.
사용자가 EMR 파일을 업로드할때, 위 경로에서 CSV 파일을 찾아 사전에 설정된 prompt로 FHIR 표준으로 변환을 시작합니다.

### EMR to JSON
이때, 업로드된 EMR 파일은 FHIR 변환 정확도를 높이기 위해 출력 형식과 같은 JSON형식로 변환하여 ChatGPT API에게 제공하게 됩니다.

```js
// EMR to JSON
const fs = require("fs");
const path = require("path");
const FILE_NAME = "data";

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
```

다음은 사용자가 업로드한 CSV형식의 EMR 파일을 JSON형식으로 변환하여 `csvResults`변수에 할당하는 node.js 코드입니다.

### JSON to FHIR
이제 csvResults 변수에 할당된 JSON형식의 EMR을 포함하여 작성된 prompt 매개변수로 FHIR 자동 변환을 위한 ChatGPT API를 호출합니다.

```js
// JSON to FHIR - ChatGPT API
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
        content:
          "Now I will give you virtual medical data based on MIMIC 3 schema in tabular form. Map that synthetic data to the most appropriate FHIR resource and expose it in json format.",
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

const getChatGPTAnswer = async (userQuery) => {
  return await new Promise((resolve, reject) => {
    chatGPT(userQuery);
  });
};

const chatGPTAnswer = getChatGPTAnswer(userQuery);
console.log(chatGPTAnswer);
```

## 변환된 FHIR 유효성 검증
ChatGPT API의 결과로 EMR에서 변환된 FHIR 표준은 FHIR 데이터 모델과 형식이 일치하는지 그 유효성을 검증해야 합니다. FHIR 표준의 유효성 검증에는 npm fhir모듈의 validate() 함수를 사용합니다.

```js
// FHIR validate - npm fhir module
const Fhir = require("fhir").Fhir;
const fhir = new Fhir();

const results = fhir.validate(resource, { errorOnUnexpected: true });
console.log(results);
```

위 코드는 `validate()`함수로 FHIR의 유효성을 검증한 결과를 콘솔에 나타냅니다. `validate()` 함수는 넘겨준 매개변수 `resource`가 FHIR 표준에 있어서 유효한 경우 `true`를 포함한 객체를 반환하고, 유효하지 않은 경우 `false`와 에러 메세지를 포함한 객체를 반환합니다.

- FHIR 유효성이 검증된 경우의 validate() 응답 <img width="933" height="42" alt="image" src="https://github.com/user-attachments/assets/06e8239e-de20-412a-81b1-5dc84b763fe4" />
- FHIR 유효성이 검증되지 않은 경우의 validate() 응답 <img width="977" height="252" alt="image" src="https://github.com/user-attachments/assets/73bc0cff-88f6-42a5-b36c-61aedab01800" />

다음은 `validate()`함수를 활용하여 ChatGPT API로부터 유효한 FHIR를 변환하는 알고리즘의 순서도를 나타낸 그림입니다.

<img width="886" height="297" alt="image" src="https://github.com/user-attachments/assets/ef94d731-43ec-4783-a6db-0a4b730f1b16" />

ChatGPT API는 `validate()`함수의 반환이 `true`가 될 때까지 호출되면서 EMR을 유효성이 검증된 FHIR를 변환할 수 있게 됩니다.
위 알고리즘을 자동화해서 방대한 양의 EMR을 FHIR 표준으로 빠르게 변환 가능할 것입니다.

## 4. 의료인 오류 교정 UI 제공
위에서 `validate()`가 검증하는 유효성이란, 변환한 FHIR의 필드가 FHIR 표준과 일치하는지만을 검증하며, 어떠한 필드에 매칭된 값의 연관성은 검증하지 않습니다. 이것을 검증하는 것은 의료 지식이 있는 전문가만이 가능하다고 판단하여, 변환된 FHIR 표준을 사용자가 최종 검수하여 수정할 수 있는 오류 교정 UI를 제공합니다.

<img width="1900" height="930" alt="image" src="https://github.com/user-attachments/assets/6a1771e5-b138-444c-9afd-f9bb2f92f8ed" />

사용자의 피드백으로 교정된 오류는 ChatGPT가 강화학습하며 점차 정확도가 100에 수렴하는 FHIR 표준 자동변환기겸 오류교정 시스템으로 발전할 수 있습니다!

## 🌐 서비스 효과
앞서 설명한 웹플랫폼 서비스에서 반복적인 FHIR 표준 유효성 검증과 사용자의 오류 교정을 통해 100에 수렴하는 정확도로 변환된 FHIR 표준의 의료정보는 FHIR 서버에 저장되어 관리됩니다. 추후 FHIR 서버에서 제공하는 RESTful API를 활용한다면 더욱 효과적으로 표준화된 의료정보를 관리하고, 분석하며, 교류할 수 있을 것입니다.

메디벨롭팀은 국가간의 원활한 의료정보 공유 및 데이터 분석을 통한 의료 수준 향상 기여를 도모합니다✊🌏

## medi-velop 실행 방법

1. 프로젝트 root 폴더로 이동
```cd medi-velop```
2. npm module 및 library 설치
```npm install```
3. npm 서버 실행
```npm run dev```
4. `localhost:3000` 또는 `127.0.0.1:3000` 으로 접속
